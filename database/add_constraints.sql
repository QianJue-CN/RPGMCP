-- 数据完整性约束补充脚本
-- 用于添加CHECK约束以确保数据符合业务规则

-- 1. player_npc_relations 表的范围约束
ALTER TABLE player_npc_relations 
  DROP CONSTRAINT IF EXISTS check_affection_range,
  DROP CONSTRAINT IF EXISTS check_loyalty_range,
  DROP CONSTRAINT IF EXISTS check_trust_range;

ALTER TABLE player_npc_relations 
  ADD CONSTRAINT check_affection_range CHECK (affection >= -100 AND affection <= 100),
  ADD CONSTRAINT check_loyalty_range CHECK (loyalty >= 0 AND loyalty <= 100),
  ADD CONSTRAINT check_trust_range CHECK (trust >= -100 AND trust <= 100);

-- 2. player_faction_standing 表的声望范围约束
ALTER TABLE player_faction_standing
  DROP CONSTRAINT IF EXISTS check_reputation_range;

ALTER TABLE player_faction_standing
  ADD CONSTRAINT check_reputation_range CHECK (reputation_value >= -1000 AND reputation_value <= 1000);

-- 3. inventory 表的品质值约束
ALTER TABLE inventory
  DROP CONSTRAINT IF EXISTS check_quality_values;

ALTER TABLE inventory
  ADD CONSTRAINT check_quality_values CHECK (quality IN ('normal', 'fine', 'excellent', 'masterwork', 'legendary'));

-- 4. equipment 表的品质值约束
ALTER TABLE equipment
  DROP CONSTRAINT IF EXISTS check_equipment_quality;

ALTER TABLE equipment
  ADD CONSTRAINT check_equipment_quality CHECK (quality IN ('normal', 'fine', 'excellent', 'masterwork', 'legendary'));

-- 5. player_quests 表的状态值约束
ALTER TABLE player_quests
  DROP CONSTRAINT IF EXISTS check_quest_status;

ALTER TABLE player_quests
  ADD CONSTRAINT check_quest_status CHECK (status IN ('active', 'completed', 'failed', 'expired'));

-- 6. players 表的属性范围约束
ALTER TABLE players
  DROP CONSTRAINT IF EXISTS check_positive_stats,
  DROP CONSTRAINT IF EXISTS check_hp_range,
  DROP CONSTRAINT IF EXISTS check_mp_range;

ALTER TABLE players
  ADD CONSTRAINT check_positive_stats CHECK (
    strength > 0 AND vitality > 0 AND agility > 0 AND 
    intelligence > 0 AND luck > 0 AND level > 0
  ),
  ADD CONSTRAINT check_hp_range CHECK (current_hp >= 0 AND current_hp <= max_hp AND max_hp > 0),
  ADD CONSTRAINT check_mp_range CHECK (current_mp >= 0 AND current_mp <= max_mp AND max_mp >= 0);

-- 7. recipes 表的等级范围约束
ALTER TABLE recipes
  DROP CONSTRAINT IF EXISTS check_recipe_tier;

ALTER TABLE recipes
  ADD CONSTRAINT check_recipe_tier CHECK (tier >= 1 AND tier <= 5);

-- 8. achievements 表的难度值约束
ALTER TABLE achievements
  DROP CONSTRAINT IF EXISTS check_achievement_difficulty;

ALTER TABLE achievements
  ADD CONSTRAINT check_achievement_difficulty CHECK (difficulty IN ('easy', 'normal', 'hard', 'legendary'));

-- 9. achievements 表的类别值约束
ALTER TABLE achievements
  DROP CONSTRAINT IF EXISTS check_achievement_category;

ALTER TABLE achievements
  ADD CONSTRAINT check_achievement_category CHECK (category IN ('combat', 'exploration', 'crafting', 'social', 'collection', 'story'));

-- 10. materials 表的等级范围约束
ALTER TABLE materials
  DROP CONSTRAINT IF EXISTS check_material_tier;

ALTER TABLE materials
  ADD CONSTRAINT check_material_tier CHECK (tier >= 1 AND tier <= 5);

-- 11. player_crafting_proficiency 表的职业值约束
ALTER TABLE player_crafting_proficiency
  DROP CONSTRAINT IF EXISTS check_profession_values;

ALTER TABLE player_crafting_proficiency
  ADD CONSTRAINT check_profession_values CHECK (profession IN ('blacksmith', 'alchemy', 'enchanting', 'tailoring', 'cooking', 'jewelcrafting'));

-- 完成
SELECT 'CHECK约束添加完成' AS status;

