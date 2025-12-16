// 制作系统工具
import { query, queryOne, transaction } from '../database/connection.js';
import type { Player } from '../types.js';

export function registerCraftingTools(tools: Map<string, any>) {

  // 1. 获取玩家制作熟练度
  tools.set('get_crafting_proficiency', {
    name: 'get_crafting_proficiency',
    description: '获取玩家的制作熟练度',
    inputSchema: {
      type: 'object',
      properties: {
        player_name: {
          type: 'string',
          description: '玩家名称',
        },
        profession: {
          type: 'string',
          description: '制作职业(可选): blacksmith, alchemy, enchanting, tailoring, cooking, jewelcrafting',
        },
      },
      required: ['player_name'],
    },
    handler: async (args: { player_name: string; profession?: string }) => {
      const player = await queryOne<Player>(
        'SELECT id FROM players WHERE name = $1',
        [args.player_name]
      );

      if (!player) {
        throw new Error(`玩家不存在: ${args.player_name}`);
      }

      let proficiencies;
      if (args.profession) {
        proficiencies = await query(
          'SELECT * FROM player_crafting_proficiency WHERE player_id = $1 AND profession = $2',
          [player.id, args.profession]
        );
      } else {
        proficiencies = await query(
          'SELECT * FROM player_crafting_proficiency WHERE player_id = $1',
          [player.id]
        );
      }

      return {
        player_name: args.player_name,
        proficiencies: proficiencies,
      };
    },
  });

  // 2. 获取已学配方
  tools.set('get_learned_recipes', {
    name: 'get_learned_recipes',
    description: '获取玩家已学习的配方',
    inputSchema: {
      type: 'object',
      properties: {
        player_name: {
          type: 'string',
          description: '玩家名称',
        },
        profession: {
          type: 'string',
          description: '制作职业(可选)',
        },
      },
      required: ['player_name'],
    },
    handler: async (args: { player_name: string; profession?: string }) => {
      const player = await queryOne<Player>(
        'SELECT id FROM players WHERE name = $1',
        [args.player_name]
      );

      if (!player) {
        throw new Error(`玩家不存在: ${args.player_name}`);
      }

      let recipes;
      if (args.profession) {
        recipes = await query(
          `SELECT r.* FROM recipes r
           INNER JOIN player_recipes pr ON r.id = pr.recipe_id
           WHERE pr.player_id = $1 AND r.profession = $2
           ORDER BY r.tier, r.name`,
          [player.id, args.profession]
        );
      } else {
        recipes = await query(
          `SELECT r.* FROM recipes r
           INNER JOIN player_recipes pr ON r.id = pr.recipe_id
           WHERE pr.player_id = $1
           ORDER BY r.profession, r.tier, r.name`,
          [player.id]
        );
      }

      return {
        player_name: args.player_name,
        total_recipes: recipes.length,
        recipes: recipes,
      };
    },
  });

  // 3. 学习配方
  tools.set('learn_recipe', {
    name: 'learn_recipe',
    description: '学习新配方',
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
      },
      required: ['player_name', 'recipe_id'],
    },
    handler: async (args: { player_name: string; recipe_id: string }) => {
      const player = await queryOne<Player>(
        'SELECT id FROM players WHERE name = $1',
        [args.player_name]
      );

      if (!player) {
        throw new Error(`玩家不存在: ${args.player_name}`);
      }

      // 检查配方是否存在
      const recipe = await queryOne(
        'SELECT * FROM recipes WHERE id = $1',
        [args.recipe_id]
      );

      if (!recipe) {
        throw new Error(`配方不存在: ${args.recipe_id}`);
      }

      // 检查是否已学习
      const existing = await queryOne(
        'SELECT * FROM player_recipes WHERE player_id = $1 AND recipe_id = $2',
        [player.id, args.recipe_id]
      );

      if (existing) {
        throw new Error(`已经学习过该配方: ${recipe.name}`);
      }

      // 添加配方
      await query(
        'INSERT INTO player_recipes (player_id, recipe_id) VALUES ($1, $2)',
        [player.id, args.recipe_id]
      );

      return {
        player_name: args.player_name,
        recipe_learned: recipe.name,
        recipe_id: args.recipe_id,
        profession: recipe.profession,
        success: true,
      };
    },
  });

  // 4. 制作物品
  tools.set('craft_item', {
    name: 'craft_item',
    description: '使用配方制作物品',
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
      },
      required: ['player_name', 'recipe_id'],
    },
    handler: async (args: { player_name: string; recipe_id: string }) => {
      return await transaction(async (client) => {
        // 获取玩家
        const player = await client.query(
          'SELECT * FROM players WHERE name = $1',
          [args.player_name]
        );

        if (player.rows.length === 0) {
          throw new Error(`玩家不存在: ${args.player_name}`);
        }

        const playerData = player.rows[0];

        // 获取配方
        const recipe = await client.query(
          'SELECT * FROM recipes WHERE id = $1',
          [args.recipe_id]
        );

        if (recipe.rows.length === 0) {
          throw new Error(`配方不存在: ${args.recipe_id}`);
        }

        const recipeData = recipe.rows[0];

        // 检查是否已学习配方
        const learned = await client.query(
          'SELECT * FROM player_recipes WHERE player_id = $1 AND recipe_id = $2',
          [playerData.id, args.recipe_id]
        );

        if (learned.rows.length === 0) {
          throw new Error(`尚未学习该配方: ${recipeData.name}`);
        }

        // 获取玩家熟练度
        const proficiency = await client.query(
          'SELECT * FROM player_crafting_proficiency WHERE player_id = $1 AND profession = $2',
          [playerData.id, recipeData.profession]
        );

        let currentProficiency = 0;
        if (proficiency.rows.length > 0) {
          currentProficiency = proficiency.rows[0].level;
        }

        // 检查熟练度要求
        if (currentProficiency < recipeData.proficiency_required) {
          throw new Error(
            `熟练度不足。需要: ${recipeData.proficiency_required}, 当前: ${currentProficiency}`
          );
        }

        // 检查材料
        const materials = recipeData.materials as Array<{
          item_id: string;
          quantity: number;
          quality_min?: string;
        }>;

        for (const material of materials) {
          const inventory = await client.query(
            'SELECT * FROM inventory WHERE player_id = $1 AND item_id = $2',
            [playerData.id, material.item_id]
          );

          if (inventory.rows.length === 0 || inventory.rows[0].quantity < material.quantity) {
            throw new Error(
              `材料不足: ${material.item_id} (需要: ${material.quantity})`
            );
          }
        }

        // 计算成功率
        const proficiencyDiff = currentProficiency - recipeData.proficiency_required;
        let successRate = 100 - Math.max(0, -proficiencyDiff) * 0.5;
        successRate = Math.max(5, Math.min(98, successRate));

        const roll = Math.random() * 100;
        const isSuccess = roll <= successRate;

        // 消耗材料
        for (const material of materials) {
          const lossRate = isSuccess ? 1.0 : (successRate >= 50 ? 0.5 : 0.8);
          const lostQuantity = Math.ceil(material.quantity * lossRate);

          await client.query(
            'UPDATE inventory SET quantity = quantity - $1 WHERE player_id = $2 AND item_id = $3',
            [lostQuantity, playerData.id, material.item_id]
          );

          // 删除数量为0的物品
          await client.query(
            'DELETE FROM inventory WHERE player_id = $1 AND quantity <= 0',
            [playerData.id]
          );
        }

        // 增加熟练度
        const proficiencyGain = isSuccess
          ? recipeData.proficiency_gain
          : Math.floor(recipeData.proficiency_gain * 0.25);

        if (proficiency.rows.length > 0) {
          await client.query(
            'UPDATE player_crafting_proficiency SET experience = experience + $1, updated_at = CURRENT_TIMESTAMP WHERE player_id = $2 AND profession = $3',
            [proficiencyGain, playerData.id, recipeData.profession]
          );
        } else {
          await client.query(
            'INSERT INTO player_crafting_proficiency (player_id, profession, level, experience) VALUES ($1, $2, 0, $3)',
            [playerData.id, recipeData.profession, proficiencyGain]
          );
        }

        let craftedItem = null;

        // 如果成功,添加物品到背包
        if (isSuccess) {
          // 计算品质
          const qualityRoll = Math.random() * 100 + proficiencyDiff / 10;
          let quality = 'normal';
          if (qualityRoll >= 99) quality = 'legendary';
          else if (qualityRoll >= 91) quality = 'epic';
          else if (qualityRoll >= 76) quality = 'rare';
          else if (qualityRoll >= 51) quality = 'fine';
          else if (qualityRoll < 20) quality = 'trash';

          // 添加到背包
          const existing = await client.query(
            'SELECT * FROM inventory WHERE player_id = $1 AND item_id = $2 AND quality = $3',
            [playerData.id, recipeData.output_item_id, quality]
          );

          if (existing.rows.length > 0) {
            await client.query(
              'UPDATE inventory SET quantity = quantity + $1 WHERE player_id = $2 AND item_id = $3 AND quality = $4',
              [recipeData.output_quantity, playerData.id, recipeData.output_item_id, quality]
            );
          } else {
            await client.query(
              'INSERT INTO inventory (player_id, item_id, quantity, quality) VALUES ($1, $2, $3, $4)',
              [playerData.id, recipeData.output_item_id, recipeData.output_quantity, quality]
            );
          }

          craftedItem = {
            item_id: recipeData.output_item_id,
            quantity: recipeData.output_quantity,
            quality: quality,
          };
        }

        return {
          player_name: args.player_name,
          recipe_name: recipeData.name,
          success: isSuccess,
          success_rate: Math.round(successRate),
          proficiency_gained: proficiencyGain,
          crafted_item: craftedItem,
          materials_consumed: materials,
        };
      });
    },
  });

  // 5. 创建或获取配方(LLM动态生成)
  tools.set('create_or_get_recipe', {
    name: 'create_or_get_recipe',
    description: '创建新配方或获取已存在的配方。如果配方不存在,LLM可以根据游戏逻辑动态生成配方数据',
    inputSchema: {
      type: 'object',
      properties: {
        recipe_id: {
          type: 'string',
          description: '配方ID (格式: RCP-{职业缩写}-{4位数字}, 如 RCP-BLS-0001)',
        },
        name: {
          type: 'string',
          description: '配方名称',
        },
        profession: {
          type: 'string',
          description: '制作职业: blacksmith, alchemy, enchanting, tailoring, cooking, jewelcrafting',
        },
        tier: {
          type: 'number',
          description: '配方等级 (1-5)',
        },
        proficiency_required: {
          type: 'number',
          description: '需要的熟练度',
        },
        proficiency_gain: {
          type: 'number',
          description: '制作成功获得的熟练度',
        },
        materials: {
          type: 'array',
          description: '材料需求列表',
          items: {
            type: 'object',
            properties: {
              item_id: { type: 'string' },
              quantity: { type: 'number' },
              quality_min: { type: 'string' },
            },
          },
        },
        output_item_id: {
          type: 'string',
          description: '产出物品ID',
        },
        output_quantity: {
          type: 'number',
          description: '产出数量',
        },
        description: {
          type: 'string',
          description: '配方描述',
        },
      },
      required: ['recipe_id', 'name', 'profession', 'tier', 'materials', 'output_item_id'],
    },
    handler: async (args: any) => {
      // 检查配方是否已存在
      const existing = await queryOne(
        'SELECT * FROM recipes WHERE id = $1',
        [args.recipe_id]
      );

      if (existing) {
        return {
          recipe_id: args.recipe_id,
          name: existing.name,
          already_exists: true,
          recipe: existing,
        };
      }

      // 创建新配方
      const result = await query(
        `INSERT INTO recipes (
          id, name, profession, tier, proficiency_required, proficiency_gain,
          materials, output_item_id, output_quantity, description
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          args.recipe_id,
          args.name,
          args.profession,
          args.tier || 1,
          args.proficiency_required || 0,
          args.proficiency_gain || 1,
          JSON.stringify(args.materials),
          args.output_item_id,
          args.output_quantity || 1,
          args.description || '',
        ]
      );

      return {
        recipe_id: args.recipe_id,
        name: args.name,
        created: true,
        recipe: result[0],
      };
    },
  });
}
