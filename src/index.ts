#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// 导入数据库连接测试
import { testConnection } from './database/connection.js';

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
  console.error('🚀 [启动] 开始启动 RPG MCP 服务器...');
  console.error('📋 [启动] Node 版本:', process.version);
  console.error('📋 [启动] 工作目录:', process.cwd());

  try {
    // 测试数据库连接
    console.error('🔍 [启动] 测试数据库连接...');
    const dbOk = await testConnection();
    if (!dbOk) {
      throw new Error('数据库连接失败,请检查配置和数据库状态');
    }

    console.error('� [启动] 开始注册工具...');
    registerAllTools();
    console.error(`✓ [启动] 已注册 ${tools.size} 个工具`);

    console.error('🔌 [启动] 创建 stdio 传输层...');
    const transport = new StdioServerTransport();
    
    console.error('🤝 [启动] 连接 MCP 服务器...');
    await server.connect(transport);

    console.error('✅ [启动] RPG MCP 服务器已完全启动并就绪!');
  } catch (error) {
    console.error('❌ [启动错误]', error);
    throw error;
  }
}

main().catch((error) => {
  console.error('💥 [致命错误] 服务器启动失败:', error);
  console.error('💥 [致命错误] 堆栈:', error.stack);
  process.exit(1);
});

