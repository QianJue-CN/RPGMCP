// 类型定义

export interface Player {
  id: number;
  name: string;
  level: number;
  experience: number;
  
  // 基础属性
  strength: number;
  vitality: number;
  agility: number;
  intelligence: number;
  luck: number;
  
  // 派生属性
  max_hp: number;
  current_hp: number;
  max_mp: number;
  current_mp: number;
  
  // 资源
  gold: number;
  stat_points: number;
  
  // 位置
  location: string;
  
  created_at: Date;
  updated_at: Date;
}

export interface InventoryItem {
  id: number;
  player_id: number;
  item_id: string;
  quantity: number;
  quality: string;
  metadata: Record<string, any>;
  created_at: Date;
}

export interface Equipment {
  id: number;
  player_id: number;
  slot: string;
  item_id: string;
  quality: string;
  bonuses: Record<string, any>;
  equipped_at: Date;
}

export interface PlayerQuest {
  id: number;
  player_id: number;
  quest_id: string;
  status: string;
  objectives_progress: Record<string, any>;
  accepted_at: Date;
  completed_at?: Date;
  expires_at?: Date;
}

export interface PlayerSkill {
  id: number;
  player_id: number;
  skill_id: string;
  level: number;
  experience: number;
}

export interface FactionStanding {
  id: number;
  player_id: number;
  faction_id: string;
  reputation_value: number;
  updated_at: Date;
}

export interface NPCRelation {
  id: number;
  player_id: number;
  npc_id: string;
  affection: number;
  loyalty: number;
  trust: number;
  last_interaction?: Date;
  interaction_count: number;
  updated_at: Date;
}

export interface Companion {
  id: number;
  player_id: number;
  npc_id: string;
  is_active: boolean;
  recruited_at: Date;
}

export interface NPC {
  id: string;
  name: string;
  location: string;
  is_alive: boolean;
  goals: any[];
  state: Record<string, any>;
  updated_at: Date;
}

export interface Faction {
  id: string;
  name: string;
  resources: Record<string, any>;
  territory: string[];
  updated_at: Date;
}

export interface WorldState {
  id: number;
  game_time: number;
  weather: string;
  active_events: any[];
  updated_at: Date;
}

export interface GameSave {
  id: number;
  player_id: number;
  save_name?: string;
  snapshot: Record<string, any>;
  created_at: Date;
}

// 工具返回类型
export interface DamageResult {
  base_damage: number;
  defense_reduction: number;
  is_critical: boolean;
  elemental_multiplier: number;
  final_damage: number;
  random_factor: number;
}

export interface ExpRewardResult {
  base_exp: number;
  level_modifier: number;
  bonus_multiplier: number;
  final_exp: number;
  will_level_up: boolean;
  new_level?: number;
}

export interface LootDrop {
  item_id: string;
  quantity: number;
  quality: string;
}

export interface CraftResult {
  success: boolean;
  success_rate: number;
  quality?: string;
  item_id?: string;
  quantity?: number;
}

