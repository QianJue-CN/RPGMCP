/**
 * 配置管理系统
 * 集中管理所有游戏配置和环境变量
 */
import { z } from 'zod';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

/**
 * 数据库配置模式
 */
const DatabaseConfigSchema = z.object({
    host: z.string().default('localhost'),
    port: z.number().int().min(1).max(65535).default(5432),
    database: z.string().min(1),
    user: z.string().min(1),
    password: z.string().min(1),
    maxConnections: z.number().int().min(1).max(100).default(20),
    idleTimeoutMillis: z.number().int().min(1000).default(30000),
    connectionTimeoutMillis: z.number().int().min(1000).default(5000),
});

/**
 * 游戏配置模式
 */
const GameConfigSchema = z.object({
    // 等级系统
    leveling: z.object({
        maxLevel: z.number().int().min(1).max(1000).default(100),
        expCurve: z.enum(['linear', 'exponential']).default('exponential'),
        baseExpPerLevel: z.number().int().min(1).default(100),
        expMultiplier: z.number().min(1).default(1.5),
    }),

    // 战斗系统
    combat: z.object({
        baseCritRate: z.number().min(0).max(1).default(0.05),
        maxCritRate: z.number().min(0).max(1).default(0.75),
        critMultiplier: z.number().min(1).default(2.0),
        dodgeRate: z.number().min(0).max(1).default(0.1),
        blockRate: z.number().min(0).max(1).default(0.15),
    }),

    // 制作系统
    crafting: z.object({
        minSuccessRate: z.number().min(0).max(1).default(0.1),
        maxSuccessRate: z.number().min(0).max(1).default(0.95),
        skillImpactFactor: z.number().min(0).default(0.01),
        qualityBonusRate: z.number().min(0).default(0.05),
    }),

    // 经济系统
    economy: z.object({
        startingGold: z.number().int().min(0).default(100),
        maxGold: z.number().int().min(1).default(999999999),
        vendorSellMultiplier: z.number().min(0).max(1).default(0.5),
        repairCostMultiplier: z.number().min(0).default(0.1),
    }),

    // 背包系统
    inventory: z.object({
        defaultSlots: z.number().int().min(1).default(20),
        maxSlots: z.number().int().min(1).default(100),
        stackSize: z.number().int().min(1).default(99),
    }),
});

/**
 * 缓存配置模式
 */
const CacheConfigSchema = z.object({
    enabled: z.boolean().default(true),
    player: z.object({
        maxSize: z.number().int().min(1).default(500),
        ttl: z.number().int().min(1000).default(300000), // 5分钟
    }),
    inventory: z.object({
        maxSize: z.number().int().min(1).default(200),
        ttl: z.number().int().min(1000).default(180000), // 3分钟
    }),
    equipment: z.object({
        maxSize: z.number().int().min(1).default(200),
        ttl: z.number().int().min(1000).default(180000), // 3分钟
    }),
});

/**
 * 日志配置模式
 */
const LogConfigSchema = z.object({
    level: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
    pretty: z.boolean().default(true),
    file: z.object({
        enabled: z.boolean().default(false),
        path: z.string().default('./logs/rpg-mcp.log'),
        maxSize: z.string().default('10M'),
        maxFiles: z.number().int().min(1).default(5),
    }),
});

/**
 * 服务器配置模式
 */
const ServerConfigSchema = z.object({
    name: z.string().default('RPG MCP Server'),
    version: z.string().default('1.3.0'),
    environment: z.enum(['development', 'production', 'test']).default('development'),
});

/**
 * 完整配置模式
 */
const ConfigSchema = z.object({
    server: ServerConfigSchema,
    database: DatabaseConfigSchema,
    game: GameConfigSchema,
    cache: CacheConfigSchema,
    log: LogConfigSchema,
});

/**
 * 配置类型
 */
export type Config = z.infer<typeof ConfigSchema>;
export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>;
export type GameConfig = z.infer<typeof GameConfigSchema>;
export type CacheConfig = z.infer<typeof CacheConfigSchema>;
export type LogConfig = z.infer<typeof LogConfigSchema>;
export type ServerConfig = z.infer<typeof ServerConfigSchema>;

/**
 * 从环境变量加载配置
 */
