# RPG MCP 服务器

[![npm version](https://badge.fury.io/js/@qianjue%2Frpg-mcp-server.svg)](https://www.npmjs.com/package/@qianjue/rpg-mcp-server)
[![GitHub](https://img.shields.io/github/license/QianJue-CN/RPGMCP)](https://github.com/QianJue-CN/RPGMCP)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-%3E%3D14-blue)](https://www.postgresql.org/)

[English](./README.md) | 中文文档 | [NPM 包](https://www.npmjs.com/package/@qianjue/rpg-mcp-server) | [GitHub](https://github.com/QianJue-CN/RPGMCP)

基于 PostgreSQL 数据库的完整、生产就绪的 RPG 游戏系统 MCP 服务器实现，使 LLM 能够运行复杂的文本 RPG 游戏，具有可靠的数据持久化能力。

## ✨ 功能特性

### 核心能力
- 🎮 **50+ MCP 工具**：包含查询、计算、更新和管理工具的完整游戏系统
- 💾 **PostgreSQL 数据库**：企业级数据持久化，支持 ACID 事务
- 🤖 **LLM 友好**：自动数据库初始化、动态内容生成、灵活的 CRUD 操作
- ⚡ **高性能**：LRU 缓存系统、连接池、带索引的优化查询
- 🔒 **类型安全**：完整的 TypeScript 实现，配合 Zod 验证
- 📊 **监控系统**：内置健康检查、日志系统、缓存统计

### 游戏系统
- ⚔️ **战斗系统**：自动伤害计算、经验奖励、战利品生成
- 🎯 **任务系统**：任务追踪、进度更新、完成奖励
- 🛠️ **制作系统**：6 种职业、配方学习、品质等级、熟练度进阶
- 🏆 **成就系统**：进度追踪、奖励发放、统计数据、多种类别
- 🌍 **世界系统**：时间推进、天气变化、动态事件
- 💼 **背包与装备**：物品管理、品质系统、装备加成
- 👥 **NPC 与阵营**：关系追踪、声望系统、同伴招募
- 💾 **存档系统**：完整游戏状态快照、多存档槽位

## 📦 安装

### 方式 1：NPM 全局安装（推荐）

```bash
npm install -g @qianjue/rpg-mcp-server
rpg-mcp-server
```

### 方式 2：NPX（无需安装）

```bash
npx @qianjue/rpg-mcp-server
```

### 方式 3：从源码构建

```bash
git clone https://github.com/QianJue-CN/RPGMCP.git
cd RPGMCP
npm install
npm run build
npm start
```

## 🚀 快速开始

### 前置要求

- **Node.js** 18.0.0 或更高版本
- **PostgreSQL** 14 或更高版本

### 1. 数据库设置

创建 PostgreSQL 数据库：

```bash
createdb rpg_game
```

### 2. 配置

创建 `.env` 文件（或通过 Claude Desktop 配置）：

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rpg_game
DB_USER=postgres
DB_PASSWORD=your_password
```

### 3. 数据库初始化

**方式 A：通过 LLM 自动初始化（推荐）**

启动服务器并让 LLM 初始化数据库：

```bash
npm start
```

然后询问 Claude：
```
检查数据库状态，如果需要请初始化
```

**方式 B：手动初始化**

```bash
npm run build
npm run db:migrate
npm run db:seed  # 可选：加载示例数据
```

## 🔧 Claude Desktop 配置

### 配置文件位置

- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

### 使用 NPX（推荐）

```json
{
  "mcpServers": {
    "rpg-game": {
      "command": "npx",
      "args": ["@qianjue/rpg-mcp-server"],
      "env": {
        "DB_HOST": "localhost",
        "DB_PORT": "5432",
        "DB_NAME": "rpg_game",
        "DB_USER": "postgres",
        "DB_PASSWORD": "your_password"
      }
    }
  }
}
```

### 使用绝对路径

```json
{
  "mcpServers": {
    "rpg-game": {
      "command": "node",
      "args": ["/absolute/path/to/RPGMCP/dist/index.js"],
      "env": {
        "DB_HOST": "localhost",
        "DB_PORT": "5432",
        "DB_NAME": "rpg_game",
        "DB_USER": "postgres",
        "DB_PASSWORD": "your_password"
      }
    }
  }
}
```

**注意**：配置更改后需要重启 Claude Desktop。

## 🛠️ 工具分类

### 🔐 管理员工具（3个）
- `get_database_status` - 检查数据库初始化状态
- `initialize_database` - 初始化数据库架构和种子数据
- `reset_database` - 重置数据库（危险操作）

### 📊 查询工具（10个）
- `get_player_status` - 获取完整玩家状态
- `get_inventory` - 获取背包物品
- `get_equipment` - 获取已装备物品
- `get_active_quests` - 获取活跃任务
- `get_skills` - 获取玩家技能
- `get_faction_standings` - 获取阵营声望
- `get_companions` - 获取同伴列表
- `get_npc_info` - 获取 NPC 信息
- `get_npc_relations` - 获取 NPC 关系
- `get_world_state` - 获取世界状态

### 🧮 计算工具（5个）
- `calculate_damage` - 计算战斗伤害
- `calculate_exp_reward` - 计算经验奖励
- `calculate_loot_drops` - 计算战利品掉落
- `calculate_craft_result` - 计算制作结果
- `calculate_reputation_change` - 计算声望变化

### ✏️ 更新工具（10个）
- `apply_damage` - 对目标应用伤害
- `heal_target` - 治疗目标
- `add_experience` - 添加经验（自动升级）
- `modify_inventory` - 修改背包物品
- `equip_item` - 装备/卸下物品
- `accept_quest` - 接受任务
- `update_quest_progress` - 更新任务进度
- `complete_quest` - 完成任务
- `update_reputation` - 更新阵营声望
- `update_npc_relation` - 更新 NPC 关系

### 🌍 世界与存档工具（4个）
- `save_game` - 保存游戏状态
- `load_game` - 加载已保存游戏
- `list_saves` - 列出所有存档
- `advance_time` - 推进游戏时间

### 🛠️ 制作工具（5个）
- `get_crafting_proficiency` - 获取制作熟练度
- `get_learned_recipes` - 获取已学配方
- `learn_recipe` - 学习新配方
- `craft_item` - 从配方制作物品
- `create_or_get_recipe` - 创建/获取配方（LLM 动态生成）

### 🏆 成就工具（4个）
- `get_player_achievements` - 获取成就进度
- `update_achievement_progress` - 更新成就进度
- `update_player_statistics` - 更新玩家统计
- `create_or_get_achievement` - 创建/获取成就（LLM 动态生成）

### 👤 实体创建工具（6个）
- `create_player` - 创建新玩家角色
- `create_npc` - 创建新 NPC
- `create_faction` - 创建新阵营
- `delete_player` - 删除玩家
- `delete_npc` - 删除 NPC
- `delete_faction` - 删除阵营

### 💾 数据库 CRUD 工具（7个）
- `db_query` - 执行 SELECT 查询
- `db_insert` - 向表中插入数据
- `db_update` - 更新表数据
- `db_delete` - 删除表数据
- `db_get_table_schema` - 获取表结构
- `db_list_tables` - 列出所有表
- `db_transaction` - 执行事务

## 📁 项目结构

```
rpg-mcp-server/
├── src/
│   ├── index.ts              # MCP 服务器入口
│   ├── types.ts              # TypeScript 类型定义
│   ├── cache/
│   │   ├── GameCache.ts      # LRU 缓存实现
│   │   └── index.ts          # 缓存导出
│   ├── database/
│   │   ├── connection.ts     # 数据库连接池
│   │   ├── migrate.ts        # 迁移脚本
│   │   └── seed.ts           # 种子数据脚本
│   ├── tools/
│   │   ├── admin.ts          # 管理员工具（数据库初始化）
│   │   ├── query.ts          # 查询工具
│   │   ├── calculate.ts      # 计算工具
│   │   ├── update.ts         # 更新工具
│   │   ├── world.ts          # 世界与存档工具
│   │   ├── crafting.ts       # 制作系统工具
│   │   ├── achievement.ts    # 成就系统工具
│   │   ├── entity.ts         # 实体创建工具
│   │   └── database.ts       # 通用 CRUD 工具
│   ├── validators/
│   │   ├── player.ts         # 玩家验证
│   │   ├── item.ts           # 物品验证
│   │   └── index.ts          # 验证器导出
│   ├── health/
│   │   └── index.ts          # 健康检查系统
│   ├── errors/
│   │   └── GameError.ts      # 自定义错误类
│   └── utils/
│       ├── formulas.ts       # 游戏公式
│       ├── constants.ts      # 游戏常量
│       └── logger.ts         # 日志系统
├── database/
│   ├── schema.sql            # 数据库架构
│   ├── seed.sql              # 种子数据
│   ├── add_indexes.sql       # 性能索引
│   ├── add_constraints.sql   # 数据约束
│   └── optimizations.sql     # 查询优化
├── prompts/
│   └── system_prompt_example.xml  # 系统提示词示例
└── package.json
```

## 🎮 使用示例

### 战斗场景

```
用户：我用火球术攻击哥布林

Claude 会自动：
1. 调用 get_player_status() 获取你的属性
2. 调用 calculate_damage() 计算伤害
3. 调用 apply_damage() 对哥布林应用伤害
4. 如果哥布林死亡，调用 calculate_loot_drops()
5. 调用 add_experience() 授予经验值
6. 生成生动的战斗叙述
```

### 制作场景

```
用户：我想制作一把铁剑

Claude 会：
1. 调用 get_learned_recipes() 检查你是否知道配方
2. 调用 get_inventory() 验证材料
3. 调用 craft_item() 执行制作
4. 自动更新熟练度
5. 描述制作过程和结果
```

### 任务场景

```
用户：我接受商队护送任务

Claude 会：
1. 调用 accept_quest() 接受任务
2. 描述任务详情和目标

用户：我完成了护送

Claude 会：
1. 调用 complete_quest() 完成任务
2. 自动授予奖励（经验、金币、物品）
3. 检查是否升级
```

## 🔍 高级特性

### 性能优化
- **LRU 缓存**：自动缓存频繁访问的数据（玩家、背包、NPC）
- **连接池**：高效的数据库连接管理
- **索引查询**：优化的数据库索引以实现快速查找
- **批量操作**：支持原子多步操作的事务

### 监控与健康
- **健康检查**：数据库、内存和缓存健康监控
- **日志系统**：使用 Pino 的结构化日志
- **缓存统计**：命中率、大小和性能指标
- **错误处理**：带详细上下文的自定义错误类

### 类型安全
- **TypeScript**：完整的类型覆盖
- **Zod 验证**：运行时架构验证
- **类型守卫**：安全的类型收窄
- **严格模式**：启用以获得最大安全性

## 🧪 开发

```bash
# 开发模式（自动重载）
npm run dev

# 构建
npm run build

# 运行测试
npm test

# 带 UI 的测试
npm run test:ui

# 测试覆盖率
npm run test:coverage

# 数据库操作
npm run db:migrate
npm run db:seed
```

## 📝 环境变量

```env
# 数据库配置
DB_HOST=localhost          # 数据库主机
DB_PORT=5432              # 数据库端口
DB_NAME=rpg_game          # 数据库名称
DB_USER=postgres          # 数据库用户
DB_PASSWORD=your_password # 数据库密码

# 可选配置
LOG_LEVEL=info            # 日志级别（debug、info、warn、error）
CACHE_ENABLED=true        # 启用/禁用缓存
```

## 🤝 贡献

欢迎贡献！请随时提交 Pull Request。

## 📄 许可证

MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 🔗 链接

- [NPM 包](https://www.npmjs.com/package/@qianjue/rpg-mcp-server)
- [GitHub 仓库](https://github.com/QianJue-CN/RPGMCP)
- [问题追踪](https://github.com/QianJue-CN/RPGMCP/issues)
- [模型上下文协议](https://modelcontextprotocol.io/)

## 📧 支持

如有问题和支持需求，请在 [GitHub](https://github.com/QianJue-CN/RPGMCP/issues) 上提交 issue。

