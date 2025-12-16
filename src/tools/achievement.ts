// 成就系统工具
import { query, queryOne, transaction } from '../database/connection.js';
import type { Player } from '../types.js';

export function registerAchievementTools(tools: Map<string, any>) {

  // 1. 获取玩家成就进度
  tools.set('get_player_achievements', {
    name: 'get_player_achievements',
    description: '获取玩家的成就进度',
    inputSchema: {
      type: 'object',
      properties: {
        player_name: {
          type: 'string',
          description: '玩家名称',
        },
        category: {
          type: 'string',
          description: '成就类别(可选): combat, exploration, crafting, social, collection, story',
        },
        completed_only: {
          type: 'boolean',
          description: '是否只显示已完成的成就',
        },
      },
      required: ['player_name'],
    },
    handler: async (args: { player_name: string; category?: string; completed_only?: boolean }) => {
      const player = await queryOne<Player>(
        'SELECT id FROM players WHERE name = $1',
        [args.player_name]
      );

      if (!player) {
        throw new Error(`玩家不存在: ${args.player_name}`);
      }

      let achievementQuery = `
        SELECT a.*, pa.progress, pa.is_completed, pa.completed_at
        FROM achievements a
        LEFT JOIN player_achievements pa ON a.id = pa.achievement_id AND pa.player_id = $1
      `;

      const params: any[] = [player.id];
      const conditions: string[] = [];

      if (args.category) {
        conditions.push(`a.category = $${params.length + 1}`);
        params.push(args.category);
      }

      if (args.completed_only) {
        conditions.push('pa.is_completed = true');
      }

      if (conditions.length > 0) {
        achievementQuery += ' WHERE ' + conditions.join(' AND ');
      }

      achievementQuery += ' ORDER BY a.category, a.difficulty, a.name';

      const achievements = await query(achievementQuery, params);

      // 获取统计数据
      const stats = await queryOne(
        'SELECT * FROM player_achievement_stats WHERE player_id = $1',
        [player.id]
      );

      return {
        player_name: args.player_name,
        total_achievements: achievements.length,
        completed_count: stats?.completed_count || 0,
        achievement_points: stats?.achievement_points || 0,
        achievements: achievements,
      };
    },
  });

  // 2. 更新成就进度
  tools.set('update_achievement_progress', {
    name: 'update_achievement_progress',
    description: '更新玩家成就进度',
    inputSchema: {
      type: 'object',
      properties: {
        player_name: {
          type: 'string',
          description: '玩家名称',
        },
        achievement_id: {
          type: 'string',
          description: '成就ID',
        },
        progress: {
          type: 'object',
          description: '进度数据 (如: {"current": 50, "required": 100})',
        },
      },
      required: ['player_name', 'achievement_id', 'progress'],
    },
    handler: async (args: { player_name: string; achievement_id: string; progress: any }) => {
      return await transaction(async (client) => {
        const player = await client.query(
          'SELECT id FROM players WHERE name = $1',
          [args.player_name]
        );

        if (player.rows.length === 0) {
          throw new Error(`玩家不存在: ${args.player_name}`);
        }

        const playerData = player.rows[0];

        // 检查成就是否存在
        const achievement = await client.query(
          'SELECT * FROM achievements WHERE id = $1',
          [args.achievement_id]
        );

        if (achievement.rows.length === 0) {
          throw new Error(`成就不存在: ${args.achievement_id}`);
        }

        const achievementData = achievement.rows[0];

        // 检查是否已完成
        const existing = await client.query(
          'SELECT * FROM player_achievements WHERE player_id = $1 AND achievement_id = $2',
          [playerData.id, args.achievement_id]
        );

        let isCompleted = false;
        let justCompleted = false;

        // 检查是否达成
        if (args.progress.current >= args.progress.required) {
          isCompleted = true;
          if (existing.rows.length === 0 || !existing.rows[0].is_completed) {
            justCompleted = true;
          }
        }

        if (existing.rows.length > 0) {
          // 更新进度
          await client.query(
            `UPDATE player_achievements
             SET progress = $1, is_completed = $2, completed_at = $3, updated_at = CURRENT_TIMESTAMP
             WHERE player_id = $4 AND achievement_id = $5`,
            [
              JSON.stringify(args.progress),
              isCompleted,
              isCompleted ? new Date() : null,
              playerData.id,
              args.achievement_id,
            ]
          );
        } else {
          // 创建新进度记录
          await client.query(
            `INSERT INTO player_achievements (player_id, achievement_id, progress, is_completed, completed_at)
             VALUES ($1, $2, $3, $4, $5)`,
            [
              playerData.id,
              args.achievement_id,
              JSON.stringify(args.progress),
              isCompleted,
              isCompleted ? new Date() : null,
            ]
          );
        }

        // 如果刚完成成就,更新统计数据和发放奖励
        if (justCompleted) {
          const rewards = achievementData.rewards || {};
          const achievementPoints = rewards.achievement_points || 0;

          // 更新统计
          const stats = await client.query(
            'SELECT * FROM player_achievement_stats WHERE player_id = $1',
            [playerData.id]
          );

          if (stats.rows.length > 0) {
            await client.query(
              `UPDATE player_achievement_stats
               SET achievement_points = achievement_points + $1,
                   completed_count = completed_count + 1,
                   updated_at = CURRENT_TIMESTAMP
               WHERE player_id = $2`,
              [achievementPoints, playerData.id]
            );
          } else {
            await client.query(
              `INSERT INTO player_achievement_stats (player_id, achievement_points, completed_count)
               VALUES ($1, $2, 1)`,
              [playerData.id, achievementPoints]
            );
          }

          return {
            player_name: args.player_name,
            achievement_name: achievementData.name,
            completed: true,
            rewards: rewards,
            progress: args.progress,
          };
        }

        return {
          player_name: args.player_name,
          achievement_name: achievementData.name,
          completed: isCompleted,
          progress: args.progress,
        };
      });
    },
  });

  // 3. 更新玩家统计数据
  tools.set('update_player_statistics', {
    name: 'update_player_statistics',
    description: '更新玩家统计数据(用于成就追踪)',
    inputSchema: {
      type: 'object',
      properties: {
        player_name: {
          type: 'string',
          description: '玩家名称',
        },
        stat_updates: {
          type: 'object',
          description: '统计数据更新 (如: {"enemies_killed.goblin": 1, "distance_traveled": 100})',
        },
      },
      required: ['player_name', 'stat_updates'],
    },
    handler: async (args: { player_name: string; stat_updates: Record<string, number> }) => {
      return await transaction(async (client) => {
        const player = await client.query(
          'SELECT id FROM players WHERE name = $1',
          [args.player_name]
        );

        if (player.rows.length === 0) {
          throw new Error(`玩家不存在: ${args.player_name}`);
        }

        const playerData = player.rows[0];

        // 获取当前统计数据
        const stats = await client.query(
          'SELECT * FROM player_achievement_stats WHERE player_id = $1',
          [playerData.id]
        );

        let currentStats = {};
        if (stats.rows.length > 0) {
          currentStats = stats.rows[0].statistics || {};
        }

        // 更新统计数据
        for (const [key, value] of Object.entries(args.stat_updates)) {
          const keys = key.split('.');
          let current: any = currentStats;

          for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) {
              current[keys[i]] = {};
            }
            current = current[keys[i]];
          }

          const lastKey = keys[keys.length - 1];
          current[lastKey] = (current[lastKey] || 0) + value;
        }

        // 保存更新后的统计数据
        if (stats.rows.length > 0) {
          await client.query(
            'UPDATE player_achievement_stats SET statistics = $1, updated_at = CURRENT_TIMESTAMP WHERE player_id = $2',
            [JSON.stringify(currentStats), playerData.id]
          );
        } else {
          await client.query(
            'INSERT INTO player_achievement_stats (player_id, statistics) VALUES ($1, $2)',
            [playerData.id, JSON.stringify(currentStats)]
          );
        }

        return {
          player_name: args.player_name,
          statistics: currentStats,
          updated: true,
        };
      });
    },
  });

  // 4. 创建或获取成就
  tools.set('create_or_get_achievement', {
    name: 'create_or_get_achievement',
    description: '创建新成就或获取已存在的成就。如果成就不存在,LLM可以根据游戏逻辑动态生成成就数据',
    inputSchema: {
      type: 'object',
      properties: {
        achievement_id: {
          type: 'string',
          description: '成就ID (格式: ACH-{类型缩写}-{4位数字}, 如 ACH-CMB-0001)',
        },
        name: {
          type: 'string',
          description: '成就名称',
        },
        description: {
          type: 'string',
          description: '成就描述',
        },
        category: {
          type: 'string',
          description: '成就类别: combat, exploration, crafting, social, collection, story',
        },
        completion_criteria: {
          type: 'object',
          description: '完成条件 (如: {"type": "kill_count", "target": "goblin", "required": 100})',
        },
        rewards: {
          type: 'object',
          description: '奖励 (如: {"title": "哥布林杀手", "achievement_points": 10})',
        },
        difficulty: {
          type: 'string',
          description: '难度: easy, normal, hard, legendary',
        },
        is_hidden: {
          type: 'boolean',
          description: '是否隐藏',
        },
      },
      required: ['achievement_id', 'name', 'description', 'category', 'completion_criteria'],
    },
    handler: async (args: any) => {
      // 检查成就是否已存在
      const existing = await queryOne(
        'SELECT * FROM achievements WHERE id = $1',
        [args.achievement_id]
      );

      if (existing) {
        return {
          achievement_id: args.achievement_id,
          name: existing.name,
          already_exists: true,
          achievement: existing,
        };
      }

      // 创建新成就
      const result = await query(
        `INSERT INTO achievements (
          id, name, description, category, completion_criteria, rewards, difficulty, is_hidden
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          args.achievement_id,
          args.name,
          args.description,
          args.category,
          JSON.stringify(args.completion_criteria),
          JSON.stringify(args.rewards || {}),
          args.difficulty || 'normal',
          args.is_hidden || false,
        ]
      );

      return {
        achievement_id: args.achievement_id,
        name: args.name,
        created: true,
        achievement: result[0],
      };
    },
  });
}

