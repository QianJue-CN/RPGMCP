-- ============================================
-- RPG MCP 数据库优化脚本
-- 包含:CHECK约束、复合索引、物化视图
-- ============================================

-- ============================================
-- 第一部分: 添加 CHECK 约束
-- ============================================

-- 玩家表约束
ALTER TABLE players
ADD CONSTRAINT check_level CHECK (
    level >= 1
    AND level <= 100
);

ALTER TABLE players
ADD CONSTRAINT check_hp CHECK (
    current_hp >= 0
    AND current_hp <= max_hp
);

ALTER TABLE players
ADD CONSTRAINT check_mp CHECK (
    current_mp >= 0
    AND current_mp <= max_mp
);

ALTER TABLE players
ADD CONSTRAINT check_stats CHECK (
    strength >= 1
    AND strength <= 999
    AND vitality >= 1
    AND vitality <= 999
    AND agility >= 1
    AND agility <= 999
    AND intelligence >= 1
    AND intelligence <= 999
);

ALTER TABLE players
ADD CONSTRAINT check_gold CHECK (
    gold >= 0
    AND gold <= 999999999
);

ALTER TABLE players
ADD CONSTRAINT check_experience CHECK (
    experience >= 0
    AND experience < exp_to_next_level
);

-- 背包表约束
ALTER TABLE inventory
ADD CONSTRAINT check_quantity CHECK (quantity > 0);

-- 技能表约束
ALTER TABLE player_skills
ADD CONSTRAINT check_skill_level CHECK (
    level >= 0
    AND level <= 100
);

ALTER TABLE player_skills
ADD CONSTRAINT check_skill_experience CHECK (experience >= 0);

-- 任务表约束
ALTER TABLE player_quests
ADD CONSTRAINT check_quest_status CHECK (
    status IN (
        'active',
        'completed',
        'failed',
        'abandoned'
    )
);

-- 制作熟练度约束
ALTER TABLE player_crafting_proficiency
ADD CONSTRAINT check_proficiency_level CHECK (
    level >= 0
    AND level <= 100
);

ALTER TABLE player_crafting_proficiency
ADD CONSTRAINT check_proficiency_experience CHECK (experience >= 0);

-- 成就进度约束
ALTER TABLE player_achievements
ADD CONSTRAINT check_achievement_progress CHECK (
    progress >= 0
    AND progress <= requirement
);

-- ============================================
-- 第二部分: 添加复合索引
-- ============================================

-- 优化背包查询 (玩家ID + 物品ID)
CREATE INDEX IF NOT EXISTS idx_inventory_player_item ON inventory (player_id, item_id);

-- 优化装备查询 (玩家ID + 槽位)
CREATE INDEX IF NOT EXISTS idx_equipment_player_slot ON equipment (player_id, slot);

-- 优化任务查询 (玩家ID + 状态 + 过期时间)
CREATE INDEX IF NOT EXISTS idx_quests_player_status_expires ON player_quests (player_id, status, expires_at);

-- 优化技能查询 (玩家ID + 技能ID)
CREATE INDEX IF NOT EXISTS idx_skills_player_skill ON player_skills (player_id, skill_id);

-- 优化阵营声望查询 (玩家ID + 阵营ID)
CREATE INDEX IF NOT EXISTS idx_faction_player_faction ON player_faction_standing (player_id, faction_id);

-- 优化NPC关系查询 (玩家ID + NPC ID)
CREATE INDEX IF NOT EXISTS idx_npc_relations_player_npc ON player_npc_relations (player_id, npc_id);

-- 优化同伴查询 (玩家ID + 激活状态)
CREATE INDEX IF NOT EXISTS idx_companions_player_active ON player_companions (player_id, is_active);

-- 优化配方查询 (玩家ID + 配方ID)
CREATE INDEX IF NOT EXISTS idx_player_recipes_player_recipe ON player_recipes (player_id, recipe_id);

-- 优化成就查询 (玩家ID + 成就ID)
CREATE INDEX IF NOT EXISTS idx_achievements_player_achievement ON player_achievements (player_id, achievement_id);

-- 优化成就查询 (玩家ID + 完成状态)
CREATE INDEX IF NOT EXISTS idx_achievements_player_completed ON player_achievements (player_id, completed);

-- ============================================
-- 第三部分: 创建物化视图
-- ============================================

-- 玩家完整状态物化视图
CREATE MATERIALIZED VIEW IF NOT EXISTS player_full_status AS
SELECT
    p.*,
    COUNT(DISTINCT i.id) as inventory_count,
    COUNT(DISTINCT e.id) as equipment_count,
    COUNT(DISTINCT q.id) FILTER (
        WHERE
            q.status = 'active'
    ) as active_quest_count,
    COUNT(DISTINCT q.id) FILTER (
        WHERE
            q.status = 'completed'
    ) as completed_quest_count,
    COUNT(DISTINCT s.id) as skill_count,
    COUNT(DISTINCT pc.id) FILTER (
        WHERE
            pc.is_active = true
    ) as active_companion_count,
    COUNT(DISTINCT pa.id) FILTER (
        WHERE
            pa.completed = true
    ) as achievement_count
