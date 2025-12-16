/**
 * 健康检查和监控系统
 */
import pool from '../database/connection.js';
import { gameCache } from '../cache/index.js';
import { logger, log } from '../utils/logger.js';

/**
 * 健康状态枚举
 */
export enum HealthStatus {
    HEALTHY = 'healthy',
    DEGRADED = 'degraded',
    UNHEALTHY = 'unhealthy',
}

/**
 * 组件健康检查结果
 */
export interface ComponentHealth {
    status: HealthStatus;
    message?: string;
    latency?: number;
    details?: any;
}

/**
 * 完整健康检查结果
 */
export interface HealthCheckResult {
    status: HealthStatus;
    timestamp: string;
    uptime: number;
    checks: {
        database: ComponentHealth;
        memory: ComponentHealth;
        cache: ComponentHealth;
    };
}

/**
 * 检查数据库健康状态
 */
async function checkDatabase(): Promise<ComponentHealth> {
    const startTime = Date.now();

    try {
        // 执行简单查询测试连接
        await pool.query('SELECT 1');

        const latency = Date.now() - startTime;

        // 获取连接池状态
        const poolStats = {
            totalCount: pool.totalCount,
            idleCount: pool.idleCount,
            waitingCount: pool.waitingCount,
        };

        // 判断健康状态
        let status = HealthStatus.HEALTHY;
        let message = '数据库连接正常';

        if (latency > 1000) {
            status = HealthStatus.DEGRADED;
            message = '数据库响应较慢';
        }

        if (pool.waitingCount > 5) {
            status = HealthStatus.DEGRADED;
            message = '数据库连接池压力较大';
        }

        return {
            status,
            message,
            latency,
            details: poolStats,
        };
    } catch (error) {
        log.error(error as Error, { component: 'health_check', check: 'database' });
        return {
            status: HealthStatus.UNHEALTHY,
            message: `数据库连接失败: ${(error as Error).message}`,
            latency: Date.now() - startTime,
        };
    }
}

/**
 * 检查内存使用情况
 */
function checkMemory(): ComponentHealth {
    const usage = process.memoryUsage();
    const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
    const rssMB = Math.round(usage.rss / 1024 / 1024);

    const heapUsagePercent = (usage.heapUsed / usage.heapTotal) * 100;

    let status = HealthStatus.HEALTHY;
    let message = '内存使用正常';

    if (heapUsagePercent > 80) {
        status = HealthStatus.DEGRADED;
        message = '内存使用率较高';
    }

    if (heapUsagePercent > 90) {
        status = HealthStatus.UNHEALTHY;
        message = '内存使用率过高';
    }

    return {
        status,
        message,
        details: {
            heapUsed: `${heapUsedMB}MB`,
            heapTotal: `${heapTotalMB}MB`,
            rss: `${rssMB}MB`,
            external: `${Math.round(usage.external / 1024 / 1024)}MB`,
            heapUsagePercent: `${heapUsagePercent.toFixed(2)}%`,
        },
    };
}

/**
 * 检查缓存健康状态
 */
function checkCache(): ComponentHealth {
    try {
        const stats = gameCache.getStats();
        const sizeInfo = gameCache.getSize();

        const hitRate = parseFloat(stats.hitRate);

        let status = HealthStatus.HEALTHY;
        let message = '缓存运行正常';

        if (hitRate < 50 && stats.total > 100) {
            status = HealthStatus.DEGRADED;
            message = '缓存命中率较低';
        }

        return {
            status,
            message,
            details: {
                hitRate: stats.hitRate,
                hits: stats.hits,
                misses: stats.misses,
                total: stats.total,
                size: sizeInfo,
            },
        };
    } catch (error) {
        log.error(error as Error, { component: 'health_check', check: 'cache' });
        return {
            status: HealthStatus.DEGRADED,
            message: '缓存状态检查失败',
        };
    }
}

