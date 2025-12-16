// 状态更新类工具
import { query, queryOne, transaction } from '../database/connection.js';
import type { Player, NPC } from '../types.js';
import { calculateExpForLevel, calculateMaxHP, calculateMaxMP } from '../utils/formulas.js';

// 生命值实体接口（统一玩家和NPC的生命值属性）
interface HealthEntity {
  id: number | string;
  name: string;
  max_hp: number;
  current_hp: number;
  isPlayer: boolean;
}

// 辅助函数：根据名称查询生命值实体（玩家或NPC）
async function getHealthEntity(name: string): Promise<HealthEntity | null> {
  // 先尝试查询玩家
  const player = await queryOne<Player>(
    'SELECT id, name, max_hp, current_hp FROM players WHERE name = $1',
    [name]
  );

  if (player) {
    return {
      id: player.id,
      name: player.name,
      max_hp: player.max_hp,
      current_hp: player.current_hp,
      isPlayer: true,
    };
  }

  // 如果不是玩家，尝试查询NPC
  const npc = await queryOne<NPC>(
    'SELECT id, name, max_hp, current_hp FROM npcs WHERE name = $1',
    [name]
  );

  if (npc && npc.max_hp !== undefined && npc.current_hp !== undefined) {
    return {
      id: npc.id,
      name: npc.name,
      max_hp: npc.max_hp,
      current_hp: npc.current_hp,
      isPlayer: false,
    };
  }

  return null;
}

