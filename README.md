# RPG MCP Server

[![npm version](https://badge.fury.io/js/@qianjue%2Frpg-mcp-server.svg)](https://www.npmjs.com/package/@qianjue/rpg-mcp-server)
[![GitHub](https://img.shields.io/github/license/QianJue-CN/RPGMCP)](https://github.com/QianJue-CN/RPGMCP)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-%3E%3D14-blue)](https://www.postgresql.org/)

[中文文档](./README_ZH.md) | English | [NPM Package](https://www.npmjs.com/package/@qianjue/rpg-mcp-server) | [GitHub](https://github.com/QianJue-CN/RPGMCP)

A complete, production-ready RPG game system MCP server implementation with PostgreSQL database, enabling LLMs to run sophisticated text-based RPG games with reliable data persistence.

## ✨ Features

### Core Capabilities
- 🎮 **50+ MCP Tools**: Comprehensive game system with query, calculation, update, and management tools
- 💾 **PostgreSQL Database**: Enterprise-grade data persistence with ACID transactions
- 🤖 **LLM-Friendly**: Auto database initialization, dynamic content generation, flexible CRUD operations
- ⚡ **High Performance**: LRU caching system, connection pooling, optimized queries with indexes
- 🔒 **Type Safety**: Full TypeScript implementation with Zod validation
- 📊 **Monitoring**: Built-in health checks, logging system, cache statistics

### Game Systems
- ⚔️ **Combat System**: Automated damage calculation, experience rewards, loot generation
- 🎯 **Quest System**: Quest tracking, progress updates, completion rewards
- 🛠️ **Crafting System**: 6 professions, recipe learning, quality tiers, proficiency progression
- 🏆 **Achievement System**: Progress tracking, rewards, statistics, multiple categories
- 🌍 **World System**: Time progression, weather changes, dynamic events
- 💼 **Inventory & Equipment**: Item management, quality system, equipment bonuses
- 👥 **NPC & Faction System**: Relationship tracking, reputation, companions
- 💾 **Save System**: Complete game state snapshots, multiple save slots

## 📦 Installation

### Option 1: NPM Global Install (Recommended)

```bash
npm install -g @qianjue/rpg-mcp-server
rpg-mcp-server
```

### Option 2: NPX (No Installation)

```bash
npx @qianjue/rpg-mcp-server
```

### Option 3: Build from Source

```bash
git clone https://github.com/QianJue-CN/RPGMCP.git
cd RPGMCP
npm install
npm run build
npm start
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.0.0 or higher
- **PostgreSQL** 14 or higher

### 1. Database Setup

Create a PostgreSQL database:

```bash
createdb rpg_game
```

### 2. Configuration

Create a `.env` file (or configure via Claude Desktop):

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rpg_game
DB_USER=postgres
DB_PASSWORD=your_password
```

### 3. Database Initialization

**Method A: Auto-initialization via LLM (Recommended)**

Start the server and let the LLM initialize the database:

```bash
npm start
```

Then ask Claude:
```
Check database status and initialize if needed
```

**Method B: Manual initialization**

```bash
npm run build
npm run db:migrate
npm run db:seed  # Optional: load sample data
```

## 🔧 Claude Desktop Configuration

### Config File Location

- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

### Using NPX (Recommended)

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

### Using Absolute Path

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

**Note**: Restart Claude Desktop after configuration changes.

## 🛠️ Tool Categories

### 🔐 Admin Tools (3)
- `get_database_status` - Check database initialization status
- `initialize_database` - Initialize database schema and seed data
- `reset_database` - Reset database (dangerous operation)

### 📊 Query Tools (10)
- `get_player_status` - Get complete player status
- `get_inventory` - Get inventory items
- `get_equipment` - Get equipped items
- `get_active_quests` - Get active quests
- `get_skills` - Get player skills
- `get_faction_standings` - Get faction reputation
- `get_companions` - Get companion list
- `get_npc_info` - Get NPC information
- `get_npc_relations` - Get NPC relationships
- `get_world_state` - Get world state

### 🧮 Calculation Tools (5)
- `calculate_damage` - Calculate combat damage
- `calculate_exp_reward` - Calculate experience rewards
- `calculate_loot_drops` - Calculate loot drops
- `calculate_craft_result` - Calculate crafting results
- `calculate_reputation_change` - Calculate reputation changes

### ✏️ Update Tools (10)
- `apply_damage` - Apply damage to target
- `heal_target` - Heal target
- `add_experience` - Add experience (auto level-up)
- `modify_inventory` - Modify inventory items
- `equip_item` - Equip/unequip items
- `accept_quest` - Accept quest
- `update_quest_progress` - Update quest progress
- `complete_quest` - Complete quest
- `update_reputation` - Update faction reputation
- `update_npc_relation` - Update NPC relationship

### 🌍 World & Save Tools (4)
- `save_game` - Save game state
- `load_game` - Load saved game
- `list_saves` - List all saves
- `advance_time` - Advance game time

### 🛠️ Crafting Tools (5)
- `get_crafting_proficiency` - Get crafting proficiency
- `get_learned_recipes` - Get learned recipes
- `learn_recipe` - Learn new recipe
- `craft_item` - Craft item from recipe
- `create_or_get_recipe` - Create/get recipe (LLM dynamic generation)

### 🏆 Achievement Tools (4)
- `get_player_achievements` - Get achievement progress
- `update_achievement_progress` - Update achievement progress
- `update_player_statistics` - Update player statistics
- `create_or_get_achievement` - Create/get achievement (LLM dynamic generation)

### 👤 Entity Creation Tools (6)
- `create_player` - Create new player character
- `create_npc` - Create new NPC
- `create_faction` - Create new faction
- `delete_player` - Delete player
- `delete_npc` - Delete NPC
- `delete_faction` - Delete faction

### 💾 Database CRUD Tools (7)
- `db_query` - Execute SELECT queries
- `db_insert` - Insert data into tables
- `db_update` - Update table data
- `db_delete` - Delete table data
- `db_get_table_schema` - Get table structure
- `db_list_tables` - List all tables
- `db_transaction` - Execute transactions

## 📁 Project Structure

```
rpg-mcp-server/
├── src/
│   ├── index.ts              # MCP server entry point
│   ├── types.ts              # TypeScript type definitions
│   ├── cache/
│   │   ├── GameCache.ts      # LRU cache implementation
│   │   └── index.ts          # Cache exports
│   ├── database/
│   │   ├── connection.ts     # Database connection pool
│   │   ├── migrate.ts        # Migration script
│   │   └── seed.ts           # Seed data script
│   ├── tools/
│   │   ├── admin.ts          # Admin tools (DB init)
│   │   ├── query.ts          # Query tools
│   │   ├── calculate.ts      # Calculation tools
│   │   ├── update.ts         # Update tools
│   │   ├── world.ts          # World & save tools
│   │   ├── crafting.ts       # Crafting system tools
│   │   ├── achievement.ts    # Achievement system tools
│   │   ├── entity.ts         # Entity creation tools
│   │   └── database.ts       # Generic CRUD tools
│   ├── validators/
│   │   ├── player.ts         # Player validation
│   │   ├── item.ts           # Item validation
│   │   └── index.ts          # Validator exports
│   ├── health/
│   │   └── index.ts          # Health check system
│   ├── errors/
│   │   └── GameError.ts      # Custom error classes
│   └── utils/
│       ├── formulas.ts       # Game formulas
│       ├── constants.ts      # Game constants
│       └── logger.ts         # Logging system
├── database/
│   ├── schema.sql            # Database schema
│   ├── seed.sql              # Seed data
│   ├── add_indexes.sql       # Performance indexes
│   ├── add_constraints.sql   # Data constraints
│   └── optimizations.sql     # Query optimizations
├── prompts/
│   └── system_prompt_example.xml  # System prompt examples
└── package.json
```

## 🎮 Usage Examples

### Combat Scenario

```
User: I attack the goblin with a fireball spell

Claude will automatically:
1. Call get_player_status() to get your stats
2. Call calculate_damage() to compute damage
3. Call apply_damage() to apply damage to goblin
4. Call calculate_loot_drops() if goblin dies
5. Call add_experience() to grant XP
6. Generate vivid combat narrative
```

### Crafting Scenario

```
User: I want to craft an iron sword

Claude will:
1. Call get_learned_recipes() to check if you know the recipe
2. Call get_inventory() to verify materials
3. Call craft_item() to perform crafting
4. Update proficiency automatically
5. Describe the crafting process and result
```

### Quest Scenario

```
User: I accept the merchant escort quest

Claude will:
1. Call accept_quest() to accept the quest
2. Describe quest details and objectives

User: I completed the escort

Claude will:
1. Call complete_quest() to complete quest
2. Automatically grant rewards (XP, gold, items)
3. Check for level-up
```

## 🔍 Advanced Features

### Performance Optimization
- **LRU Caching**: Automatic caching of frequently accessed data (players, inventory, NPCs)
- **Connection Pooling**: Efficient database connection management
- **Indexed Queries**: Optimized database indexes for fast lookups
- **Batch Operations**: Transaction support for atomic multi-step operations

### Monitoring & Health
- **Health Checks**: Database, memory, and cache health monitoring
- **Logging System**: Structured logging with Pino
- **Cache Statistics**: Hit rate, size, and performance metrics
- **Error Handling**: Custom error classes with detailed context

### Type Safety
- **TypeScript**: Full type coverage
- **Zod Validation**: Runtime schema validation
- **Type Guards**: Safe type narrowing
- **Strict Mode**: Enabled for maximum safety

## 🧪 Development

```bash
# Development mode (auto-reload)
npm run dev

# Build
npm run build

# Run tests
npm test

# Test with UI
npm run test:ui

# Test coverage
npm run test:coverage

# Database operations
npm run db:migrate
npm run db:seed
```

## 📝 Environment Variables

```env
# Database Configuration
DB_HOST=localhost          # Database host
DB_PORT=5432              # Database port
DB_NAME=rpg_game          # Database name
DB_USER=postgres          # Database user
DB_PASSWORD=your_password # Database password

# Optional Configuration
LOG_LEVEL=info            # Logging level (debug, info, warn, error)
CACHE_ENABLED=true        # Enable/disable caching
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🔗 Links

- [NPM Package](https://www.npmjs.com/package/@qianjue/rpg-mcp-server)
- [GitHub Repository](https://github.com/QianJue-CN/RPGMCP)
- [Issue Tracker](https://github.com/QianJue-CN/RPGMCP/issues)
- [Model Context Protocol](https://modelcontextprotocol.io/)

## 📧 Support

For questions and support, please open an issue on [GitHub](https://github.com/QianJue-CN/RPGMCP/issues).
