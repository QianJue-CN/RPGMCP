// 游戏常量定义

// 品质等级
export const QUALITY_LEVELS = {
  NORMAL: 'normal',
  FINE: 'fine',
  EXCELLENT: 'excellent',
  MASTERWORK: 'masterwork',
  LEGENDARY: 'legendary',
} as const;

// 品质倍率
export const QUALITY_MULTIPLIERS = {
  normal: 1.0,
  fine: 1.2,
  excellent: 1.5,
  masterwork: 2.0,
  legendary: 3.0,
} as const;

// 任务状态
export const QUEST_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  FAILED: 'failed',
  EXPIRED: 'expired',
} as const;

// 装备槽位
export const EQUIPMENT_SLOTS = {
  WEAPON: 'weapon',
  ARMOR: 'armor',
  HELMET: 'helmet',
  BOOTS: 'boots',
  ACCESSORY1: 'accessory1',
  ACCESSORY2: 'accessory2',
} as const;

// 元素类型
export const ELEMENT_TYPES = {
  PHYSICAL: 'physical',
  FIRE: 'fire',
  ICE: 'ice',
  LIGHTNING: 'lightning',
  HOLY: 'holy',
  DARK: 'dark',
} as const;

// 元素克制关系
export const ELEMENT_EFFECTIVENESS = {
  fire: { ice: 2.0, physical: 1.0, fire: 0.5 },
  ice: { fire: 0.5, physical: 1.0, ice: 0.5 },
  lightning: { physical: 1.0, lightning: 0.5 },
  holy: { dark: 2.0, holy: 0.5 },
  dark: { holy: 2.0, dark: 0.5 },
  physical: {},
} as const;

// 声望等级阈值
export const REPUTATION_LEVELS = {
  HATED: -1000,
  HOSTILE: -500,
  UNFRIENDLY: -100,
  NEUTRAL: 0,
  FRIENDLY: 100,
  HONORED: 500,
  REVERED: 1000,
} as const;

// 声望等级名称
export function getReputationLevel(value: number): string {
  if (value >= 1000) return '崇敬';
  if (value >= 500) return '尊敬';
  if (value >= 100) return '友善';
  if (value >= 0) return '中立';
  if (value >= -100) return '冷淡';
  if (value >= -500) return '敌对';
  return '仇恨';
}

// 关系等级
export function getRelationshipLevel(affection: number): string {
  if (affection >= 80) return '挚友';
  if (affection >= 60) return '好友';
  if (affection >= 40) return '友好';
  if (affection >= 20) return '熟人';
  if (affection >= 0) return '认识';
  if (affection >= -20) return '冷淡';
  if (affection >= -40) return '不喜';
  if (affection >= -60) return '厌恶';
  return '仇敌';
}

// 天气类型
export const WEATHER_TYPES = [
  'clear',      // 晴朗
  'cloudy',     // 多云
  'rainy',      // 下雨
  'stormy',     // 暴风雨
  'snowy',      // 下雪
  'foggy',      // 大雾
] as const;

// 时间常量（分钟）
export const TIME_CONSTANTS = {
  HOUR: 60,
  DAY: 1440,
  WEEK: 10080,
  MONTH: 43200,
} as const;

