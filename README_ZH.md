# RPG MCP 服务器

[English](./README.md) | 中文文档

基于 Node.js 和 PostgreSQL 的完整 RPG 游戏系统 MCP 服务器实现。

## 功能特性

- ✅ **32 个 MCP 工具**：完整的游戏系统支持
- ✅ **PostgreSQL 数据库**：可靠的数据持久化
- ✅ **自动游戏逻辑**：战斗计算、经验系统、制作系统
- ✅ **完整存档系统**：数据库快照，100% 可靠
- ✅ **世界演化**：时间推进、天气变化、事件系统
- ✅ **自动数据库初始化**：LLM 可通过 MCP 工具初始化数据库

## 工具分类

### 🔧 管理员工具 (3个) - 新增！

**重要**：这些工具允许 LLM 自动初始化数据库，无需手动运行迁移脚本！

- `get_database_status` - 检查数据库初始化状态
- `initialize_database` - 初始化数据库（创建表、加载种子数据）
- `reset_database` - 重置数据库（危险操作）

### 📊 状态查询类 (10个)

- `get_player_status` - 获取玩家完整状态
- `get_inventory` - 获取背包物品
- `get_active_quests` - 获取进行中的任务
- `get_faction_standings` - 获取阵营声望
- `get_companions` - 获取同伴列表
- `get_npc_info` - 获取NPC信息
- `get_world_state` - 获取世界状态
- `get_equipment` - 获取装备信息
- `get_skills` - 获取技能列表
- `get_npc_relations` - 获取NPC关系

### 🧮 数值计算类 (5个)

- `calculate_damage` - 计算战斗伤害
- `calculate_exp_reward` - 计算经验奖励
- `calculate_loot_drops` - 计算掉落物品
- `calculate_craft_result` - 计算制作结果
- `calculate_reputation_change` - 计算声望变化

### ✏️ 状态更新类 (10个)

- `apply_damage` - 应用伤害
- `heal_target` - 治疗目标
- `add_experience` - 添加经验（自动升级）
- `modify_inventory` - 修改背包物品
- `equip_item` - 装备/卸下物品
- `accept_quest` - 接受任务
- `update_quest_progress` - 更新任务进度
- `complete_quest` - 完成任务
- `update_reputation` - 更新声望
- `update_npc_relation` - 更新NPC关系

### 🌍 存档与世界类 (4个)

- `save_game` - 保存游戏
- `load_game` - 加载存档
- `list_saves` - 列出存档
- `advance_time` - 推进时间

## 快速开始

### 前置要求

- Node.js 18+
- PostgreSQL 14+

### 1. 安装依赖

```bash
npm install
```

### 2. 配置数据库

创建 `.env` 文件：

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rpg_game
DB_USER=postgres
DB_PASSWORD=your_password
```

### 3. 初始化数据库

**方式 A: 通过 MCP 工具（推荐）**

直接启动服务器，让 LLM 自动初始化数据库：

```bash
npm run build
npm start
```

然后在 Claude Desktop 中询问：
```
检查数据库状态，如果需要请初始化
```

LLM 会自动调用 `get_database_status` 和 `initialize_database` 工具！

**方式 B: 手动初始化（传统方式）**

```bash
# 创建数据库
createdb rpg_game

# 运行迁移
npm run build
npm run db:migrate

# 插入种子数据（可选）
npm run db:seed
```

### 4. 启动服务器

**方式 A: 使用 npm（推荐）**

```bash
npm start
```

**方式 B: 使用 npx**

```bash
npx rpg-mcp-server
```

**方式 C: 直接运行**

```bash
node dist/index.js
```

## Claude Desktop 配置

配置文件位置：
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS/Linux**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "rpg-game": {
      "command": "node",
      "args": ["D:\\RPGMCP\\dist\\index.js"],
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

**使用 npx 启动（推荐）**：

```json
{
  "mcpServers": {
    "rpg-game": {
      "command": "npx",
      "args": ["rpg-mcp-server"],
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

**注意**：
- Windows 路径使用双反斜杠 `\\`
- 使用绝对路径时路径必须完整
- 使用 npx 方式更简洁，无需指定完整路径
- 重启 Claude Desktop 使配置生效

## 项目结构

```
rpg-mcp-server/
├── src/
│   ├── index.ts              # MCP 服务器入口
│   ├── types.ts              # TypeScript 类型定义
│   ├── database/
│   │   ├── connection.ts     # 数据库连接池
│   │   ├── migrate.ts        # 迁移脚本
│   │   └── seed.ts           # 种子数据脚本
│   ├── tools/
│   │   ├── admin.ts          # 管理员工具（数据库初始化）
│   │   ├── query.ts          # 查询工具
│   │   ├── calculate.ts      # 计算工具
│   │   ├── update.ts         # 更新工具
│   │   └── world.ts          # 世界与存档工具
│   └── utils/
│       ├── formulas.ts       # 游戏公式
│       └── constants.ts      # 游戏常量
├── database/
│   ├── schema.sql            # 数据库结构
│   └── seed.sql              # 种子数据
└── prompts/
    └── system_prompt_example.xml  # 系统提示词示例
```

## 开发

```bash
# 开发模式（自动重载）
npm run dev

# 编译
npm run build

# 运行测试
node test-game-flow.js
```

## 游戏示例

### 战斗场景

```
用户: 我用火球术攻击哥布林

Claude 会自动:
1. 调用 get_player_status() 获取你的状态
2. 调用 calculate_damage() 计算伤害
3. 调用 apply_damage() 应用伤害
4. 调用 calculate_loot_drops() 计算掉落
5. 调用 add_experience() 添加经验
6. 生成生动的战斗描写
```

### 任务系统

```
用户: 我接受护送商队的任务

Claude 会:
1. 调用 accept_quest() 接受任务
2. 描述任务详情

用户: 我完成了护送任务

Claude 会:
1. 调用 complete_quest() 完成任务
2. 自动发放经验、金币等奖励
3. 检查是否升级
```

## 许可证

MIT

