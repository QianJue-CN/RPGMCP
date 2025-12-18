// 通用数据库CRUD工具 - 为LLM提供灵活的数据库操作能力
import { query, queryOne, transaction } from '../database/connection.js';
import pool from '../database/connection.js';

export function registerDatabaseTools(tools: Map<string, any>) {

  // 1. 通用查询工具
  tools.set('db_query', {
    name: 'db_query',
    description: '执行通用SQL查询（SELECT语句）。支持参数化查询以防止SQL注入。',
    inputSchema: {
      type: 'object',
      properties: {
        sql: {
          type: 'string',
          description: 'SQL查询语句（仅支持SELECT）',
        },
        params: {
          type: 'array',
          description: '查询参数数组（用于参数化查询，使用$1, $2等占位符）',
          default: [],
        },
      },
      required: ['sql'],
    },
    handler: async (args: { sql: string; params?: any[] }) => {
      // 安全检查：只允许SELECT语句
      const trimmedSQL = args.sql.trim().toUpperCase();
      if (!trimmedSQL.startsWith('SELECT')) {
        throw new Error('db_query只支持SELECT查询。请使用db_insert、db_update或db_delete进行数据修改。');
      }

      try {
        const result = await query(args.sql, args.params || []);
        return {
          success: true,
          row_count: result.length,
          rows: result,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
          hint: '请检查SQL语法和参数',
        };
      }
    },
  });

  // 2. 通用插入工具
  tools.set('db_insert', {
    name: 'db_insert',
    description: `向指定表插入数据。各表字段要求如下：

**players表** - 必需字段: name; 可选字段: level, experience, strength, vitality, agility, intelligence, wisdom, luck, charisma, max_hp, current_hp, max_mp, current_mp, gold, stat_points, skill_points, location

**inventory表** - 必需字段: player_id, item_id; 可选字段: quantity, quality, metadata, description, notes

**equipment表** - 必需字段: player_id, slot, item_id; 可选字段: quality, bonuses, description, notes

**player_quests表** - 必需字段: player_id, quest_id; 可选字段: status, objectives_progress, description, notes, expires_at

**player_skills表** - 必需字段: player_id, skill_id; 可选字段: level, experience, description, effect_description, notes

**player_faction_standing表** - 必需字段: player_id, faction_id; 可选字段: reputation_value, reputation_tier, notes

**player_npc_relations表** - 必需字段: player_id, npc_id; 可选字段: affection, loyalty, trust, relationship_status, notes, last_interaction, interaction_count

**player_companions表** - 必需字段: player_id, npc_id; 可选字段: is_active, nickname, notes

**npcs表** - 必需字段: id, name, location; 可选字段: is_alive, max_hp, current_hp, description, role, personality, level, strength, vitality, agility, intelligence, luck, goals, state

**factions表** - 必需字段: id, name; 可选字段: description, ideology, leader, resources, territory

**world_state表** - 必需字段: id; 可选字段: game_time, weather, active_events (注意: id必须为1)

**saves表** - 必需字段: player_id, snapshot; 可选字段: save_name

**player_crafting_proficiency表** - 必需字段: player_id, profession; 可选字段: level, experience

**recipes表** - 必需字段: id, name, profession, materials, output_item_id; 可选字段: tier, proficiency_required, proficiency_gain, tools_required, workstation, craft_time_seconds, output_quantity, output_quality_base, unlock_condition, description

**player_recipes表** - 必需字段: player_id, recipe_id

**achievements表** - 必需字段: id, name, description, category, completion_criteria; 可选字段: rewards, is_hidden, difficulty

**player_achievements表** - 必需字段: player_id, achievement_id; 可选字段: progress, is_completed, completed_at

**player_achievement_stats表** - 必需字段: player_id; 可选字段: achievement_points, completed_count, statistics

**materials表** - 必需字段: id, name, type; 可选字段: tier, properties, sources, stack_limit, description`,
    inputSchema: {
      type: 'object',
      properties: {
        table: {
          type: 'string',
          description: '表名',
        },
        data: {
          type: 'object',
          description: '要插入的数据（键值对）。请参考工具描述中各表的必需字段和可选字段要求',
        },
        returning: {
          type: 'string',
          description: '返回的字段（默认*返回所有字段）',
          default: '*',
        },
      },
      required: ['table', 'data'],
    },
    handler: async (args: { table: string; data: Record<string, any>; returning?: string }) => {
      const keys = Object.keys(args.data);
      const values = Object.values(args.data);

      if (keys.length === 0) {
        throw new Error('插入数据不能为空');
      }

      // 构建SQL
      const columns = keys.join(', ');
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      const returning = args.returning || '*';
      const sql = `INSERT INTO ${args.table} (${columns}) VALUES (${placeholders}) RETURNING ${returning}`;

      try {
        const result = await query(sql, values);
        return {
          success: true,
          message: `成功插入数据到表 ${args.table}`,
          inserted_row: result[0],
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
          hint: '请检查表名、字段名和数据类型是否正确',
        };
      }
    },
  });

  // 3. 通用更新工具
  tools.set('db_update', {
    name: 'db_update',
    description: '更新表中的数据',
    inputSchema: {
      type: 'object',
      properties: {
        table: {
          type: 'string',
          description: '表名',
        },
        data: {
          type: 'object',
          description: '要更新的数据（键值对）',
        },
        where: {
          type: 'object',
          description: '更新条件（键值对，多个条件用AND连接）',
        },
        returning: {
          type: 'string',
          description: '返回的字段（默认*返回所有字段）',
          default: '*',
        },
      },
      required: ['table', 'data', 'where'],
    },
    handler: async (args: {
      table: string;
      data: Record<string, any>;
      where: Record<string, any>;
      returning?: string;
    }) => {
      const dataKeys = Object.keys(args.data);
      const whereKeys = Object.keys(args.where);

      if (dataKeys.length === 0) {
        throw new Error('更新数据不能为空');
      }

      if (whereKeys.length === 0) {
        throw new Error('必须指定WHERE条件以防止误操作');
      }

      // 构建SET子句
      const setClause = dataKeys.map((key, i) => `${key} = $${i + 1}`).join(', ');

      // 构建WHERE子句
      const whereClause = whereKeys.map((key, i) => `${key} = $${dataKeys.length + i + 1}`).join(' AND ');

      // 合并参数
      const params = [...Object.values(args.data), ...Object.values(args.where)];

      const returning = args.returning || '*';
      const sql = `UPDATE ${args.table} SET ${setClause} WHERE ${whereClause} RETURNING ${returning}`;

      try {
        const result = await query(sql, params);
        return {
          success: true,
          message: `成功更新表 ${args.table}`,
          updated_count: result.length,
          updated_rows: result,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
          hint: '请检查表名、字段名和数据类型是否正确',
        };
      }
    },
  });

  // 4. 通用删除工具
  tools.set('db_delete', {
    name: 'db_delete',
    description: '从表中删除数据',
    inputSchema: {
      type: 'object',
      properties: {
        table: {
          type: 'string',
          description: '表名',
        },
        where: {
          type: 'object',
          description: '删除条件（键值对，多个条件用AND连接）',
        },
        returning: {
          type: 'string',
          description: '返回的字段（默认*返回所有字段）',
          default: '*',
        },
      },
      required: ['table', 'where'],
    },
    handler: async (args: {
      table: string;
      where: Record<string, any>;
      returning?: string;
    }) => {
      const whereKeys = Object.keys(args.where);

      if (whereKeys.length === 0) {
        throw new Error('必须指定WHERE条件以防止误删除整个表');
      }

      // 构建WHERE子句
      const whereClause = whereKeys.map((key, i) => `${key} = $${i + 1}`).join(' AND ');
      const params = Object.values(args.where);

      const returning = args.returning || '*';
      const sql = `DELETE FROM ${args.table} WHERE ${whereClause} RETURNING ${returning}`;

      try {
        const result = await query(sql, params);
        return {
          success: true,
          message: `成功从表 ${args.table} 删除数据`,
          deleted_count: result.length,
          deleted_rows: result,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
          hint: '请检查表名和条件是否正确',
        };
      }
    },
  });

  // 5. 获取表结构
  tools.set('db_get_table_schema', {
    name: 'db_get_table_schema',
    description: '获取指定表的结构信息（字段名、类型等）',
    inputSchema: {
      type: 'object',
      properties: {
        table: {
          type: 'string',
          description: '表名',
        },
      },
      required: ['table'],
    },
    handler: async (args: { table: string }) => {
      try {
        const result = await query(`
          SELECT
            column_name,
            data_type,
            is_nullable,
            column_default,
            character_maximum_length
          FROM information_schema.columns
          WHERE table_name = $1
          ORDER BY ordinal_position
        `, [args.table]);

        if (result.length === 0) {
          return {
            success: false,
            error: `表 ${args.table} 不存在`,
          };
        }

        return {
          success: true,
          table: args.table,
          columns: result,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
        };
      }
    },
  });

  // 6. 列出所有表
  tools.set('db_list_tables', {
    name: 'db_list_tables',
    description: '列出数据库中的所有表',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
    handler: async () => {
      try {
        const result = await query(`
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE'
          ORDER BY table_name
        `);

        return {
          success: true,
          tables: result.map(row => row.table_name),
          count: result.length,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
        };
      }
    },
  });

  // 7. 执行事务
  tools.set('db_transaction', {
    name: 'db_transaction',
    description: '执行数据库事务（多个SQL语句作为一个原子操作）',
    inputSchema: {
      type: 'object',
      properties: {
        statements: {
          type: 'array',
          description: 'SQL语句数组，每个元素包含sql和params',
          items: {
            type: 'object',
            properties: {
              sql: { type: 'string' },
              params: { type: 'array', default: [] },
            },
            required: ['sql'],
          },
        },
      },
      required: ['statements'],
    },
    handler: async (args: { statements: Array<{ sql: string; params?: any[] }> }) => {
      if (!args.statements || args.statements.length === 0) {
        throw new Error('事务中至少需要一条SQL语句');
      }

      try {
        const results = await transaction(async (client) => {
          const txResults = [];
          for (const stmt of args.statements) {
            const result = await client.query(stmt.sql, stmt.params || []);
            txResults.push({
              rows: result.rows,
              row_count: result.rowCount,
            });
          }
          return txResults;
        });

        return {
          success: true,
          message: '事务执行成功',
          statement_count: args.statements.length,
          results: results,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
          message: '事务已回滚',
        };
      }
    },
  });
}


