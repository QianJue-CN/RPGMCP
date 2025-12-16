/**
 * 物品相关数据验证模式
 */
import { z } from 'zod';

/**
 * 物品ID验证
 */
export const ItemIdSchema = z.string()
    .min(1, '物品ID不能为空')
    .max(100, '物品ID过长');

/**
 * 物品数量验证
 */
export const ItemQuantitySchema = z.number()
    .int('数量必须是整数')
    .min(1, '数量至少为1')
    .max(99999, '数量超出限制');

/**
 * 物品品质验证
 */
export const ItemQualitySchema = z.enum([
    'common',
    'uncommon',
    'rare',
    'epic',
    'legendary'
], {
    errorMap: () => ({ message: '无效的物品品质' })
});

/**
 * 物品类型验证
 */
export const ItemTypeSchema = z.enum([
    'weapon',
    'armor',
    'consumable',
    'material',
    'quest',
    'misc'
], {
    errorMap: () => ({ message: '无效的物品类型' })
});

/**
 * 装备槽位验证
 */
export const EquipmentSlotSchema = z.enum([
    'head',
    'chest',
    'legs',
    'feet',
    'hands',
    'main_hand',
    'off_hand',
    'ring',
    'necklace',
    'trinket'
], {
    errorMap: () => ({ message: '无效的装备槽位' })
});

/**
 * 物品元数据验证
 */
export const ItemMetadataSchema = z.record(z.unknown()).optional();

/**
 * 添加物品到背包参数验证
 */
export const AddItemSchema = z.object({
    player_name: z.string(),
    item_id: ItemIdSchema,
    quantity: ItemQuantitySchema,
    quality: ItemQualitySchema.optional(),
    metadata: ItemMetadataSchema,
});

/**
 * 移除物品参数验证
 */
export const RemoveItemSchema = z.object({
    player_name: z.string(),
    item_id: ItemIdSchema,
    quantity: ItemQuantitySchema,
    quality: ItemQualitySchema.optional(),
});

/**
 * 装备物品参数验证
 */
export const EquipItemSchema = z.object({
    player_name: z.string(),
    item_id: ItemIdSchema,
    slot: EquipmentSlotSchema,
});

/**
 * 卸下装备参数验证
 */
export const UnequipItemSchema = z.object({
    player_name: z.string(),
    slot: EquipmentSlotSchema,
});

/**
 * 背包物品数据验证
 */
export const InventoryItemSchema = z.object({
    id: z.number().int().positive(),
    player_id: z.number().int().positive(),
    item_id: ItemIdSchema,
    quantity: ItemQuantitySchema,
    quality: ItemQualitySchema.optional(),
    metadata: ItemMetadataSchema,
    created_at: z.date(),
    updated_at: z.date(),
});

/**
 * 装备数据验证
 */
export const EquipmentSchema = z.object({
    id: z.number().int().positive(),
    player_id: z.number().int().positive(),
    slot: EquipmentSlotSchema,
    item_id: ItemIdSchema,
    quality: ItemQualitySchema.optional(),
    metadata: ItemMetadataSchema,
    equipped_at: z.date(),
});

/**
 * 类型导出
 */
export type ItemId = z.infer<typeof ItemIdSchema>;
export type ItemQuantity = z.infer<typeof ItemQuantitySchema>;
export type ItemQuality = z.infer<typeof ItemQualitySchema>;
export type ItemType = z.infer<typeof ItemTypeSchema>;
export type EquipmentSlot = z.infer<typeof EquipmentSlotSchema>;
export type ItemMetadata = z.infer<typeof ItemMetadataSchema>;
export type AddItemInput = z.infer<typeof AddItemSchema>;
export type RemoveItemInput = z.infer<typeof RemoveItemSchema>;
export type EquipItemInput = z.infer<typeof EquipItemSchema>;
export type UnequipItemInput = z.infer<typeof UnequipItemSchema>;
export type InventoryItem = z.infer<typeof InventoryItemSchema>;
export type Equipment = z.infer<typeof EquipmentSchema>;