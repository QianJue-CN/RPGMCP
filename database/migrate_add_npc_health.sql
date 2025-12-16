-- 为 npcs 表添加生命值字段的迁移脚本
-- 此脚本可安全地重复执行

-- 1. 检查并添加 max_hp 列
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'npcs' AND column_name = 'max_hp'
    ) THEN
        ALTER TABLE npcs ADD COLUMN max_hp INTEGER NOT NULL DEFAULT 100;
        RAISE NOTICE 'Added max_hp column to npcs table';
    ELSE
        RAISE NOTICE 'max_hp column already exists in npcs table';
    END IF;
END $$;

-- 2. 检查并添加 current_hp 列
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'npcs' AND column_name = 'current_hp'
    ) THEN
        ALTER TABLE npcs ADD COLUMN current_hp INTEGER NOT NULL DEFAULT 100;
        RAISE NOTICE 'Added current_hp column to npcs table';
    ELSE
        RAISE NOTICE 'current_hp column already exists in npcs table';
    END IF;
END $$;

-- 3. 更新现有 NPC 的生命值（如果之前没有值）
UPDATE npcs
SET
    max_hp = COALESCE(max_hp, 100),
    current_hp = COALESCE(current_hp, 100)
WHERE
    max_hp IS NULL
    OR current_hp IS NULL;

-- 4. 验证迁移结果
SELECT
    COUNT(*) as total_npcs,
    COUNT(max_hp) as npcs_with_max_hp,
    COUNT(current_hp) as npcs_with_current_hp
FROM npcs;