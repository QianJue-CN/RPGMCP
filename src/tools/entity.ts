// 实体创建工具 - 创建角色、NPC、阵营等
import { query, queryOne, transaction } from '../database/connection.js';
import type { Player, NPC, Faction } from '../types.js';
import { calculateMaxHP, calculateMaxMP } from '../utils/formulas.js';

export function registerEntityTools(tools: Map<string, any>) {

  // 1. 创建玩家角色
  tools.set('create_player', {
    name: 'create_player',
    description: '创建新的玩家角色',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: '玩家名称（唯一）',
        },
        strength: {
          type: 'number',
          description: '力量属性（默认10）',
          default: 10,
        },
        vitality: {
          type: 'number',
          description: '体质属性（默认10）',
          default: 10,
        },
        agility: {
          type: 'number',
          description: '敏捷属性（默认10）',
          default: 10,
        },
        intelligence: {
          type: 'number',
          description: '智力属性（默认10）',
          default: 10,
        },
        luck: {
          type: 'number',
          description: '幸运属性（默认10）',
          default: 10,
        },
        charisma: {
          type: 'number',
          description: '魅力属性（默认10）',
          default: 10,
        },
        wisdom: {
          type: 'number',
          description: '感知属性（默认10）',
          default: 10,
        },
        location: {
          type: 'string',
          description: '初始位置（默认starting_village）',
          default: 'starting_village',
        },
        gold: {
          type: 'number',
          description: '初始金币（默认100）',
          default: 100,
        },
      },
      required: ['name'],
    },
    handler: async (args: {
      name: string;
      strength?: number;
      vitality?: number;
      agility?: number;
      intelligence?: number;
      luck?: number;
      charisma?: number;
      wisdom?: number;
      location?: string;
      gold?: number;
    }) => {
      // 检查玩家是否已存在
      const existing = await queryOne<Player>(
        'SELECT * FROM players WHERE name = $1',
        [args.name]
      );

      if (existing) {
        throw new Error(`玩家已存在: ${args.name}`);
      }

      const str = args.strength || 10;
      const vit = args.vitality || 10;
      const agi = args.agility || 10;
      const int = args.intelligence || 10;
      const luk = args.luck || 10;
      const cha = args.charisma || 10;
      const wis = args.wisdom || 10;
      const level = 1; // 初始等级为1
      const maxHP = calculateMaxHP(vit, level);
      const maxMP = calculateMaxMP(int, level);

      const result = await query<Player>(
        `INSERT INTO players (
          name, level, experience,
          strength, vitality, agility, intelligence, wisdom, luck, charisma,
          max_hp, current_hp, max_mp, current_mp, gold, stat_points, skill_points, location
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING *`,
        [
          args.name, 1, 0,
          str, vit, agi, int, wis, luk, cha,
          maxHP, maxHP, maxMP, maxMP,
          args.gold || 100,
          0,  // stat_points初始为0
          0,  // skill_points初始为0
          args.location || 'starting_village'
        ]
      );

      return {
        success: true,
        message: `成功创建玩家: ${args.name}`,
        player: result[0],
      };
    },
  });

  // 2. 创建NPC
  tools.set('create_npc', {
    name: 'create_npc',
    description: '创建新的NPC。必需字段: id, name, location; 可选字段: is_alive, max_hp, current_hp, description, role, personality, level, strength, vitality, agility, intelligence, luck, goals, state',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'NPC唯一ID（格式：npc_xxx）',
        },
        name: {
          type: 'string',
          description: 'NPC名称',
        },
        location: {
          type: 'string',
          description: 'NPC所在位置',
        },
        is_alive: {
          type: 'boolean',
          description: '是否存活（默认true）',
          default: true,
        },
        max_hp: {
          type: 'number',
          description: '最大生命值（默认100）',
          default: 100,
        },
        current_hp: {
          type: 'number',
          description: '当前生命值（默认100）',
          default: 100,
        },
        description: {
          type: 'string',
          description: 'NPC描述',
        },
        role: {
          type: 'string',
          description: 'NPC角色: merchant, quest_giver, enemy, ally, neutral',
        },
        personality: {
          type: 'string',
          description: '性格特征',
        },
        level: {
          type: 'number',
          description: '等级（战斗型NPC）',
        },
        strength: {
          type: 'number',
          description: '力量属性（战斗型NPC）',
        },
        vitality: {
          type: 'number',
          description: '体质属性（战斗型NPC）',
        },
        agility: {
          type: 'number',
          description: '敏捷属性（战斗型NPC）',
        },
        intelligence: {
          type: 'number',
          description: '智力属性（战斗型NPC）',
        },
        luck: {
          type: 'number',
          description: '幸运属性（战斗型NPC）',
        },
        goals: {
          type: 'array',
          description: 'NPC目标列表（JSON数组）',
          default: [],
        },
        state: {
          type: 'object',
          description: 'NPC状态数据（JSON对象）',
          default: {},
        },
      },
      required: ['id', 'name', 'location'],
    },
    handler: async (args: {
      id: string;
      name: string;
      location: string;
      is_alive?: boolean;
      max_hp?: number;
      current_hp?: number;
      description?: string;
      role?: string;
      personality?: string;
      level?: number;
      strength?: number;
      vitality?: number;
      agility?: number;
      intelligence?: number;
      luck?: number;
      goals?: any[];
      state?: Record<string, any>;
    }) => {
      // 检查NPC是否已存在
      const existing = await queryOne<NPC>(
        'SELECT * FROM npcs WHERE id = $1',
        [args.id]
      );

      if (existing) {
        throw new Error(`NPC已存在: ${args.id}`);
      }

      // 构建动态SQL
      const fields = ['id', 'name', 'location', 'is_alive', 'max_hp', 'current_hp', 'goals', 'state'];
      const values: any[] = [
        args.id,
        args.name,
        args.location,
        args.is_alive !== undefined ? args.is_alive : true,
        args.max_hp !== undefined ? args.max_hp : 100,
        args.current_hp !== undefined ? args.current_hp : 100,
        JSON.stringify(args.goals || []),
        JSON.stringify(args.state || {})
      ];

      // 添加可选字段
      if (args.description !== undefined) {
        fields.push('description');
        values.push(args.description);
      }
      if (args.role !== undefined) {
        fields.push('role');
        values.push(args.role);
      }
      if (args.personality !== undefined) {
        fields.push('personality');
        values.push(args.personality);
      }
      if (args.level !== undefined) {
        fields.push('level');
        values.push(args.level);
      }
      if (args.strength !== undefined) {
        fields.push('strength');
        values.push(args.strength);
      }
      if (args.vitality !== undefined) {
        fields.push('vitality');
        values.push(args.vitality);
      }
      if (args.agility !== undefined) {
        fields.push('agility');
        values.push(args.agility);
      }
      if (args.intelligence !== undefined) {
        fields.push('intelligence');
        values.push(args.intelligence);
      }
      if (args.luck !== undefined) {
        fields.push('luck');
        values.push(args.luck);
      }

      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
      const sql = `INSERT INTO npcs (${fields.join(', ')}) VALUES (${placeholders}) RETURNING *`;

      const result = await query<NPC>(sql, values);

      return {
        success: true,
        message: `成功创建NPC: ${args.name} (${args.id})`,
        npc: result[0],
      };
    },
  });

  // 3. 创建阵营
  tools.set('create_faction', {
    name: 'create_faction',
    description: '创建新的阵营',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: '阵营唯一ID（格式：faction_xxx）',
        },
        name: {
          type: 'string',
          description: '阵营名称',
        },
        resources: {
          type: 'object',
          description: '阵营资源（JSON对象，如：{"gold": 10000, "soldiers": 500}）',
          default: {},
        },
        territory: {
          type: 'array',
          description: '控制的领土列表（字符串数组）',
          default: [],
        },
      },
      required: ['id', 'name'],
    },
    handler: async (args: {
      id: string;
      name: string;
      resources?: Record<string, any>;
      territory?: string[];
    }) => {
      // 检查阵营是否已存在
      const existing = await queryOne<Faction>(
        'SELECT * FROM factions WHERE id = $1',
        [args.id]
      );

      if (existing) {
        throw new Error(`阵营已存在: ${args.id}`);
      }

      const result = await query<Faction>(
        `INSERT INTO factions (id, name, resources, territory)
        VALUES ($1, $2, $3, $4)
        RETURNING *`,
        [
          args.id,
          args.name,
          JSON.stringify(args.resources || {}),
          JSON.stringify(args.territory || [])
        ]
      );

      return {
        success: true,
        message: `成功创建阵营: ${args.name} (${args.id})`,
        faction: result[0],
      };
    },
  });

  // 4. 删除玩家
  tools.set('delete_player', {
    name: 'delete_player',
    description: '删除玩家角色（会级联删除相关数据）',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: '玩家名称',
        },
      },
      required: ['name'],
    },
    handler: async (args: { name: string }) => {
      const player = await queryOne<Player>(
        'SELECT * FROM players WHERE name = $1',
        [args.name]
      );

      if (!player) {
        throw new Error(`玩家不存在: ${args.name}`);
      }

      await query('DELETE FROM players WHERE id = $1', [player.id]);

      return {
        success: true,
        message: `成功删除玩家: ${args.name}`,
        deleted_player_id: player.id,
      };
    },
  });

  // 5. 删除NPC
  tools.set('delete_npc', {
    name: 'delete_npc',
    description: '删除NPC',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'NPC ID',
        },
      },
      required: ['id'],
    },
    handler: async (args: { id: string }) => {
      const npc = await queryOne<NPC>(
        'SELECT * FROM npcs WHERE id = $1',
        [args.id]
      );

      if (!npc) {
        throw new Error(`NPC不存在: ${args.id}`);
      }

      await query('DELETE FROM npcs WHERE id = $1', [args.id]);

      return {
        success: true,
        message: `成功删除NPC: ${npc.name} (${args.id})`,
      };
    },
  });

  // 6. 删除阵营
  tools.set('delete_faction', {
    name: 'delete_faction',
    description: '删除阵营',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: '阵营ID',
        },
      },
      required: ['id'],
    },
    handler: async (args: { id: string }) => {
      const faction = await queryOne<Faction>(
        'SELECT * FROM factions WHERE id = $1',
        [args.id]
      );

      if (!faction) {
        throw new Error(`阵营不存在: ${args.id}`);
      }

      await query('DELETE FROM factions WHERE id = $1', [args.id]);

      return {
        success: true,
        message: `成功删除阵营: ${faction.name} (${args.id})`,
      };
    },
  });
}