export function registerUpdateTools(tools: Map<string, any>) {

  // 1. 应用伤害
  tools.set('apply_damage', {
    name: 'apply_damage',
    description: '对目标应用伤害',
    inputSchema: {
      type: 'object',
      properties: {
        target_name: {
          type: 'string',
          description: '目标名称（玩家名）',
        },
        damage: {
          type: 'number',
          description: '伤害值',
        },
      },
      required: ['target_name', 'damage'],
    },
    handler: async (args: { target_name: string; damage: number }) => {
      const entity = await getHealthEntity(args.target_name);

      if (!entity) {
        throw new Error(`目标不存在: ${args.target_name}`);
      }

      const newHP = Math.max(0, entity.current_hp - args.damage);
      const isDead = newHP === 0;

      const tableName = entity.isPlayer ? 'players' : 'npcs';
      await query(
        `UPDATE ${tableName} SET current_hp = $1, updated_at = CURRENT_TIMESTAMP WHERE ${entity.isPlayer ? 'id' : 'id'} = $2`,
        [newHP, entity.id]
      );

      return {
        target_name: args.target_name,
        target_type: entity.isPlayer ? 'player' : 'npc',
        damage_dealt: args.damage,
        hp_before: entity.current_hp,
        hp_after: newHP,
        is_dead: isDead,
      };
    },
  });

  // 2. 治疗目标
  tools.set('heal_target', {
    name: 'heal_target',
    description: '治疗目标',
    inputSchema: {
      type: 'object',
      properties: {
        target_name: {
          type: 'string',
          description: '目标名称',
        },
        heal_amount: {
          type: 'number',
          description: '治疗量',
        },
      },
      required: ['target_name', 'heal_amount'],
    },
    handler: async (args: { target_name: string; heal_amount: number }) => {
      const entity = await getHealthEntity(args.target_name);

      if (!entity) {
        throw new Error(`目标不存在: ${args.target_name}`);
      }

      const newHP = Math.min(entity.max_hp, entity.current_hp + args.heal_amount);
      const actualHeal = newHP - entity.current_hp;

      const tableName = entity.isPlayer ? 'players' : 'npcs';
      await query(
        `UPDATE ${tableName} SET current_hp = $1, updated_at = CURRENT_TIMESTAMP WHERE ${entity.isPlayer ? 'id' : 'id'} = $2`,
        [newHP, entity.id]
      );

      return {
        target_name: args.target_name,
        target_type: entity.isPlayer ? 'player' : 'npc',
        heal_amount: args.heal_amount,
        actual_heal: actualHeal,
        hp_before: entity.current_hp,
        hp_after: newHP,
      };
    },
  });

  // 3. 添加经验（自动处理升级）
  tools.set('add_experience', {
    name: 'add_experience',
    description: '添加经验值（自动处理升级和属性点获取）',
    inputSchema: {
      type: 'object',
      properties: {
        player_name: {
          type: 'string',
          description: '玩家名称',
        },
        exp_amount: {
          type: 'number',
          description: '经验值',
        },
      },
      required: ['player_name', 'exp_amount'],
    },
    handler: async (args: { player_name: string; exp_amount: number }) => {
      return await transaction(async (client) => {
        const result = await client.query(
          'SELECT * FROM players WHERE name = $1',
          [args.player_name]
        );

        const player = result.rows[0] as Player;
        if (!player) {
          throw new Error(`玩家不存在: ${args.player_name}`);
        }

        let newExp = player.experience + args.exp_amount;
        let newLevel = player.level;
        let levelsGained = 0;
        let statPointsGained = 0;

        // 检查升级
        while (true) {
          const expNeeded = calculateExpForLevel(newLevel + 1);
          if (newExp >= expNeeded) {
            newLevel++;
            levelsGained++;
            statPointsGained += 5; // 每级获得5点属性点
            newExp -= expNeeded;
          } else {
            break;
          }
        }

        // 更新玩家数据
        const newStatPoints = player.stat_points + statPointsGained;
        const newMaxHP = calculateMaxHP(player.vitality, newLevel);
        const newMaxMP = calculateMaxMP(player.intelligence, newLevel);

        await client.query(
          `UPDATE players 
           SET experience = $1, level = $2, stat_points = $3, 
               max_hp = $4, max_mp = $5, updated_at = CURRENT_TIMESTAMP
           WHERE id = $6`,
          [newExp, newLevel, newStatPoints, newMaxHP, newMaxMP, player.id]
        );

        return {
          player_name: args.player_name,
          exp_gained: args.exp_amount,
          level_before: player.level,
          level_after: newLevel,
          levels_gained: levelsGained,
          stat_points_gained: statPointsGained,
          total_stat_points: newStatPoints,
          did_level_up: levelsGained > 0,
        };
      });
    },
  });

  // 4. 修改背包物品
  tools.set('modify_inventory', {
    name: 'modify_inventory',
    description: '添加、移除或使用背包物品',
    inputSchema: {
      type: 'object',
      properties: {
        player_name: {
          type: 'string',
          description: '玩家名称',
        },
        operation: {
          type: 'string',
          enum: ['add', 'remove', 'use'],
          description: '操作类型',
        },
        item_id: {
          type: 'string',
          description: '物品ID',
        },
        quantity: {
          type: 'number',
          description: '数量',
          default: 1,
        },
        quality: {
          type: 'string',
          description: '品质',
          default: 'normal',
        },
      },
      required: ['player_name', 'operation', 'item_id'],
    },
    handler: async (args: {
      player_name: string;
      operation: 'add' | 'remove' | 'use';
      item_id: string;
      quantity?: number;
      quality?: string;
    }) => {
      return await transaction(async (client) => {
        const playerResult = await client.query(
          'SELECT id FROM players WHERE name = $1',
          [args.player_name]
        );

        if (playerResult.rows.length === 0) {
          throw new Error(`玩家不存在: ${args.player_name}`);
        }

        const player = playerResult.rows[0];
        const quantity = args.quantity || 1;
        const quality = args.quality || 'normal';

        if (args.operation === 'add') {
          // 添加物品
          const existingResult = await client.query(
            'SELECT * FROM inventory WHERE player_id = $1 AND item_id = $2 AND quality = $3',
            [player.id, args.item_id, quality]
          );

          if (existingResult.rows.length > 0) {
            const existing = existingResult.rows[0];
            await client.query(
              'UPDATE inventory SET quantity = quantity + $1 WHERE id = $2',
              [quantity, existing.id]
            );
          } else {
            await client.query(
              'INSERT INTO inventory (player_id, item_id, quantity, quality) VALUES ($1, $2, $3, $4)',
              [player.id, args.item_id, quantity, quality]
            );
          }

          return {
            operation: 'add',
            item_id: args.item_id,
            quantity: quantity,
            quality: quality,
            success: true,
          };
        } else {
          // 移除或使用物品
          const existingResult = await client.query(
            'SELECT * FROM inventory WHERE player_id = $1 AND item_id = $2 AND quality = $3',
            [player.id, args.item_id, quality]
          );

          if (existingResult.rows.length === 0) {
            throw new Error(`物品不存在: ${args.item_id}`);
          }

          const existing = existingResult.rows[0];

          if (existing.quantity < quantity) {
            throw new Error(`物品数量不足: 需要${quantity}，拥有${existing.quantity}`);
          }

          const newQuantity = existing.quantity - quantity;
          if (newQuantity === 0) {
            await client.query('DELETE FROM inventory WHERE id = $1', [existing.id]);
          } else {
            await client.query(
              'UPDATE inventory SET quantity = $1 WHERE id = $2',
              [newQuantity, existing.id]
            );
          }

          return {
            operation: args.operation,
            item_id: args.item_id,
            quantity: quantity,
            quality: quality,
            remaining: newQuantity,
            success: true,
          };
        }
      });
    },
  });

  // 5. 装备/卸下物品
  tools.set('equip_item', {
    name: 'equip_item',
    description: '装备或卸下物品',
    inputSchema: {
      type: 'object',
      properties: {
        player_name: {
          type: 'string',
          description: '玩家名称',
        },
        operation: {
          type: 'string',
          enum: ['equip', 'unequip'],
          description: '操作类型',
        },
        slot: {
          type: 'string',
          description: '装备槽位',
        },
        item_id: {
          type: 'string',
          description: '物品ID（装备时需要）',
        },
        quality: {
          type: 'string',
          description: '品质（装备时需要）',
          default: 'normal',
        },
      },
      required: ['player_name', 'operation', 'slot'],
    },
    handler: async (args: {
      player_name: string;
      operation: 'equip' | 'unequip';
      slot: string;
      item_id?: string;
      quality?: string;
    }) => {
      return await transaction(async (client) => {
        const playerResult = await client.query(
          'SELECT id FROM players WHERE name = $1',
          [args.player_name]
        );

        if (playerResult.rows.length === 0) {
          throw new Error(`玩家不存在: ${args.player_name}`);
        }

        const player = playerResult.rows[0];

        if (args.operation === 'equip') {
          if (!args.item_id) {
            throw new Error('装备时必须指定item_id');
          }

          const quality = args.quality || 'normal';

          // 检查是否已有装备
          const existingResult = await client.query(
            'SELECT * FROM equipment WHERE player_id = $1 AND slot = $2',
            [player.id, args.slot]
          );

          let replacedItemId = null;

          if (existingResult.rows.length > 0) {
            const existing = existingResult.rows[0];
            replacedItemId = existing.item_id;
            // 卸下旧装备
            await client.query('DELETE FROM equipment WHERE id = $1', [existing.id]);
          }

          // 装备新物品
          await client.query(
            'INSERT INTO equipment (player_id, slot, item_id, quality) VALUES ($1, $2, $3, $4)',
            [player.id, args.slot, args.item_id, quality]
          );

          return {
            operation: 'equip',
            slot: args.slot,
            item_id: args.item_id,
            quality: quality,
            replaced: replacedItemId,
            success: true,
          };
        } else {
          // 卸下装备
          const existingResult = await client.query(
            'SELECT * FROM equipment WHERE player_id = $1 AND slot = $2',
            [player.id, args.slot]
          );

          if (existingResult.rows.length === 0) {
            throw new Error(`该槽位没有装备: ${args.slot}`);
          }

          const existing = existingResult.rows[0];

          await client.query('DELETE FROM equipment WHERE id = $1', [existing.id]);

          return {
            operation: 'unequip',
            slot: args.slot,
            item_id: existing.item_id,
            quality: existing.quality,
            success: true,
          };
        }
      });
    },
  });

  // 6. 接受任务
  tools.set('accept_quest', {
    name: 'accept_quest',
    description: '接受新任务',
    inputSchema: {
      type: 'object',
      properties: {
        player_name: { type: 'string', description: '玩家名称' },
        quest_id: { type: 'string', description: '任务ID' },
        expires_in_days: { type: 'number', description: '过期天数（可选）' },
      },
      required: ['player_name', 'quest_id'],
    },
    handler: async (args: { player_name: string; quest_id: string; expires_in_days?: number }) => {
      const player = await queryOne<Player>('SELECT id FROM players WHERE name = $1', [args.player_name]);
      if (!player) throw new Error(`玩家不存在: ${args.player_name}`);

      const expiresAt = args.expires_in_days
        ? new Date(Date.now() + args.expires_in_days * 24 * 60 * 60 * 1000)
        : null;

      await query(
        'INSERT INTO player_quests (player_id, quest_id, status, expires_at) VALUES ($1, $2, $3, $4)',
        [player.id, args.quest_id, 'active', expiresAt]
      );

      return { player_name: args.player_name, quest_id: args.quest_id, status: 'active', success: true };
    },
  });

  // 7. 更新任务进度
  tools.set('update_quest_progress', {
    name: 'update_quest_progress',
    description: '更新任务目标进度',
    inputSchema: {
      type: 'object',
      properties: {
        player_name: { type: 'string', description: '玩家名称' },
        quest_id: { type: 'string', description: '任务ID' },
        objective_id: { type: 'string', description: '目标ID' },
        progress: { type: 'number', description: '进度值' },
      },
      required: ['player_name', 'quest_id', 'objective_id', 'progress'],
    },
    handler: async (args: { player_name: string; quest_id: string; objective_id: string; progress: number }) => {
      const player = await queryOne<Player>('SELECT id FROM players WHERE name = $1', [args.player_name]);
      if (!player) throw new Error(`玩家不存在: ${args.player_name}`);

      const quest = await queryOne(
        'SELECT * FROM player_quests WHERE player_id = $1 AND quest_id = $2 AND status = $3',
        [player.id, args.quest_id, 'active']
      );

      if (!quest) throw new Error(`任务不存在或已完成: ${args.quest_id}`);

      // 安全地处理objectives_progress JSON字段
      const objectives = (typeof quest.objectives_progress === 'object' && quest.objectives_progress !== null)
        ? quest.objectives_progress
        : {};
      objectives[args.objective_id] = args.progress;

      await query(
        'UPDATE player_quests SET objectives_progress = $1 WHERE id = $2',
        [JSON.stringify(objectives), quest.id]
      );

      return { quest_id: args.quest_id, objective_id: args.objective_id, progress: args.progress, success: true };
    },
  });

  // 8. 完成任务
  tools.set('complete_quest', {
    name: 'complete_quest',
    description: '完成任务并发放奖励',
    inputSchema: {
      type: 'object',
      properties: {
        player_name: { type: 'string', description: '玩家名称' },
        quest_id: { type: 'string', description: '任务ID' },
        rewards: {
          type: 'object',
          description: '奖励（exp, gold, items等）',
          properties: {
            exp: { type: 'number' },
            gold: { type: 'number' },
            items: { type: 'array' },
          },
        },
      },
      required: ['player_name', 'quest_id'],
    },
    handler: async (args: { player_name: string; quest_id: string; rewards?: any }) => {
      return await transaction(async (client) => {
        const playerResult = await client.query('SELECT * FROM players WHERE name = $1', [args.player_name]);
        const player = playerResult.rows[0] as Player;
        if (!player) throw new Error(`玩家不存在: ${args.player_name}`);

        // 检查任务状态，防止重复完成
        const questResult = await client.query(
          'UPDATE player_quests SET status = $1, completed_at = CURRENT_TIMESTAMP WHERE player_id = $2 AND quest_id = $3 AND status = $4 RETURNING id',
          ['completed', player.id, args.quest_id, 'active']
        );

        if (questResult.rowCount === 0) {
          throw new Error(`任务不存在、已完成或状态不正确: ${args.quest_id}`);
        }

        const rewards = args.rewards || {};

        // 发放经验
        if (rewards.exp) {
          await client.query('UPDATE players SET experience = experience + $1 WHERE id = $2', [rewards.exp, player.id]);
        }

        // 发放金币
        if (rewards.gold) {
          await client.query('UPDATE players SET gold = gold + $1 WHERE id = $2', [rewards.gold, player.id]);
        }

        return { quest_id: args.quest_id, status: 'completed', rewards, success: true };
      });
    },
  });

  // 9. 更新声望
  tools.set('update_reputation', {
    name: 'update_reputation',
    description: '更新阵营声望',
    inputSchema: {
      type: 'object',
      properties: {
        player_name: { type: 'string', description: '玩家名称' },
        faction_id: { type: 'string', description: '阵营ID' },
        change: { type: 'number', description: '声望变化值' },
      },
      required: ['player_name', 'faction_id', 'change'],
    },
    handler: async (args: { player_name: string; faction_id: string; change: number }) => {
      const player = await queryOne<Player>('SELECT id FROM players WHERE name = $1', [args.player_name]);
      if (!player) throw new Error(`玩家不存在: ${args.player_name}`);

      const existing = await queryOne(
        'SELECT * FROM player_faction_standing WHERE player_id = $1 AND faction_id = $2',
        [player.id, args.faction_id]
      );

      if (existing) {
        const newValue = Math.max(-1000, Math.min(1000, existing.reputation_value + args.change));
        await query(
          'UPDATE player_faction_standing SET reputation_value = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [newValue, existing.id]
        );
        return { faction_id: args.faction_id, old_value: existing.reputation_value, new_value: newValue, change: args.change };
      } else {
        // 新增声望时从0开始累加
        const newValue = Math.max(-1000, Math.min(1000, 0 + args.change));
        await query(
          'INSERT INTO player_faction_standing (player_id, faction_id, reputation_value) VALUES ($1, $2, $3)',
          [player.id, args.faction_id, newValue]
        );
        return { faction_id: args.faction_id, old_value: 0, new_value: newValue, change: args.change };
      }
    },
  });

  // 10. 更新NPC关系
  tools.set('update_npc_relation', {
    name: 'update_npc_relation',
    description: '更新与NPC的关系',
    inputSchema: {
      type: 'object',
      properties: {
        player_name: { type: 'string', description: '玩家名称' },
        npc_id: { type: 'string', description: 'NPC ID' },
        affection_change: { type: 'number', description: '好感度变化', default: 0 },
        loyalty_change: { type: 'number', description: '忠诚度变化', default: 0 },
        trust_change: { type: 'number', description: '信任度变化', default: 0 },
      },
      required: ['player_name', 'npc_id'],
    },
    handler: async (args: {
      player_name: string;
      npc_id: string;
      affection_change?: number;
      loyalty_change?: number;
      trust_change?: number;
    }) => {
      const player = await queryOne<Player>('SELECT id FROM players WHERE name = $1', [args.player_name]);
      if (!player) throw new Error(`玩家不存在: ${args.player_name}`);

      const existing = await queryOne(
        'SELECT * FROM player_npc_relations WHERE player_id = $1 AND npc_id = $2',
        [player.id, args.npc_id]
      );

      const affectionChange = args.affection_change || 0;
      const loyaltyChange = args.loyalty_change || 0;
      const trustChange = args.trust_change || 0;

      // 验证输入：忠诚度和信任度不允许负数变化（业务规则）
      if (loyaltyChange < 0 || trustChange < 0) {
        throw new Error('忠诚度和信任度不允许负数变化');
      }

      if (existing) {
        const newAffection = Math.max(-100, Math.min(100, existing.affection + affectionChange));
        const newLoyalty = Math.max(0, Math.min(100, existing.loyalty + loyaltyChange));
        const newTrust = Math.max(0, Math.min(100, existing.trust + trustChange));

        await query(
          `UPDATE player_npc_relations
           SET affection = $1, loyalty = $2, trust = $3,
               last_interaction = CURRENT_TIMESTAMP, interaction_count = interaction_count + 1,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $4`,
          [newAffection, newLoyalty, newTrust, existing.id]
        );

        return { npc_id: args.npc_id, affection: newAffection, loyalty: newLoyalty, trust: newTrust };
      } else {
        // 新增关系时从0开始累加
        const newAffection = Math.max(-100, Math.min(100, 0 + affectionChange));
        const newLoyalty = Math.max(0, Math.min(100, 0 + loyaltyChange));
        const newTrust = Math.max(0, Math.min(100, 0 + trustChange));

        await query(
          `INSERT INTO player_npc_relations
           (player_id, npc_id, affection, loyalty, trust, last_interaction, interaction_count)
           VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, 1)`,
          [player.id, args.npc_id, newAffection, newLoyalty, newTrust]
        );

        return { npc_id: args.npc_id, affection: newAffection, loyalty: newLoyalty, trust: newTrust };
      }
    },
  });
}


