/**
 * 游戏缓存系统
 * 使用 LRU 缓存来提高频繁查询的性能
 */
import { LRUCache } from 'lru-cache';
import type { Player } from '../types.js';

/**
 * 缓存配置接口
 */
export interface CacheConfig {
    maxSize: number;
    ttl: number; // 毫秒
}

/**
 * 默认缓存配置
 */
const DEFAULT_CONFIG: Record<string, CacheConfig> = {
    player: {
        maxSize: 500,
        ttl: 1000 * 60 * 5, // 5分钟
    },
    inventory: {
        maxSize: 200,
        ttl: 1000 * 60 * 3, // 3分钟
    },
    equipment: {
        maxSize: 200,
        ttl: 1000 * 60 * 3, // 3分钟
    },
    quest: {
        maxSize: 100,
        ttl: 1000 * 60 * 2, // 2分钟
    },
    npc: {
        maxSize: 300,
        ttl: 1000 * 60 * 10, // 10分钟 (NPC数据变化较少)
    },
    skill: {
        maxSize: 200,
        ttl: 1000 * 60 * 5, // 5分钟
    },
};

/**
 * 游戏缓存管理器
 */
export class GameCache {
    private playerCache: LRUCache<number, Player>;
    private inventoryCache: LRUCache<number, any[]>;
    private equipmentCache: LRUCache<number, any[]>;
    private questCache: LRUCache<number, any[]>;
    private npcCache: LRUCache<number, any>;
    private skillCache: LRUCache<number, any[]>;

    // 缓存统计
    private stats = {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
    };

    constructor(customConfig?: Partial<Record<string, CacheConfig>>) {
        const config = { ...DEFAULT_CONFIG, ...customConfig } as Record<string, CacheConfig>;

        this.playerCache = new LRUCache<number, Player>({
            max: config.player.maxSize,
            ttl: config.player.ttl,
            updateAgeOnGet: true,
            updateAgeOnHas: false,
        });

        this.inventoryCache = new LRUCache<number, any[]>({
            max: config.inventory.maxSize,
            ttl: config.inventory.ttl,
            updateAgeOnGet: true,
        });

        this.equipmentCache = new LRUCache<number, any[]>({
            max: config.equipment.maxSize,
            ttl: config.equipment.ttl,
            updateAgeOnGet: true,
        });

        this.questCache = new LRUCache<number, any[]>({
            max: config.quest.maxSize,
            ttl: config.quest.ttl,
            updateAgeOnGet: true,
        });

        this.npcCache = new LRUCache<number, any>({
            max: config.npc.maxSize,
            ttl: config.npc.ttl,
            updateAgeOnGet: true,
        });

        this.skillCache = new LRUCache<number, any[]>({
            max: config.skill.maxSize,
            ttl: config.skill.ttl,
            updateAgeOnGet: true,
        });
    }

    // ============ 玩家缓存 ============

    getPlayer(playerId: number): Player | undefined {
        const result = this.playerCache.get(playerId);
        if (result) {
            this.stats.hits++;
        } else {
            this.stats.misses++;
        }
        return result;
    }

    setPlayer(playerId: number, player: Player): void {
        this.playerCache.set(playerId, player);
        this.stats.sets++;
    }

    deletePlayer(playerId: number): void {
        this.playerCache.delete(playerId);
        this.stats.deletes++;
    }

    // ============ 背包缓存 ============

    getInventory(playerId: number): any[] | undefined {
        const result = this.inventoryCache.get(playerId);
        if (result) {
            this.stats.hits++;
        } else {
            this.stats.misses++;
        }
        return result;
    }

    setInventory(playerId: number, items: any[]): void {
        this.inventoryCache.set(playerId, items);
        this.stats.sets++;
    }

    deleteInventory(playerId: number): void {
        this.inventoryCache.delete(playerId);
        this.stats.deletes++;
    }

    // ============ 装备缓存 ============

    getEquipment(playerId: number): any[] | undefined {
        const result = this.equipmentCache.get(playerId);
        if (result) {
            this.stats.hits++;
        } else {
            this.stats.misses++;
        }
        return result;
    }

    setEquipment(playerId: number, equipment: any[]): void {
        this.equipmentCache.set(playerId, equipment);
        this.stats.sets++;
    }

    deleteEquipment(playerId: number): void {
        this.equipmentCache.delete(playerId);
        this.stats.deletes++;
    }

    // ============ 任务缓存 ============

    getQuests(playerId: number): any[] | undefined {
        const result = this.questCache.get(playerId);
        if (result) {
            this.stats.hits++;
        } else {
            this.stats.misses++;
        }
        return result;
    }

    setQuests(playerId: number, quests: any[]): void {
        this.questCache.set(playerId, quests);
        this.stats.sets++;
    }

    deleteQuests(playerId: number): void {
        this.questCache.delete(playerId);
        this.stats.deletes++;
    }

    // ============ NPC缓存 ============

    getNPC(npcId: number): any | undefined {
        const result = this.npcCache.get(npcId);
        if (result) {
            this.stats.hits++;
        } else {
            this.stats.misses++;
        }
        return result;
    }

    setNPC(npcId: number, npc: any): void {
        this.npcCache.set(npcId, npc);
        this.stats.sets++;
    }

    deleteNPC(npcId: number): void {
        this.npcCache.delete(npcId);
        this.stats.deletes++;
    }

    // ============ 技能缓存 ============

    getSkills(playerId: number): any[] | undefined {
        const result = this.skillCache.get(playerId);
        if (result) {
            this.stats.hits++;
        } else {
            this.stats.misses++;
        }
        return result;
    }

    setSkills(playerId: number, skills: any[]): void {
        this.skillCache.set(playerId, skills);
        this.stats.sets++;
    }

    deleteSkills(playerId: number): void {
        this.skillCache.delete(playerId);
        this.stats.deletes++;
    }

    // ============ 批量失效 ============

    /**
     * 使所有与玩家相关的缓存失效
     */
    invalidatePlayer(playerId: number): void {
        this.deletePlayer(playerId);
        this.deleteInventory(playerId);
        this.deleteEquipment(playerId);
        this.deleteQuests(playerId);
        this.deleteSkills(playerId);
    }

    /**
     * 清空所有缓存
     */
    clearAll(): void {
        this.playerCache.clear();
        this.inventoryCache.clear();
        this.equipmentCache.clear();
        this.questCache.clear();
        this.npcCache.clear();
        this.skillCache.clear();

        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
        };
    }

    // ============ 统计信息 ============

    /**
     * 获取缓存统计信息
     */
    getStats() {
        const total = this.stats.hits + this.stats.misses;
        const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;

        return {
            ...this.stats,
            total,
            hitRate: hitRate.toFixed(2) + '%',
            size: {
                player: this.playerCache.size,
                inventory: this.inventoryCache.size,
                equipment: this.equipmentCache.size,
                quest: this.questCache.size,
                npc: this.npcCache.size,
                skill: this.skillCache.size,
            },
        };
    }

    /**
     * 获取缓存大小信息
     */
    getSize() {
        return {
            player: this.playerCache.size,
            inventory: this.inventoryCache.size,
            equipment: this.equipmentCache.size,
            quest: this.questCache.size,
            npc: this.npcCache.size,
            skill: this.skillCache.size,
        };
    }

    /**
     * 重置统计信息
     */
    resetStats(): void {
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
        };
    }
}

/**
 * 全局缓存实例
 */
export const gameCache = new GameCache();