/**
 * 执行完整健康检查
 */
export async function performHealthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    // 并行执行所有检查
    const [databaseHealth, memoryHealth, cacheHealth] = await Promise.all([
        checkDatabase(),
        Promise.resolve(checkMemory()),
        Promise.resolve(checkCache()),
    ]);

    // 确定整体健康状态
    let overallStatus = HealthStatus.HEALTHY;

    if (
        databaseHealth.status === HealthStatus.UNHEALTHY ||
        memoryHealth.status === HealthStatus.UNHEALTHY ||
        cacheHealth.status === HealthStatus.UNHEALTHY
    ) {
        overallStatus = HealthStatus.UNHEALTHY;
    } else if (
        databaseHealth.status === HealthStatus.DEGRADED ||
        memoryHealth.status === HealthStatus.DEGRADED ||
        cacheHealth.status === HealthStatus.DEGRADED
    ) {
        overallStatus = HealthStatus.DEGRADED;
    }

    const result: HealthCheckResult = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        checks: {
            database: databaseHealth,
            memory: memoryHealth,
            cache: cacheHealth,
        },
    };

    // 记录健康检查结果
    const duration = Date.now() - startTime;
    logger.debug(
        {
            type: 'health_check',
            duration,
            result,
        },
        `健康检查完成: ${overallStatus} (${duration}ms)`
    );

    return result;
}

/**
 * 获取系统指标
 */
export function getSystemMetrics() {
    const usage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
        process: {
            pid: process.pid,
            uptime: process.uptime(),
            version: process.version,
            platform: process.platform,
            arch: process.arch,
        },
        memory: {
            heapUsed: usage.heapUsed,
            heapTotal: usage.heapTotal,
            rss: usage.rss,
            external: usage.external,
            arrayBuffers: usage.arrayBuffers,
        },
        cpu: {
            user: cpuUsage.user,
            system: cpuUsage.system,
        },
        database: {
            totalCount: pool.totalCount,
            idleCount: pool.idleCount,
            waitingCount: pool.waitingCount,
        },
        cache: gameCache.getStats(),
    };
}

/**
 * 监控类 - 定期执行健康检查
 */
export class HealthMonitor {
    private interval: NodeJS.Timeout | null = null;
    private checkIntervalMs: number;
    private lastCheck: HealthCheckResult | null = null;

    constructor(checkIntervalMs: number = 60000) {
        this.checkIntervalMs = checkIntervalMs;
    }

    /**
     * 启动监控
     */
    start(): void {
        if (this.interval) {
            logger.warn('健康监控已经在运行');
            return;
        }

        logger.info(`启动健康监控,检查间隔: ${this.checkIntervalMs}ms`);

        // 立即执行一次检查
        this.performCheck();

        // 设置定期检查
        this.interval = setInterval(() => {
            this.performCheck();
        }, this.checkIntervalMs);
    }

    /**
     * 停止监控
     */
    stop(): void {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
            logger.info('健康监控已停止');
        }
    }

    /**
     * 执行检查
     */
    private async performCheck(): Promise<void> {
        try {
            this.lastCheck = await performHealthCheck();

            // 如果状态不健康,记录警告
            if (this.lastCheck.status === HealthStatus.UNHEALTHY) {
                logger.warn(
                    { healthCheck: this.lastCheck },
                    '系统健康状态: UNHEALTHY'
                );
            } else if (this.lastCheck.status === HealthStatus.DEGRADED) {
                logger.warn(
                    { healthCheck: this.lastCheck },
                    '系统健康状态: DEGRADED'
                );
            }
        } catch (error) {
            log.error(error as Error, { component: 'health_monitor' });
        }
    }

    /**
     * 获取最后一次检查结果
     */
    getLastCheck(): HealthCheckResult | null {
        return this.lastCheck;
    }
}

/**
 * 全局健康监控实例
 */
export const healthMonitor = new HealthMonitor();