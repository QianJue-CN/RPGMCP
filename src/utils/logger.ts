/**
 * 结构化日志系统
 * 使用 Pino 提供高性能的结构化日志
 */
import pino from 'pino';

/**
 * 日志级别
 */
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * 创建日志记录器
 */
function createLogger() {
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const logLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

    return pino({
        level: logLevel,
        transport: isDevelopment
            ? {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'SYS:standard',
                    ignore: 'pid,hostname',
                    singleLine: false,
                },
            }
            : undefined,
        formatters: {
            level: (label: string) => {
                return { level: label };
            },
        },
        timestamp: pino.stdTimeFunctions.isoTime,
    });
}

/**
 * 全局日志记录器实例
 */
export const logger = createLogger();

/**
 * 创建子日志记录器
 */
export function createChildLogger(bindings: Record<string, any>) {
    return logger.child(bindings);
}

/**
 * 日志辅助函数
 */
export const log = {
    /**
     * 记录玩家操作
     */
    playerAction(
        playerId: number,
        playerName: string,
        action: string,
        details?: any
    ) {
        logger.info(
            {
                type: 'player_action',
                player_id: playerId,
                player_name: playerName,
                action,
                ...details,
            },
            `玩家操作: ${playerName} - ${action}`
        );
    },

    /**
     * 记录战斗事件
     */
    combat(
        attackerId: number,
        targetId: number,
        damage: number,
        details?: any
    ) {
        logger.info(
            {
                type: 'combat',
                attacker_id: attackerId,
                target_id: targetId,
                damage,
                ...details,
            },
            `战斗: 攻击者${attackerId} -> 目标${targetId}, 伤害${damage}`
        );
    },

    /**
     * 记录物品操作
     */
    item(
        playerId: number,
        action: 'add' | 'remove' | 'equip' | 'unequip',
        itemId: string,
        quantity?: number
    ) {
        logger.info(
            {
                type: 'item',
                player_id: playerId,
                action,
                item_id: itemId,
                quantity,
            },
            `物品操作: 玩家${playerId} ${action} ${itemId}${quantity ? ` x${quantity}` : ''}`
        );
    },

    /**
     * 记录任务事件
     */
    quest(
        playerId: number,
        questId: string,
        action: 'accept' | 'progress' | 'complete' | 'fail',
        details?: any
    ) {
        logger.info(
            {
                type: 'quest',
                player_id: playerId,
                quest_id: questId,
                action,
                ...details,
            },
            `任务: 玩家${playerId} ${action} ${questId}`
        );
    },

    /**
     * 记录制作事件
     */
    crafting(
        playerId: number,
        recipeId: string,
        success: boolean,
        details?: any
    ) {
        logger.info(
            {
                type: 'crafting',
                player_id: playerId,
                recipe_id: recipeId,
                success,
                ...details,
            },
            `制作: 玩家${playerId} ${success ? '成功' : '失败'} 制作 ${recipeId}`
        );
    },

    /**
     * 记录等级提升
     */
    levelUp(playerId: number, playerName: string, newLevel: number) {
        logger.info(
            {
                type: 'level_up',
                player_id: playerId,
                player_name: playerName,
                new_level: newLevel,
            },
            `升级: ${playerName} 达到等级 ${newLevel}`
        );
    },

    /**
     * 记录成就解锁
     */
    achievement(
        playerId: number,
        playerName: string,
        achievementId: string,
        achievementName: string
    ) {
        logger.info(
            {
                type: 'achievement',
                player_id: playerId,
                player_name: playerName,
                achievement_id: achievementId,
                achievement_name: achievementName,
            },
            `成就: ${playerName} 解锁 ${achievementName}`
        );
    },

    /**
     * 记录数据库操作
     */
    database(operation: string, table: string, duration?: number, error?: any) {
        if (error) {
            logger.error(
                {
                    type: 'database',
                    operation,
                    table,
                    duration,
                    error: error.message,
                    stack: error.stack,
                },
                `数据库错误: ${operation} ${table}`
            );
        } else {
            logger.debug(
                {
                    type: 'database',
                    operation,
                    table,
                    duration,
                },
                `数据库操作: ${operation} ${table}${duration ? ` (${duration}ms)` : ''}`
            );
        }
    },

    /**
     * 记录缓存操作
     */
    cache(
        operation: 'hit' | 'miss' | 'set' | 'delete',
        cacheType: string,
        key: string | number
    ) {
        logger.debug(
            {
                type: 'cache',
                operation,
                cache_type: cacheType,
                key,
            },
            `缓存: ${operation} ${cacheType}[${key}]`
        );
    },

    /**
     * 记录性能指标
     */
    performance(operation: string, duration: number, metadata?: any) {
        logger.info(
            {
                type: 'performance',
                operation,
                duration,
                ...metadata,
            },
            `性能: ${operation} 耗时 ${duration}ms`
        );
    },

    /**
     * 记录错误
     */
    error(error: Error, context?: any) {
        logger.error(
            {
                type: 'error',
                error: error.message,
                stack: error.stack,
                ...context,
            },
            `错误: ${error.message}`
        );
    },

    /**
     * 记录警告
     */
    warn(message: string, context?: any) {
        logger.warn(
            {
                type: 'warning',
                ...context,
            },
            message
        );
    },

    /**
     * 记录调试信息
     */
    debug(message: string, context?: any) {
        logger.debug(
            {
                type: 'debug',
                ...context,
            },
            message
        );
    },
};

/**
 * 性能计时器
 */
export class PerformanceTimer {
    private startTime: number;
    private operation: string;

    constructor(operation: string) {
        this.operation = operation;
        this.startTime = Date.now();
    }

    /**
     * 结束计时并记录
     */
    end(metadata?: any) {
        const duration = Date.now() - this.startTime;
        log.performance(this.operation, duration, metadata);
        return duration;
    }

    /**
     * 获取当前耗时
     */
    getDuration(): number {
        return Date.now() - this.startTime;
    }
}

/**
 * 创建性能计时器
 */
export function startTimer(operation: string): PerformanceTimer {
    return new PerformanceTimer(operation);
}

/**
 * 装饰器:自动记录函数执行时间
 */
export function logPerformance(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
        const timer = startTimer(`${target.constructor.name}.${propertyKey}`);
        try {
            const result = await originalMethod.apply(this, args);
            timer.end({ success: true });
            return result;
        } catch (error) {
            timer.end({ success: false, error: (error as Error).message });
            throw error;
        }
    };

    return descriptor;
}

/**
 * 导出默认日志记录器
 */
export default logger;