// 数值计算类工具
import { queryOne } from '../database/connection.js';
import type { Player, DamageResult, ExpRewardResult, LootDrop, CraftResult } from '../types.js';
import {
  calculateDamage,
  calculateExpReward,
  calculateExpForLevel,
  calculateCriticalRate,
  calculatePhysicalAttack,
  calculateMagicAttack,
  calculatePhysicalDefense,
  calculateCraftSuccessRate,
  calculateCraftQuality,
  calculateReputationChange,
} from '../utils/formulas.js';

export function registerCalculateTools(tools: Map<string, any>) {

  // 1. 计算战斗伤害
  tools.set('calculate_damage', {
    name: 'calculate_damage',
    description: '计算战斗伤害（返回详细分解）',
    inputSchema: {
      type: 'object',
      properties: {
        attacker_name: {
          type: 'string',
          description: '攻击者名称（玩家名）',
        },
        defender_name: {
          type: 'string',
          description: '防御者名称（敌人或玩家名）',
        },
        attack_type: {
          type: 'string',
          enum: ['physical', 'magic'],
          description: '攻击类型',
        },
        skill_damage: {
          type: 'number',
          description: '技能基础伤害（可选）',
          default: 0,
        },
        elemental_multiplier: {
          type: 'number',
          description: '元素倍率（可选，默认1.0）',
          default: 1.0,
        },
      },
      required: ['attacker_name', 'attack_type'],
    },
    handler: async (args: {
      attacker_name: string;
      defender_name?: string;
      attack_type: 'physical' | 'magic';
      skill_damage?: number;
      elemental_multiplier?: number;
    }) => {
      const attacker = await queryOne<Player>(
        'SELECT * FROM players WHERE name = $1',
        [args.attacker_name]
      );

      if (!attacker) {
        throw new Error(`攻击者不存在: ${args.attacker_name}`);
      }

      // 计算基础攻击力
      let baseDamage = args.skill_damage || 0;
      if (args.attack_type === 'physical') {
        baseDamage += calculatePhysicalAttack(attacker.strength);
      } else {
        baseDamage += calculateMagicAttack(attacker.intelligence);
      }

      // 计算防御力（如果有防御者）
      let defense = 0;
      if (args.defender_name) {
        const defender = await queryOne<Player>(
          'SELECT * FROM players WHERE name = $1',
          [args.defender_name]
        );

        if (defender) {
          defense = args.attack_type === 'physical'
            ? calculatePhysicalDefense(defender.vitality)
            : calculatePhysicalDefense(defender.intelligence);
        }
      }

      // 判断是否暴击
      const critRate = calculateCriticalRate(attacker.luck);
      const isCritical = Math.random() * 100 < critRate;

      // 计算最终伤害
      const elementalMultiplier = args.elemental_multiplier || 1.0;
      const finalDamage = calculateDamage(baseDamage, defense, isCritical, elementalMultiplier);

      const result: DamageResult = {
        base_damage: baseDamage,
        defense_reduction: Math.min(defense * 0.5, baseDamage * 0.9),
        is_critical: isCritical,
        elemental_multiplier: elementalMultiplier,
        final_damage: finalDamage,
        random_factor: 0.9 + Math.random() * 0.2,
      };

      return result;
    },
  });

  // 2. 计算经验奖励
  tools.set('calculate_exp_reward', {
    name: 'calculate_exp_reward',
    description: '计算经验奖励（含加成和升级判断）',
    inputSchema: {
      type: 'object',
      properties: {
        player_name: {
          type: 'string',
          description: '玩家名称',
        },
        base_exp: {
          type: 'number',
          description: '基础经验值',
        },
        enemy_level: {
          type: 'number',
          description: '敌人等级（可选）',
          default: 1,
        },
        bonus_multiplier: {
          type: 'number',
          description: '加成倍率（可选，默认1.0）',
          default: 1.0,
        },
      },
      required: ['player_name', 'base_exp'],
    },
    handler: async (args: {
      player_name: string;
      base_exp: number;
      enemy_level?: number;
      bonus_multiplier?: number;
    }) => {
      const player = await queryOne<Player>(
        'SELECT * FROM players WHERE name = $1',
        [args.player_name]
      );

      if (!player) {
        throw new Error(`玩家不存在: ${args.player_name}`);
      }

      const enemyLevel = args.enemy_level || 1;
      const bonusMultiplier = args.bonus_multiplier || 1.0;

      const finalExp = calculateExpReward(
        args.base_exp,
        player.level,
        enemyLevel,
        bonusMultiplier
      );

      // 判断是否会升级
      const newTotalExp = player.experience + finalExp;
      const expNeeded = calculateExpForLevel(player.level + 1);
      const willLevelUp = newTotalExp >= expNeeded;

      const result: ExpRewardResult = {
        base_exp: args.base_exp,
        level_modifier: enemyLevel - player.level,
        bonus_multiplier: bonusMultiplier,
        final_exp: finalExp,
        will_level_up: willLevelUp,
        new_level: willLevelUp ? player.level + 1 : undefined,
      };

      return result;
    },
  });

  // 3. 计算掉落物品
  tools.set('calculate_loot_drops', {
    name: 'calculate_loot_drops',
    description: '计算击杀敌人后的掉落物品',
    inputSchema: {
      type: 'object',
      properties: {
        enemy_id: {
          type: 'string',
          description: '敌人ID',
        },
        player_luck: {
          type: 'number',
          description: '玩家幸运值（影响掉落）',
          default: 10,
        },
      },
      required: ['enemy_id'],
    },
    handler: async (args: { enemy_id: string; player_luck?: number }) => {
      const luck = args.player_luck || 10;

      // 简化的掉落系统（实际应该从配置读取）
      const lootTable: Record<string, LootDrop[]> = {
        goblin: [
          { item_id: 'gold', quantity: 10 + Math.floor(Math.random() * 10), quality: 'normal' },
          { item_id: 'goblin_ear', quantity: 1, quality: 'normal' },
        ],
        wolf: [
          { item_id: 'gold', quantity: 5 + Math.floor(Math.random() * 5), quality: 'normal' },
          { item_id: 'wolf_pelt', quantity: 1, quality: 'normal' },
        ],
        dragon: [
          { item_id: 'gold', quantity: 1000 + Math.floor(Math.random() * 500), quality: 'normal' },
          { item_id: 'dragon_scale', quantity: 3, quality: 'excellent' },
          { item_id: 'dragon_heart', quantity: 1, quality: 'legendary' },
        ],
      };

      const drops = lootTable[args.enemy_id] || [
        { item_id: 'gold', quantity: 5, quality: 'normal' },
      ];

      // 幸运值影响掉落数量
      const luckBonus = luck > 15 ? 1.2 : 1.0;
      const finalDrops = drops.map(drop => ({
        ...drop,
        quantity: Math.floor(drop.quantity * luckBonus),
      }));

      return {
        enemy_id: args.enemy_id,
        luck_bonus: luckBonus,
        drops: finalDrops,
      };
    },
  });

  // 4. 计算制作结果
  tools.set('calculate_craft_result', {
    name: 'calculate_craft_result',
    description: '计算制作结果（成功率、品质）',
    inputSchema: {
      type: 'object',
      properties: {
        player_name: {
          type: 'string',
          description: '玩家名称',
        },
        recipe_id: {
          type: 'string',
          description: '配方ID',
        },
        base_success_rate: {
          type: 'number',
          description: '基础成功率',
          default: 50,
        },
        tool_bonus: {
          type: 'number',
          description: '工具加成',
          default: 0,
        },
        workbench_bonus: {
          type: 'number',
          description: '工作台加成',
          default: 0,
        },
      },
      required: ['player_name', 'recipe_id'],
    },
    handler: async (args: {
      player_name: string;
      recipe_id: string;
      base_success_rate?: number;
      tool_bonus?: number;
      workbench_bonus?: number;
    }) => {
      const player = await queryOne<Player>(
        'SELECT * FROM players WHERE name = $1',
        [args.player_name]
      );

      if (!player) {
        throw new Error(`玩家不存在: ${args.player_name}`);
      }

      // 获取技能等级（简化，实际应查询技能表）
      const skillLevel = 1;

      const baseRate = args.base_success_rate || 50;
      const toolBonus = args.tool_bonus || 0;
      const workbenchBonus = args.workbench_bonus || 0;

      const successRate = calculateCraftSuccessRate(baseRate, skillLevel, toolBonus, workbenchBonus);
      const success = Math.random() * 100 < successRate;

      let result: CraftResult = {
        success: success,
        success_rate: successRate,
      };

      if (success) {
        const quality = calculateCraftQuality(skillLevel * 5, 0, toolBonus);
        result.quality = quality;
        result.item_id = args.recipe_id;
        result.quantity = 1;
      }

      return result;
    },
  });

  // 5. 计算声望变化
  tools.set('calculate_reputation_change', {
    name: 'calculate_reputation_change',
    description: '计算阵营声望变化',
    inputSchema: {
      type: 'object',
      properties: {
        base_value: {
          type: 'number',
          description: '基础声望值',
        },
        action_type: {
          type: 'string',
          enum: ['quest', 'kill_enemy', 'kill_ally', 'trade', 'betray'],
          description: '行为类型',
        },
        relationship_modifier: {
          type: 'number',
          description: '关系修正（可选，默认1.0）',
          default: 1.0,
        },
      },
      required: ['base_value', 'action_type'],
    },
    handler: async (args: {
      base_value: number;
      action_type: string;
      relationship_modifier?: number;
    }) => {
      const actionMultipliers: Record<string, number> = {
        quest: 1.0,
        kill_enemy: 1.5,
        kill_ally: -2.0,
        trade: 0.5,
        betray: -3.0,
      };

      const multiplier = actionMultipliers[args.action_type] || 1.0;
      const relationshipModifier = args.relationship_modifier || 1.0;

      const change = calculateReputationChange(args.base_value, multiplier, relationshipModifier);

      return {
        base_value: args.base_value,
        action_type: args.action_type,
        action_multiplier: multiplier,
        relationship_modifier: relationshipModifier,
        final_change: change,
      };
    },
  });
}

