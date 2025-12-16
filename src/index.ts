#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// 导入工具处理器
import { registerQueryTools } from './tools/query.js';
import { registerCalculateTools } from './tools/calculate.js';
import { registerUpdateTools } from './tools/update.js';
import { registerWorldTools } from './tools/world.js';
import { registerAdminTools } from './tools/admin.js';
import { registerCraftingTools } from './tools/crafting.js';
import { registerAchievementTools } from './tools/achievement.js';
import { registerEntityTools } from './tools/entity.js';
import { registerDatabaseTools } from './tools/database.js';

// 创建MCP服务器
const server = new Server(
  {
    name: 'rpg-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 存储所有工具
const tools = new Map<string, any>();

// 注册所有工具
function registerAllTools() {
  registerAdminTools(tools);    // 管理员工具（数据库初始化）
  registerQueryTools(tools);
  registerCalculateTools(tools);
  registerUpdateTools(tools);
  registerWorldTools(tools);
  registerCraftingTools(tools); // 制作系统工具
  registerAchievementTools(tools); // 成就系统工具
  registerEntityTools(tools);   // 实体创建工具（角色、NPC、阵营）
  registerDatabaseTools(tools); // 通用数据库CRUD工具
}

// 处理工具列表请求
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: Array.from(tools.values()).map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  };
});

// 处理工具调用请求
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const toolName = request.params.name;
  const tool = tools.get(toolName);

  if (!tool) {
    throw new Error(`未知工具: ${toolName}`);
  }

  try {
    const result = await tool.handler(request.params.arguments || {});
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: true,
            message: error.message,
            details: error.stack,
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// 启动服务器
async function main() {
  console.error('启动 RPG MCP 服务器...');

  // 注册所有工具
  registerAllTools();

  console.error(`已注册 ${tools.size} 个工具`);

  // 使用stdio传输
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('✓ RPG MCP 服务器已启动');
}

main().catch((error) => {
  console.error('服务器启动失败:', error);
  process.exit(1);
});