FROM
    players p
    LEFT JOIN inventory i ON p.id = i.player_id
    LEFT JOIN equipment e ON p.id = e.player_id
    LEFT JOIN player_quests q ON p.id = q.player_id
    LEFT JOIN player_skills s ON p.id = s.player_id
    LEFT JOIN player_companions pc ON p.id = pc.player_id
    LEFT JOIN player_achievements pa ON p.id = pa.player_id
GROUP BY
    p.id;

-- 为物化视图创建唯一索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_player_full_status_id ON player_full_status (id);

-- 创建索引以加速物化视图查询
CREATE INDEX IF NOT EXISTS idx_player_full_status_name ON player_full_status (name);

CREATE INDEX IF NOT EXISTS idx_player_full_status_level ON player_full_status (level DESC);

-- 玩家统计物化视图
CREATE MATERIALIZED VIEW IF NOT EXISTS player_statistics AS
SELECT
    p.id,
    p.name,
    p.class,
    p.level,
    -- 战斗统计
    COALESCE(pas.total_damage_dealt, 0) as total_damage_dealt,
    COALESCE(pas.total_damage_taken, 0) as total_damage_taken,
    COALESCE(pas.enemies_defeated, 0) as enemies_defeated,
    COALESCE(pas.deaths, 0) as deaths,
    -- 任务统计
    COUNT(DISTINCT q.id) FILTER (
        WHERE
            q.status = 'completed'
    ) as quests_completed,
    -- 制作统计
    COALESCE(pas.items_crafted, 0) as items_crafted,
    -- 成就统计
    COUNT(DISTINCT pa.id) FILTER (
        WHERE
            pa.completed = true
    ) as achievements_unlocked,
    -- 财富统计
    p.gold as current_gold,
    COALESCE(pas.total_gold_earned, 0) as total_gold_earned,
    COALESCE(pas.total_gold_spent, 0) as total_gold_spent
FROM
    players p
    LEFT JOIN player_quests q ON p.id = q.player_id
    LEFT JOIN player_achievements pa ON p.id = pa.player_id
    LEFT JOIN player_achievement_stats pas ON p.id = pas.player_id
GROUP BY
    p.id,
    p.name,
    p.class,
    p.level,
    p.gold,
    pas.total_damage_dealt,
    pas.total_damage_taken,
    pas.enemies_defeated,
    pas.deaths,
    pas.items_crafted,
    pas.total_gold_earned,
    pas.total_gold_spent;

-- 为统计视图创建索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_player_statistics_id ON player_statistics (id);

CREATE INDEX IF NOT EXISTS idx_player_statistics_level ON player_statistics (level DESC);

CREATE INDEX IF NOT EXISTS idx_player_statistics_achievements ON player_statistics (achievements_unlocked DESC);

-- ============================================
-- 第四部分: 刷新物化视图的函数
-- ============================================

-- 创建刷新所有物化视图的函数
CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY player_full_status;
  REFRESH MATERIALIZED VIEW CONCURRENTLY player_statistics;
END;
$$ LANGUAGE plpgsql;

-- 创建定时刷新的触发器函数
CREATE OR REPLACE FUNCTION auto_refresh_player_views()
RETURNS trigger AS $$
BEGIN
  -- 异步刷新物化视图(不阻塞当前操作)
  PERFORM pg_notify('refresh_views', 'player_views');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为关键表添加触发器
CREATE TRIGGER trigger_refresh_player_views_on_player_update
  AFTER INSERT OR UPDATE OR DELETE ON players
  FOR EACH STATEMENT
  EXECUTE FUNCTION auto_refresh_player_views();

CREATE TRIGGER trigger_refresh_player_views_on_quest_update
  AFTER INSERT OR UPDATE OR DELETE ON player_quests
  FOR EACH STATEMENT
  EXECUTE FUNCTION auto_refresh_player_views();

CREATE TRIGGER trigger_refresh_player_views_on_achievement_update
  AFTER INSERT OR UPDATE OR DELETE ON player_achievements
  FOR EACH STATEMENT
  EXECUTE FUNCTION auto_refresh_player_views();

-- ============================================
-- 第五部分: 性能分析辅助函数
-- ============================================

-- 创建查询性能分析函数
CREATE OR REPLACE FUNCTION analyze_query_performance(query_text text)
RETURNS TABLE (
  plan_line text
) AS $$
BEGIN
  RETURN QUERY EXECUTE 'EXPLAIN ANALYZE ' || query_text;
END;
$$ LANGUAGE plpgsql;

-- 创建表统计信息函数
CREATE OR REPLACE FUNCTION get_table_stats(table_name text)
RETURNS TABLE (
  table_name text,
  row_count bigint,
  total_size text,
  table_size text,
  indexes_size text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    table_name::text,
    (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND tables.table_name = get_table_stats.table_name)::bigint,
    pg_size_pretty(pg_total_relation_size(table_name::regclass)),
    pg_size_pretty(pg_relation_size(table_name::regclass)),
    pg_size_pretty(pg_total_relation_size(table_name::regclass) - pg_relation_size(table_name::regclass));
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 完成信息
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '数据库优化完成!';
  RAISE NOTICE '- 已添加 CHECK 约束';
  RAISE NOTICE '- 已创建复合索引';
  RAISE NOTICE '- 已创建物化视图';
  RAISE NOTICE '- 已设置自动刷新触发器';
  RAISE NOTICE '使用 SELECT refresh_all_materialized_views() 手动刷新视图';
END $$;