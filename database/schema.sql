-- RPG Game System Database Schema for PostgreSQL
-- Version: 1.0.0

-- 玩家基础数据表
CREATE TABLE IF NOT EXISTS players (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    level INTEGER NOT NULL DEFAULT 1,
    experience INTEGER NOT NULL DEFAULT 0,

-- 基础属性
strength INTEGER NOT NULL DEFAULT 10,
vitality INTEGER NOT NULL DEFAULT 10,
agility INTEGER NOT NULL DEFAULT 10,
intelligence INTEGER NOT NULL DEFAULT 10,
wisdom INTEGER NOT NULL DEFAULT 10,
luck INTEGER NOT NULL DEFAULT 10,
charisma INTEGER NOT NULL DEFAULT 10,

-- 派生属性（计算得出，但缓存以提高性能）
max_hp INTEGER NOT NULL DEFAULT 100,
current_hp INTEGER NOT NULL DEFAULT 100,
max_mp INTEGER NOT NULL DEFAULT 50,
current_mp INTEGER NOT NULL DEFAULT 50,

-- 资源
gold INTEGER NOT NULL DEFAULT 0,
stat_points INTEGER NOT NULL DEFAULT 0,
skill_points INTEGER NOT NULL DEFAULT 0,

-- 位置信息
location VARCHAR(200) NOT NULL DEFAULT 'starting_village',

-- 时间戳
created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 背包物品表
CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    item_id VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    quality VARCHAR(20) DEFAULT 'normal', -- normal, fine, excellent, masterwork, legendary

-- 物品元数据（JSON格式存储特殊属性）


metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(player_id, item_id, quality)
);

-- 装备栏表
CREATE TABLE IF NOT EXISTS equipment (
    id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    slot VARCHAR(50) NOT NULL, -- weapon, armor, helmet, boots, accessory1, accessory2
    item_id VARCHAR(100) NOT NULL,
    quality VARCHAR(20) DEFAULT 'normal',

-- 装备属性加成（JSON格式）


bonuses JSONB DEFAULT '{}',
    
    equipped_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(player_id, slot)
);

-- 任务进度表
CREATE TABLE IF NOT EXISTS player_quests (
    id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    quest_id VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, completed, failed, expired

-- 任务目标进度（JSON格式）


objectives_progress JSONB DEFAULT '{}',
    
    accepted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    expires_at TIMESTAMP,
    
    UNIQUE(player_id, quest_id)
);

-- 技能数据表
CREATE TABLE IF NOT EXISTS player_skills (
    id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL REFERENCES players (id) ON DELETE CASCADE,
    skill_id VARCHAR(100) NOT NULL,
    level INTEGER NOT NULL DEFAULT 1,
    experience INTEGER NOT NULL DEFAULT 0,
    UNIQUE (player_id, skill_id)
);

-- 阵营声望表
CREATE TABLE IF NOT EXISTS player_faction_standing (
    id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL REFERENCES players (id) ON DELETE CASCADE,
    faction_id VARCHAR(100) NOT NULL,
    reputation_value INTEGER NOT NULL DEFAULT 0, -- -1000 to 1000
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (player_id, faction_id)
);

-- NPC关系表
CREATE TABLE IF NOT EXISTS player_npc_relations (
    id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    npc_id VARCHAR(100) NOT NULL,

-- 关系维度
affection INTEGER NOT NULL DEFAULT 0, -- 好感度 -100 to 100
loyalty INTEGER NOT NULL DEFAULT 0, -- 忠诚度 0 to 100
trust INTEGER NOT NULL DEFAULT 0, -- 信任度 -100 to 100

-- 互动记录


last_interaction TIMESTAMP,
    interaction_count INTEGER NOT NULL DEFAULT 0,
    
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(player_id, npc_id)
);

-- 同伴队伍表
CREATE TABLE IF NOT EXISTS player_companions (
    id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL REFERENCES players (id) ON DELETE CASCADE,
    npc_id VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true, -- 是否在当前队伍中
    recruited_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (player_id, npc_id)
);