function loadConfigFromEnv(): Config {
    return {
        server: {
            name: process.env.SERVER_NAME || 'RPG MCP Server',
            version: process.env.SERVER_VERSION || '1.3.0',
            environment: (process.env.NODE_ENV as any) || 'development',
        },
        database: {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            database: process.env.DB_NAME || 'rpg_game',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || '',
            maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
            idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
            connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000'),
        },
        game: {
            leveling: {
                maxLevel: parseInt(process.env.GAME_MAX_LEVEL || '100'),
                expCurve: (process.env.GAME_EXP_CURVE as any) || 'exponential',
                baseExpPerLevel: parseInt(process.env.GAME_BASE_EXP || '100'),
                expMultiplier: parseFloat(process.env.GAME_EXP_MULTIPLIER || '1.5'),
            },
            combat: {
                baseCritRate: parseFloat(process.env.COMBAT_BASE_CRIT_RATE || '0.05'),
                maxCritRate: parseFloat(process.env.COMBAT_MAX_CRIT_RATE || '0.75'),
                critMultiplier: parseFloat(process.env.COMBAT_CRIT_MULTIPLIER || '2.0'),
                dodgeRate: parseFloat(process.env.COMBAT_DODGE_RATE || '0.1'),
                blockRate: parseFloat(process.env.COMBAT_BLOCK_RATE || '0.15'),
            },
            crafting: {
                minSuccessRate: parseFloat(process.env.CRAFTING_MIN_SUCCESS || '0.1'),
                maxSuccessRate: parseFloat(process.env.CRAFTING_MAX_SUCCESS || '0.95'),
                skillImpactFactor: parseFloat(process.env.CRAFTING_SKILL_IMPACT || '0.01'),
                qualityBonusRate: parseFloat(process.env.CRAFTING_QUALITY_BONUS || '0.05'),
            },
            economy: {
                startingGold: parseInt(process.env.ECONOMY_STARTING_GOLD || '100'),
                maxGold: parseInt(process.env.ECONOMY_MAX_GOLD || '999999999'),
                vendorSellMultiplier: parseFloat(process.env.ECONOMY_VENDOR_SELL || '0.5'),
                repairCostMultiplier: parseFloat(process.env.ECONOMY_REPAIR_COST || '0.1'),
            },
            inventory: {
                defaultSlots: parseInt(process.env.INVENTORY_DEFAULT_SLOTS || '20'),
                maxSlots: parseInt(process.env.INVENTORY_MAX_SLOTS || '100'),
                stackSize: parseInt(process.env.INVENTORY_STACK_SIZE || '99'),
            },
        },
        cache: {
            enabled: process.env.CACHE_ENABLED !== 'false',
            player: {
                maxSize: parseInt(process.env.CACHE_PLAYER_MAX_SIZE || '500'),
                ttl: parseInt(process.env.CACHE_PLAYER_TTL || '300000'),
            },
            inventory: {
                maxSize: parseInt(process.env.CACHE_INVENTORY_MAX_SIZE || '200'),
                ttl: parseInt(process.env.CACHE_INVENTORY_TTL || '180000'),
            },
            equipment: {
                maxSize: parseInt(process.env.CACHE_EQUIPMENT_MAX_SIZE || '200'),
                ttl: parseInt(process.env.CACHE_EQUIPMENT_TTL || '180000'),
            },
        },
        log: {
            level: (process.env.LOG_LEVEL as any) || 'info',
            pretty: process.env.LOG_PRETTY !== 'false',
            file: {
                enabled: process.env.LOG_FILE_ENABLED === 'true',
                path: process.env.LOG_FILE_PATH || './logs/rpg-mcp.log',
                maxSize: process.env.LOG_FILE_MAX_SIZE || '10M',
                maxFiles: parseInt(process.env.LOG_FILE_MAX_FILES || '5'),
            },
        },
    };
}

/**
 * 验证并加载配置
 */
function loadConfig(): Config {
    const rawConfig = loadConfigFromEnv();

    try {
        return ConfigSchema.parse(rawConfig);
    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error('配置验证失败:');
            error.issues.forEach((issue) => {
                console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
            });
            throw new Error('配置验证失败,请检查环境变量');
        }
        throw error;
    }
}

/**
 * 全局配置实例
 */
export const config = loadConfig();

/**
 * 获取配置的辅助函数
 */
export function getConfig(): Config {
    return config;
}

export function getDatabaseConfig(): DatabaseConfig {
    return config.database;
}

export function getGameConfig(): GameConfig {
    return config.game;
}

export function getCacheConfig(): CacheConfig {
    return config.cache;
}

export function getLogConfig(): LogConfig {
    return config.log;
}

export function getServerConfig(): ServerConfig {
    return config.server;
}

/**
 * 打印配置信息(隐藏敏感信息)
 */
export function printConfig(): void {
    const safeConfig = {
        ...config,
        database: {
            ...config.database,
            password: '***',
        },
    };

    console.log('=== RPG MCP Server Configuration ===');
    console.log(JSON.stringify(safeConfig, null, 2));
    console.log('====================================');
}

/**
 * 导出默认配置
 */
export default config;