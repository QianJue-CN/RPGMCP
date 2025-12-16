-- 性能优化索引补充脚本
-- 用于添加建议的索引以提升查询性能

-- 1. 优化按item_id查询背包
CREATE INDEX IF NOT EXISTS idx_inventory_item ON inventory (item_id);

-- 2. 优化按item_id和quality组合查询背包
CREATE INDEX IF NOT EXISTS idx_inventory_item_quality ON inventory (item_id, quality);

-- 3. 优化NPC按位置查询
CREATE INDEX IF NOT EXISTS idx_npcs_location ON npcs (location);

-- 4. 优化NPC存活状态查询
CREATE INDEX IF NOT EXISTS idx_npcs_alive ON npcs (is_alive);

-- 5. 优化配方按等级查询
CREATE INDEX IF NOT EXISTS idx_recipes_tier ON recipes (tier);

-- 6. 优化配方按职业和等级组合查询
CREATE INDEX IF NOT EXISTS idx_recipes_profession_tier ON recipes (profession, tier);

-- 7. 优化任务按quest_id查询
CREATE INDEX IF NOT EXISTS idx_player_quests_quest ON player_quests (quest_id);

-- 8. 优化NPC关系按npc_id查询
CREATE INDEX IF NOT EXISTS idx_npc_relations_npc ON player_npc_relations (npc_id);

-- 9. 优化同伴按npc_id查询
CREATE INDEX IF NOT EXISTS idx_companions_npc ON player_companions (npc_id);

-- 10. 优化同伴按激活状态查询
CREATE INDEX IF NOT EXISTS idx_companions_active ON player_companions (player_id, is_active);

-- 11. 优化存档按创建时间查询
CREATE INDEX IF NOT EXISTS idx_saves_created ON saves (created_at DESC);

-- 12. 优化成就按类别和难度查询
CREATE INDEX IF NOT EXISTS idx_achievements_category_difficulty ON achievements (category, difficulty);

-- 13. 优化材料按类型和等级查询
CREATE INDEX IF NOT EXISTS idx_materials_type_tier ON materials (type, tier);

-- 14. 优化玩家按位置查询
CREATE INDEX IF NOT EXISTS idx_players_location ON players (location);

-- 15. 优化玩家按等级查询
CREATE INDEX IF NOT EXISTS idx_players_level ON players (level DESC);

-- 完成
SELECT 'Performance indexes added successfully' AS status;

