-- 种子数据：初始化游戏世界

-- 插入示例NPC
INSERT INTO npcs (id, name, location, is_alive, goals, state) VALUES
('npc_blacksmith_tom', '铁匠汤姆', 'starting_village', true, 
 '[{"type": "craft", "priority": 1, "description": "打造传世之作"}]',
 '{"mood": "focused", "inventory": ["iron_ingot", "coal"]}'),
 
('npc_merchant_lisa', '商人丽莎', 'starting_village', true,
 '[{"type": "trade", "priority": 1, "description": "积累财富"}]',
 '{"mood": "friendly", "gold": 1000}'),
 
('npc_guard_captain', '卫队长马克', 'starting_village', true,
 '[{"type": "protect", "priority": 1, "description": "保卫村庄"}]',
 '{"mood": "vigilant", "patrol_route": ["north_gate", "south_gate"]}')
ON CONFLICT (id) DO NOTHING;

-- 插入阵营
INSERT INTO factions (id, name, resources, territory) VALUES
('faction_empire', '帝国', 
 '{"gold": 100000, "soldiers": 5000, "influence": 80}',
 '["capital_city", "northern_province", "eastern_province"]'),
 
('faction_rebels', '叛军', 
 '{"gold": 20000, "soldiers": 1500, "influence": 30}',
 '["hidden_valley", "western_outpost"]'),
 
('faction_merchants_guild', '商人公会', 
 '{"gold": 150000, "soldiers": 500, "influence": 60}',
 '["trade_hub", "port_city"]')
ON CONFLICT (id) DO NOTHING;

-- 创建示例玩家（用于测试）
INSERT INTO players (name, level, experience, strength, vitality, agility, intelligence, luck, 
                     max_hp, current_hp, max_mp, current_mp, gold, location)
VALUES ('测试勇者', 1, 0, 10, 10, 10, 10, 10, 100, 100, 50, 50, 100, 'starting_village')
ON CONFLICT (name) DO NOTHING;

