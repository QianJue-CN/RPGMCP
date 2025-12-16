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
    luck INTEGER NOT NULL DEFAULT 10,
    
    -- 派生属性（计算得出，但缓存以提高性能）
    max_hp INTEGER NOT NULL DEFAULT 100,
    current_hp INTEGER NOT NULL DEFAULT 100,
    max_mp INTEGER NOT NULL DEFAULT 50,
    current_mp INTEGER NOT NULL DEFAULT 50,
    
    -- 资源
    gold INTEGER NOT NULL DEFAULT 0,
    stat_points INTEGER NOT NULL DEFAULT 0,
    
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
    player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    skill_id VARCHAR(100) NOT NULL,
    level INTEGER NOT NULL DEFAULT 1,
    experience INTEGER NOT NULL DEFAULT 0,
    
    UNIQUE(player_id, skill_id)
);

-- 阵营声望表
CREATE TABLE IF NOT EXISTS player_faction_standing (
    id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    faction_id VARCHAR(100) NOT NULL,
    reputation_value INTEGER NOT NULL DEFAULT 0, -- -1000 to 1000
    
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(player_id, faction_id)
);

-- NPC关系表
CREATE TABLE IF NOT EXISTS player_npc_relations (
    id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    npc_id VARCHAR(100) NOT NULL,
    
    -- 关系维度
    affection INTEGER NOT NULL DEFAULT 0, -- 好感度 -100 to 100
    loyalty INTEGER NOT NULL DEFAULT 0,   -- 忠诚度 0 to 100
    trust INTEGER NOT NULL DEFAULT 0,     -- 信任度 0 to 100
    
    -- 互动记录
    last_interaction TIMESTAMP,
    interaction_count INTEGER NOT NULL DEFAULT 0,
    
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(player_id, npc_id)
);

-- 同伴队伍表
CREATE TABLE IF NOT EXISTS player_companions (
    id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    npc_id VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true, -- 是否在当前队伍中
    
    recruited_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(player_id, npc_id)
);

-- NPC状态表
CREATE TABLE IF NOT EXISTS npcs (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(200) NOT NULL,
    is_alive BOOLEAN NOT NULL DEFAULT true,
    
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
CREATE INDEX idx_inventory_player ON inventory(player_id);
CREATE INDEX idx_equipment_player ON equipment(player_id);
CREATE INDEX idx_quests_player_status ON player_quests(player_id, status);
CREATE INDEX idx_skills_player ON player_skills(player_id);
CREATE INDEX idx_faction_standing_player ON player_faction_standing(player_id);
CREATE INDEX idx_npc_relations_player ON player_npc_relations(player_id);
CREATE INDEX idx_companions_player ON player_companions(player_id);

-- 初始化世界状态
INSERT INTO world_state (id, game_time, weather) VALUES (1, 0, 'clear') ON CONFLICT (id) DO NOTHING;

