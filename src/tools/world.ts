// 存档与世界演化工具
import { query, queryOne, transaction } from '../database/connection.js';
import type { Player, WorldState } from '../types.js';
import { WEATHER_TYPES } from '../utils/constants.js';

export function registerWorldTools(tools: Map<string, any>) {

  // 1. 保存游戏
  tools.set('save_game', {
    name: 'save_game',
    description: '保存游戏（创建完整状态快照）',
    inputSchema: {
      type: 'object',
      properties: {
        player_name: {
          type: 'string',
          description: '玩家名称',
        },
        save_name: {
          type: 'string',
          description: '存档名称（可选）',
        },
      },
      required: ['player_name'],
    },
    handler: async (args: { player_name: string; save_name?: string }) => {
      return await transaction(async (client) => {
        // 获取玩家数据
        const playerResult = await client.query('SELECT * FROM players WHERE name = $1', [args.player_name]);
        const player = playerResult.rows[0] as Player;
        if (!player) throw new Error(`玩家不存在: ${args.player_name}`);

        // 获取所有相关数据
        const inventory = await client.query('SELECT * FROM inventory WHERE player_id = $1', [player.id]);
        const equipment = await client.query('SELECT * FROM equipment WHERE player_id = $1', [player.id]);
        const quests = await client.query('SELECT * FROM player_quests WHERE player_id = $1', [player.id]);
        const skills = await client.query('SELECT * FROM player_skills WHERE player_id = $1', [player.id]);
        const factions = await client.query('SELECT * FROM player_faction_standing WHERE player_id = $1', [player.id]);
        const relations = await client.query('SELECT * FROM player_npc_relations WHERE player_id = $1', [player.id]);
        const companions = await client.query('SELECT * FROM player_companions WHERE player_id = $1', [player.id]);
        const worldState = await client.query('SELECT * FROM world_state WHERE id = 1');

        // 创建快照
        const snapshot = {
          player: player,
          inventory: inventory.rows,
          equipment: equipment.rows,
          quests: quests.rows,
          skills: skills.rows,
          factions: factions.rows,
          relations: relations.rows,
          companions: companions.rows,
          world_state: worldState.rows[0],
          saved_at: new Date().toISOString(),
        };

        // 保存快照
        const result = await client.query(
          'INSERT INTO saves (player_id, save_name, snapshot) VALUES ($1, $2, $3) RETURNING id',
          [player.id, args.save_name || `存档_${new Date().toLocaleString('zh-CN')}`, JSON.stringify(snapshot)]
        );

        return {
          save_id: result.rows[0].id,
          save_name: args.save_name,
          player_name: args.player_name,
          success: true,
        };
      });
    },
  });

  // 2. 加载存档
  tools.set('load_game', {
    name: 'load_game',
    description: '加载游戏存档',
    inputSchema: {
      type: 'object',
      properties: {
        save_id: {
          type: 'number',
          description: '存档ID',
        },
      },
      required: ['save_id'],
    },
    handler: async (args: { save_id: number }) => {
      const save = await queryOne(
        'SELECT * FROM saves WHERE id = $1',
        [args.save_id]
      );

      if (!save) {
        throw new Error(`存档不存在: ${args.save_id}`);
      }

      return {
        save_id: args.save_id,
        save_name: save.save_name,
        snapshot: save.snapshot,
        created_at: save.created_at,
        success: true,
      };
    },
  });

  // 3. 列出存档
  tools.set('list_saves', {
    name: 'list_saves',
    description: '列出玩家的所有存档',
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

      const saves = await query(
        'SELECT id, save_name, created_at FROM saves WHERE player_id = $1 ORDER BY created_at DESC',
        [player.id]
      );

      return {
        player_name: args.player_name,
        total_saves: saves.length,
        saves: saves,
      };
    },
  });

  // 辅助函数:正确格式化游戏时间
  function formatGameTime(totalMinutes: number) {
    const days = Math.floor(totalMinutes / 1440);
    const remainingMinutes = totalMinutes % 1440;
    const hours = Math.floor(remainingMinutes / 60);
    const minutes = remainingMinutes % 60;

    return {
      total_minutes: totalMinutes,
      days: days,
      hours: hours,
      minutes: minutes,
      formatted: `第${days}天 ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
    };
  }

  // 4. 推进时间
  tools.set('advance_time', {
    name: 'advance_time',
    description: '推进游戏时间（触发世界演化、任务过期检测）',
    inputSchema: {
      type: 'object',
      properties: {
        duration_minutes: {
          type: 'number',
          description: '推进的时间（分钟）',
        },
        activity: {
          type: 'string',
          description: '活动类型（wait, travel, craft等）',
          default: 'wait',
        },
      },
      required: ['duration_minutes'],
    },
    handler: async (args: { duration_minutes: number; activity?: string }) => {
      return await transaction(async (client) => {
        const worldResult = await client.query('SELECT * FROM world_state WHERE id = 1');
        const worldState = worldResult.rows[0] as WorldState;

        if (!worldState) {
          throw new Error('世界状态未初始化');
        }

        // 修复: 确保 game_time 是数字类型（PostgreSQL BIGINT 可能被转换为字符串）
        const oldGameTime = Number(worldState.game_time);
        const newGameTime = oldGameTime + args.duration_minutes;

        // 修复: 正确计算天气变化概率
        // 每游戏日(1440分钟)有30%概率变化天气
        const daysProgressed = args.duration_minutes / 1440;
        const weatherChangeChance = daysProgressed * 30; // 每天30%概率

        let newWeather = worldState.weather;
        let weatherChanged = false;

        if (Math.random() * 100 < weatherChangeChance) {
          const currentIndex = WEATHER_TYPES.indexOf(worldState.weather as any);
          // 避免连续相同天气,选择不同的天气
          const availableWeathers = WEATHER_TYPES.filter((w, i) => i !== currentIndex);
          newWeather = availableWeathers[Math.floor(Math.random() * availableWeathers.length)];
          weatherChanged = true;
        }

        // 更新世界状态
        await client.query(
          'UPDATE world_state SET game_time = $1, weather = $2, updated_at = CURRENT_TIMESTAMP WHERE id = 1',
          [newGameTime, newWeather]
        );

        // 修复: 检查并更新过期任务
        const expiredQuests = await client.query(
          `UPDATE player_quests
           SET status = 'expired', updated_at = CURRENT_TIMESTAMP
           WHERE status = 'active'
           AND expires_at IS NOT NULL
           AND expires_at <= CURRENT_TIMESTAMP + ($1 || ' minutes')::interval
           RETURNING quest_id, player_id`,
          [args.duration_minutes]
        );

        // 修复: 使用正确的时间格式化函数
        const oldTime = formatGameTime(oldGameTime);
        const newTime = formatGameTime(newGameTime);

        return {
          time_passed_minutes: args.duration_minutes,
          activity: args.activity || 'wait',
          old_game_time: oldTime,
          new_game_time: newTime,
          weather_changed: weatherChanged,
          old_weather: worldState.weather,
          new_weather: newWeather,
          expired_quests_count: expiredQuests.rowCount || 0,
          expired_quests: expiredQuests.rows,
          world_changes: [], // 可以在这里添加更多世界演化逻辑
        };
      });
    },
  });
}

