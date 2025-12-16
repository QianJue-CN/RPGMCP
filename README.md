# RPG MCP Server

[![npm version](https://badge.fury.io/js/@qianjue%2Frpg-mcp-server.svg)](https://www.npmjs.com/package/@qianjue/rpg-mcp-server)
[![GitHub](https://img.shields.io/github/license/QianJue-CN/RPGMCP)](https://github.com/QianJue-CN/RPGMCP)

[中文文档](./README_ZH.md) | English | [NPM Package](https://www.npmjs.com/package/@qianjue/rpg-mcp-server) | [GitHub](https://github.com/QianJue-CN/RPGMCP)

A complete RPG game system MCP server implementation based on Node.js and PostgreSQL.

## Features

- ✅ **32 MCP Tools**: Complete game system support
- ✅ **PostgreSQL Database**: Reliable data persistence  
- ✅ **Automated Game Logic**: Combat calculation, experience system, crafting system
- ✅ **Complete Save System**: Database snapshots, 100%% reliable
- ✅ **World Evolution**: Time progression, weather changes, event system
- ✅ **Auto Database Init**: LLM can initialize database via MCP tools

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+

### Install & Run

**Install from npm**:

```bash
npm install -g @qianjue/rpg-mcp-server
rpg-mcp-server
```

**Or use npx to run directly**:

```bash
npx @qianjue/rpg-mcp-server
```

**Or clone and build from source**:

```bash
git clone https://github.com/QianJue-CN/RPGMCP.git
cd RPGMCP
npm install
npm run build
npm start
```

See [README_ZH.md](./README_ZH.md) for detailed documentation.

## Claude Desktop Configuration

Config file location:
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS/Linux**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Using npx (Recommended)**:

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

**Using absolute path**:

```json
{
  "mcpServers": {
    "rpg-game": {
      "command": "node",
      "args": ["/absolute/path/to/rpg-mcp-server/dist/index.js"],
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

Restart Claude Desktop to apply configuration.

## License

MIT
