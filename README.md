# RPG MCP Server

[中文文档](./README_ZH.md) | English

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

```bash
npm install
npm run build
npm start
```

Or use npx to run directly:

```bash
npx rpg-mcp-server
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
