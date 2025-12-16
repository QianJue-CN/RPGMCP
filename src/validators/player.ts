/**
 * 玩家相关数据验证模式
 */
import { z } from 'zod';

/**
 * 玩家名称验证
 */
export const PlayerNameSchema = z.string()
    .min(3, '玩家名称至少3个字符')
    .max(50, '玩家名称最多50个字符')
    .regex(/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, '名称只能包含字母、数字、下划线和中文');

/**
 * 玩家属性验证
 */
export const PlayerStatsSchema = z.object({
    strength: z.number().int().min(1).max(999, '力量值必须在1-999之间'),
    vitality: z.number().int().min(1).max(999, '体质值必须在1-999之间'),
    agility: z.number().int().min(1).max(999, '敏捷值必须在1-999之间'),
    intelligence: z.number().int().min(1).max(999, '智力值必须在1-999之间'),
});

/**
 * 创建玩家参数验证
 */
export const CreatePlayerSchema = z.object({
    name: PlayerNameSchema,
    class: z.enum(['warrior', 'mage', 'rogue', 'priest', 'hunter', 'paladin'], {
        errorMap: () => ({ message: '无效的职业类型' })
    }),
    stats: PlayerStatsSchema.optional(),
});

/**
 * 玩家等级验证
 */
export const PlayerLevelSchema = z.number()
    .int()
    .min(1, '等级至少为1')
    .max(100, '等级最高为100');

/**
 * 玩家生命值验证
 */
export const PlayerHealthSchema = z.object({
    current_hp: z.number().int().min(0, '当前生命值不能为负数'),
    max_hp: z.number().int().min(1, '最大生命值至少为1'),
}).refine(
    (data) => data.current_hp <= data.max_hp,
    { message: '当前生命值不能超过最大生命值' }
);

/**
 * 玩家法力值验证
 */
export const PlayerManaSchema = z.object({
    current_mp: z.number().int().min(0, '当前法力值不能为负数'),
    max_mp: z.number().int().min(0, '最大法力值不能为负数'),
}).refine(
    (data) => data.current_mp <= data.max_mp,
    { message: '当前法力值不能超过最大法力值' }
);

/**
 * 经验值验证
 */
export const ExperienceSchema = z.object({
    experience: z.number().int().min(0, '经验值不能为负数'),
    exp_to_next_level: z.number().int().min(1, '升级所需经验必须大于0'),
}).refine(
    (data) => data.experience < data.exp_to_next_level,
    { message: '当前经验不应超过升级所需经验' }
);

/**
 * 金币验证
 */
export const GoldSchema = z.number()
    .int()
    .min(0, '金币数量不能为负数')
    .max(999999999, '金币数量超出限制');

/**
 * 位置坐标验证
 */
export const LocationSchema = z.object({
    x: z.number(),
    y: z.number(),
    z: z.number().optional(),
    map_id: z.string().optional(),
});

/**
 * 完整玩家数据验证
 */
export const PlayerSchema = z.object({
    id: z.number().int().positive(),
    name: PlayerNameSchema,
    class: z.string(),
    level: PlayerLevelSchema,
    experience: z.number().int().min(0),
    exp_to_next_level: z.number().int().min(1),
    current_hp: z.number().int().min(0),
    max_hp: z.number().int().min(1),
    current_mp: z.number().int().min(0),
    max_mp: z.number().int().min(0),
    strength: z.number().int().min(1).max(999),
    vitality: z.number().int().min(1).max(999),
    agility: z.number().int().min(1).max(999),
    intelligence: z.number().int().min(1).max(999),
    gold: GoldSchema,
    location: LocationSchema.optional(),
    created_at: z.date(),
    updated_at: z.date(),
});

/**
 * 类型导出
 */
export type PlayerName = z.infer<typeof PlayerNameSchema>;
export type PlayerStats = z.infer<typeof PlayerStatsSchema>;
export type CreatePlayerInput = z.infer<typeof CreatePlayerSchema>;
export type PlayerLevel = z.infer<typeof PlayerLevelSchema>;
export type PlayerHealth = z.infer<typeof PlayerHealthSchema>;
export type PlayerMana = z.infer<typeof PlayerManaSchema>;
export type Experience = z.infer<typeof ExperienceSchema>;
export type Gold = z.infer<typeof GoldSchema>;
export type Location = z.infer<typeof LocationSchema>;
export type Player = z.infer<typeof PlayerSchema>;