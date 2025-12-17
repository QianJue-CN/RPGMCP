// 状态查询类工具
import { query, queryOne } from '../database/connection.js';
import type { Player, InventoryItem, PlayerQuest, FactionStanding, Companion, NPC, WorldState } from '../types.js';
import { calculateMaxHP, calculateMaxMP, calculatePhysicalAttack, calculateMagicAttack } from '../utils/formulas.js';

export function registerQueryTools(tools: Map<string, any>) {

  // 1. 获取玩家完整状态
  tools.set('get_player_status', {
    name: 'get_player_status',
    description: '获取玩家完整状态信息（必须在对话开始时调用）',
    inputSchema: {
      type: 'object',
      properties: {
        player_name: {
          type: 'string',
          description: '玩家名称',
        },
      },
      required: ['player_name'],
    },
    handler: async (args: { player_name: string }) => {
      const player = await queryOne<Player>(
        'SELECT * FROM players WHERE name = $1',
        [args.player_name]
      );

      if (!player) {
        throw new Error(`玩家不存在: ${args.player_name}`);
      }

      // 获取装备加成
      const equipment = await query(
        'SELECT * FROM equipment WHERE player_id = $1',
        [player.id]
      );

      // 计算总加成
      let hpBonus = 0;
      let mpBonus = 0;
      let attackBonus = 0;

      for (const eq of equipment) {
        hpBonus += eq.bonuses?.hp || 0;
        mpBonus += eq.bonuses?.mp || 0;
        attackBonus += eq.bonuses?.attack || 0;
      }

      // 计算派生属性
      const derivedStats = {
        max_hp: calculateMaxHP(player.vitality, player.level, hpBonus),
        max_mp: calculateMaxMP(player.intelligence, player.level, mpBonus),
        physical_attack: calculatePhysicalAttack(player.strength, attackBonus),
        magic_attack: calculateMagicAttack(player.intelligence, attackBonus),
      };

      return {
        ...player,
        derived_stats: derivedStats,
        equipment_count: equipment.length,
      };
    },
  });

  // 2. 获取背包物品
  tools.set('get_inventory', {
    name: 'get_inventory',
    description: '获取玩家背包中的所有物品',
    inputSchema: {
      type: 'object',
      properties: {
        player_name: {
          type: 'string',
          description: '玩家名称',
        },
      },
      required: ['player_name'],
    },
    handler: async (args: { player_name: string }) => {
      const player = await queryOne<Player>(
        'SELECT id FROM players WHERE name = $1',
        [args.player_name]
      );

      if (!player) {
        throw new Error(`玩家不存在: ${args.player_name}`);
      }

      const items = await query<InventoryItem>(
        'SELECT * FROM inventory WHERE player_id = $1 ORDER BY item_id',
        [player.id]
      );

      return {
        player_name: args.player_name,
        total_items: items.length,
        items: items,
      };
    },
  });

  // 3. 获取进行中的任务
  tools.set('get_active_quests', {
    name: 'get_active_quests',
    description: '获取玩家当前进行中的任务',
    inputSchema: {
      type: 'object',
      properties: {
        player_name: {
          type: 'string',
          description: '玩家名称',
        },
      },
      required: ['player_name'],
    },
    handler: async (args: { player_name: string }) => {
      const player = await queryOne<Player>(
        'SELECT id FROM players WHERE name = $1',
        [args.player_name]
      );

      if (!player) {
        throw new Error(`玩家不存在: ${args.player_name}`);
      }

      const quests = await query<PlayerQuest>(
        'SELECT * FROM player_quests WHERE player_id = $1 AND status = $2 ORDER BY accepted_at',
        [player.id, 'active']
      );

      return {
        player_name: args.player_name,
        active_quest_count: quests.length,
        quests: quests,
      };
    },
  });

  // 4. 获取已完成的任务
  tools.set('get_completed_quests', {
    name: 'get_completed_quests',
    description: '获取玩家已完成的任务',
    inputSchema: {
      type: 'object',
      properties: {
        player_name: {
          type: 'string',
          description: '玩家名称',
        },
      },
      required: ['player_name'],
    },
    handler: async (args: { player_name: string }) => {
      const player = await queryOne<Player>(
        'SELECT id FROM players WHERE name = $1',
        [args.player_name]
      );

      if (!player) {
        throw new Error(`玩家不存在: ${args.player_name}`);
      }

      const quests = await query<PlayerQuest>(
        'SELECT * FROM player_quests WHERE player_id = $1 AND status = $2 ORDER BY completed_at DESC',
        [player.id, 'completed']
      );

      return {
        player_name: args.player_name,
        completed_quest_count: quests.length,
        quests: quests,
      };
    },
  });

  // 5. 获取阵营声望
  tools.set('get_faction_standings', {
    name: 'get_faction_standings',
    description: '获取玩家在各阵营的声望',
    inputSchema: {
      type: 'object',
      properties: {
        player_name: {
          type: 'string',
          description: '玩家名称',
        },
      },
      required: ['player_name'],
    },
    handler: async (args: { player_name: string }) => {
      const player = await queryOne<Player>(
        'SELECT id FROM players WHERE name = $1',
        [args.player_name]
      );

      if (!player) {
        throw new Error(`玩家不存在: ${args.player_name}`);
      }

      const standings = await query<FactionStanding>(
        `SELECT pfs.*, f.name as faction_name 
         FROM player_faction_standing pfs
         JOIN factions f ON pfs.faction_id = f.id
         WHERE pfs.player_id = $1
         ORDER BY pfs.reputation_value DESC`,
        [player.id]
      );

      return {
        player_name: args.player_name,
        standings: standings,
      };
    },
  });

  // 5. 获取同伴列表
  tools.set('get_companions', {
    name: 'get_companions',
    description: '获取玩家的同伴列表',
    inputSchema: {
      type: 'object',
      properties: {
        player_name: {
          type: 'string',
          description: '玩家名称',
        },
      },
      required: ['player_name'],
    },
    handler: async (args: { player_name: string }) => {
      const player = await queryOne<Player>(
        'SELECT id FROM players WHERE name = $1',
        [args.player_name]
      );

      if (!player) {
        throw new Error(`玩家不存在: ${args.player_name}`);
      }

      const companions = await query<Companion>(
        `SELECT pc.*, n.name as npc_name, n.location, n.is_alive
         FROM player_companions pc
         JOIN npcs n ON pc.npc_id = n.id
         WHERE pc.player_id = $1
         ORDER BY pc.is_active DESC, pc.recruited_at`,
        [player.id]
      );

      return {
        player_name: args.player_name,
        total_companions: companions.length,
        active_companions: companions.filter(c => c.is_active).length,
        companions: companions,
      };
    },
  });

  // 6. 获取NPC信息
  tools.set('get_npc_info', {
    name: 'get_npc_info',
    description: '获取指定NPC的详细信息',
    inputSchema: {
      type: 'object',
      properties: {
        npc_id: {
          type: 'string',
          description: 'NPC ID',
        },
        player_name: {
          type: 'string',
          description: '玩家名称（可选，用于获取关系信息）',
        },
      },
      required: ['npc_id'],
    },
    handler: async (args: { npc_id: string; player_name?: string }) => {
      const npc = await queryOne<NPC>(
        'SELECT * FROM npcs WHERE id = $1',
        [args.npc_id]
      );

      if (!npc) {
        throw new Error(`NPC不存在: ${args.npc_id}`);
      }

      let relation = null;
      if (args.player_name) {
        const player = await queryOne<Player>(
          'SELECT id FROM players WHERE name = $1',
          [args.player_name]
        );

        if (player) {
          relation = await queryOne(
            'SELECT * FROM player_npc_relations WHERE player_id = $1 AND npc_id = $2',
            [player.id, args.npc_id]
          );
        }
      }

      return {
        npc: npc,
        relation: relation,
      };
    },
  });

  // 7. 获取世界状态
  tools.set('get_world_state', {
    name: 'get_world_state',
    description: '获取当前世界状态（时间、天气、事件）',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: async () => {
      const worldState = await queryOne<WorldState>(
        'SELECT * FROM world_state WHERE id = 1'
      );

      if (!worldState) {
        throw new Error('世界状态未初始化');
      }

      // 转换游戏时间为可读格式
      const totalMinutes = worldState.game_time;
      const days = Math.floor(totalMinutes / 1440);
      const hours = Math.floor((totalMinutes % 1440) / 60);
      const minutes = totalMinutes % 60;

      return {
        game_time: {
          total_minutes: totalMinutes,
          days: days,
          hours: hours,
          minutes: minutes,
          formatted: `第${days}天 ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
        },
        weather: worldState.weather,
        active_events: worldState.active_events,
        updated_at: worldState.updated_at,
      };
    },
  });

  // 8. 获取装备信息
  tools.set('get_equipment', {
    name: 'get_equipment',
    description: '获取玩家当前装备',
    inputSchema: {
      type: 'object',
      properties: {
        player_name: {
          type: 'string',
          description: '玩家名称',
        },
      },
      required: ['player_name'],
    },
    handler: async (args: { player_name: string }) => {
      const player = await queryOne<Player>(
        'SELECT id FROM players WHERE name = $1',
        [args.player_name]
      );

      if (!player) {
        throw new Error(`玩家不存在: ${args.player_name}`);
      }

      const equipment = await query(
        'SELECT * FROM equipment WHERE player_id = $1 ORDER BY slot',
        [player.id]
      );

      return {
        player_name: args.player_name,
        equipped_items: equipment.length,
        equipment: equipment,
      };
    },
  });

  // 9. 获取技能列表
  tools.set('get_skills', {
    name: 'get_skills',
    description: '获取玩家的技能列表',
    inputSchema: {
      type: 'object',
      properties: {
        player_name: {
          type: 'string',
          description: '玩家名称',
        },
      },
      required: ['player_name'],
    },
    handler: async (args: { player_name: string }) => {
      const player = await queryOne<Player>(
        'SELECT id FROM players WHERE name = $1',
        [args.player_name]
      );

      if (!player) {
        throw new Error(`玩家不存在: ${args.player_name}`);
      }

      const skills = await query(
        'SELECT * FROM player_skills WHERE player_id = $1 ORDER BY level DESC, skill_id',
        [player.id]
      );

      return {
        player_name: args.player_name,
        total_skills: skills.length,
        skills: skills,
      };
    },
  });

  // 10. 获取NPC关系列表
  tools.set('get_npc_relations', {
    name: 'get_npc_relations',
    description: '获取玩家与所有NPC的关系',
    inputSchema: {
      type: 'object',
      properties: {
        player_name: {
          type: 'string',
          description: '玩家名称',
        },
      },
      required: ['player_name'],
    },
    handler: async (args: { player_name: string }) => {
      const player = await queryOne<Player>(
        'SELECT id FROM players WHERE name = $1',
        [args.player_name]
      );

      if (!player) {
        throw new Error(`玩家不存在: ${args.player_name}`);
      }

      const relations = await query(
        `SELECT pnr.*, n.name as npc_name, n.location
         FROM player_npc_relations pnr
         JOIN npcs n ON pnr.npc_id = n.id
         WHERE pnr.player_id = $1
         ORDER BY pnr.affection DESC`,
        [player.id]
      );

      return {
        player_name: args.player_name,
        total_relations: relations.length,
        relations: relations,
      };
    },
  });

  console.error('✓ 已注册 11 个查询工具');
}

