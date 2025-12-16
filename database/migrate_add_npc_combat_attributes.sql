-- Migration: Add optional combat attributes to NPC table
-- Date: 2025-12-16
-- Description: Adds optional combat attributes (level, strength, vitality, agility, intelligence, luck)
--              to the npcs table to support combat-capable NPCs and enemies.

-- Add optional combat attributes to npcs table
ALTER TABLE npcs
ADD COLUMN IF NOT EXISTS level INTEGER,
ADD COLUMN IF NOT EXISTS strength INTEGER,
ADD COLUMN IF NOT EXISTS vitality INTEGER,
ADD COLUMN IF NOT EXISTS agility INTEGER,
ADD COLUMN IF NOT EXISTS intelligence INTEGER,
ADD COLUMN IF NOT EXISTS luck INTEGER;

-- Add comment to document the purpose of these fields
COMMENT ON COLUMN npcs.level IS 'Optional: Combat level for battle-capable NPCs';

COMMENT ON COLUMN npcs.strength IS 'Optional: Strength attribute for combat NPCs';

COMMENT ON COLUMN npcs.vitality IS 'Optional: Vitality attribute for combat NPCs';

COMMENT ON COLUMN npcs.agility IS 'Optional: Agility attribute for combat NPCs';

COMMENT ON COLUMN npcs.intelligence IS 'Optional: Intelligence attribute for combat NPCs';

COMMENT ON COLUMN npcs.luck IS 'Optional: Luck attribute for combat NPCs';