-- NPC状态表
CREATE TABLE IF NOT EXISTS npcs (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(200) NOT NULL,
    is_alive BOOLEAN NOT NULL DEFAULT true,

-- 生命值属性
max_hp INTEGER NOT NULL DEFAULT 100,
current_hp INTEGER NOT NULL DEFAULT 100,

-- 战斗属性 (可选,用于战斗型NPC/敌人)
level INTEGER,
strength INTEGER,
vitality INTEGER,
agility INTEGER,
intelligence INTEGER,
luck INTEGER,

-- NPC目标和状态（JSON格式）


goals JSONB DEFAULT '[]',
    state JSONB DEFAULT '{}',
    
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 阵营数据表
CREATE TABLE IF NOT EXISTS factions (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,

-- 阵营资源
resources JSONB DEFAULT '{}',

-- 领土控制（JSON格式）


territory JSONB DEFAULT '[]',
    
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 世界状态表
CREATE TABLE IF NOT EXISTS world_state (
    id INTEGER PRIMARY KEY DEFAULT 1,
    game_time BIGINT NOT NULL DEFAULT 0, -- 游戏内时间（分钟）
    weather VARCHAR(50) DEFAULT 'clear',

-- 活跃事件（JSON格式）


active_events JSONB DEFAULT '[]',
    
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CHECK (id = 1) -- 确保只有一行
);

-- 存档表
CREATE TABLE IF NOT EXISTS saves (
    id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    save_name VARCHAR(200),

-- 完整游戏状态快照（JSON格式）


snapshot JSONB NOT NULL,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引以提高查询性能
CREATE INDEX idx_inventory_player ON inventory (player_id);

CREATE INDEX idx_equipment_player ON equipment (player_id);

CREATE INDEX idx_quests_player_status ON player_quests (player_id, status);

CREATE INDEX idx_skills_player ON player_skills (player_id);

CREATE INDEX idx_faction_standing_player ON player_faction_standing (player_id);

CREATE INDEX idx_npc_relations_player ON player_npc_relations (player_id);

CREATE INDEX idx_companions_player ON player_companions (player_id);

-- 制作职业熟练度表
CREATE TABLE IF NOT EXISTS player_crafting_proficiency (
    id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL REFERENCES players (id) ON DELETE CASCADE,
    profession VARCHAR(50) NOT NULL, -- blacksmith, alchemy, enchanting, tailoring, cooking, jewelcrafting
    level INTEGER NOT NULL DEFAULT 0,
    experience INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (player_id, profession)
);

-- 配方数据表（全局配方库）
CREATE TABLE IF NOT EXISTS recipes (
    id VARCHAR(100) PRIMARY KEY, -- 格式: RCP-{职业}-{4位数字}
    name VARCHAR(200) NOT NULL,
    profession VARCHAR(50) NOT NULL,
    tier INTEGER NOT NULL DEFAULT 1, -- 1-5
    proficiency_required INTEGER NOT NULL DEFAULT 0,
    proficiency_gain INTEGER NOT NULL DEFAULT 1,

-- 材料需求（JSON格式）
materials JSONB NOT NULL DEFAULT '[]',
-- 示例: [{"item_id": "iron_ore", "quantity": 3, "quality_min": "normal"}]

-- 工具需求（JSON格式）
tools_required JSONB DEFAULT '[]',

-- 工作台需求
workstation VARCHAR(100),

-- 制作时间（秒）
craft_time_seconds INTEGER NOT NULL DEFAULT 60,

-- 产出物品
output_item_id VARCHAR(100) NOT NULL,
output_quantity INTEGER NOT NULL DEFAULT 1,
output_quality_base VARCHAR(20) DEFAULT 'normal',

-- 解锁条件（JSON格式）
unlock_condition JSONB DEFAULT '{}',
-- 示例: {"type": "proficiency", "value": 100}

-- 配方描述


description TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 玩家已学配方表
CREATE TABLE IF NOT EXISTS player_recipes (
    id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL REFERENCES players (id) ON DELETE CASCADE,
    recipe_id VARCHAR(100) NOT NULL REFERENCES recipes (id) ON DELETE CASCADE,
    learned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (player_id, recipe_id)
);

-- 成就定义表（全局成就库）
CREATE TABLE IF NOT EXISTS achievements (
    id VARCHAR(100) PRIMARY KEY, -- 格式: ACH-{类型}-{4位数字}
    name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,

-- 成就类型
category VARCHAR(50) NOT NULL, -- combat, exploration, crafting, social, collection, story

-- 完成条件（JSON格式）
completion_criteria JSONB NOT NULL,
-- 示例: {"type": "kill_count", "target": "goblin", "required": 100}

-- 奖励（JSON格式）
rewards JSONB DEFAULT '{}',
-- 示例: {"title": "哥布林杀手", "achievement_points": 10, "stat_bonus": {"STR": 1}}

-- 是否隐藏
is_hidden BOOLEAN NOT NULL DEFAULT false,

-- 难度等级


difficulty VARCHAR(20) DEFAULT 'normal', -- easy, normal, hard, legendary

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 玩家成就进度表
CREATE TABLE IF NOT EXISTS player_achievements (
    id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    achievement_id VARCHAR(100) NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,

-- 进度（JSON格式，存储当前进度）
progress JSONB DEFAULT '{}',
-- 示例: {"current": 45, "required": 100}

-- 是否已完成
is_completed BOOLEAN NOT NULL DEFAULT false,

-- 完成时间


completed_at TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(player_id, achievement_id)
);

-- 玩家成就统计表
CREATE TABLE IF NOT EXISTS player_achievement_stats (
    player_id INTEGER PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,

-- 成就点数
achievement_points INTEGER NOT NULL DEFAULT 0,

-- 已完成成就数量
completed_count INTEGER NOT NULL DEFAULT 0,

-- 统计数据（JSON格式，用于成就追踪）


statistics JSONB DEFAULT '{}',
    -- 示例: {"enemies_killed": {"goblin": 45, "orc": 12}, "items_crafted": 150, "distance_traveled": 5000}

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 材料数据表（全局材料库）
CREATE TABLE IF NOT EXISTS materials (
    id VARCHAR(100) PRIMARY KEY, -- 格式: MAT-{类型}-{4位数字}
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL, -- ore, herb, leather, cloth, gem, essence, reagent, misc
    tier INTEGER NOT NULL DEFAULT 1, -- 1-5

-- 材料属性（JSON格式）
properties JSONB DEFAULT '{}',
-- 示例: {"hardness": 50, "potency": 30, "mana_affinity": 20}

-- 获取来源（JSON格式）
sources JSONB DEFAULT '[]',
-- 示例: ["mining", "monster_drop:goblin", "vendor:blacksmith"]

-- 堆叠上限


stack_limit INTEGER NOT NULL DEFAULT 99,

    description TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_crafting_proficiency_player ON player_crafting_proficiency (player_id);

CREATE INDEX idx_player_recipes_player ON player_recipes (player_id);

CREATE INDEX idx_recipes_profession ON recipes (profession);

CREATE INDEX idx_player_achievements_player ON player_achievements (player_id);

CREATE INDEX idx_player_achievements_completed ON player_achievements (player_id, is_completed);

CREATE INDEX idx_achievements_category ON achievements (category);

CREATE INDEX idx_materials_type ON materials(type);

-- 初始化世界状态
INSERT INTO
    world_state (id, game_time, weather)
VALUES (1, 0, 'clear')
ON CONFLICT (id) DO NOTHING;