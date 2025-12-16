/**
 * 游戏错误基类和自定义错误类型
 */

/**
 * 错误代码枚举
 */
export enum ErrorCode {
    // 通用错误 (1xxx)
    UNKNOWN_ERROR = 'UNKNOWN_ERROR',
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    INVALID_INPUT = 'INVALID_INPUT',

    // 玩家相关错误 (2xxx)
    PLAYER_NOT_FOUND = 'PLAYER_NOT_FOUND',
    PLAYER_ALREADY_EXISTS = 'PLAYER_ALREADY_EXISTS',
    PLAYER_DEAD = 'PLAYER_DEAD',
    INSUFFICIENT_LEVEL = 'INSUFFICIENT_LEVEL',

    // 物品相关错误 (3xxx)
    ITEM_NOT_FOUND = 'ITEM_NOT_FOUND',
    INSUFFICIENT_ITEMS = 'INSUFFICIENT_ITEMS',
    INVENTORY_FULL = 'INVENTORY_FULL',
    CANNOT_EQUIP = 'CANNOT_EQUIP',
    SLOT_OCCUPIED = 'SLOT_OCCUPIED',

    // 任务相关错误 (4xxx)
    QUEST_NOT_FOUND = 'QUEST_NOT_FOUND',
    QUEST_ALREADY_ACTIVE = 'QUEST_ALREADY_ACTIVE',
    QUEST_REQUIREMENTS_NOT_MET = 'QUEST_REQUIREMENTS_NOT_MET',
    QUEST_ALREADY_COMPLETED = 'QUEST_ALREADY_COMPLETED',

    // 制作相关错误 (5xxx)
    RECIPE_NOT_FOUND = 'RECIPE_NOT_FOUND',
    INSUFFICIENT_MATERIALS = 'INSUFFICIENT_MATERIALS',
    INSUFFICIENT_SKILL = 'INSUFFICIENT_SKILL',
    CRAFTING_FAILED = 'CRAFTING_FAILED',

    // 战斗相关错误 (6xxx)
    INVALID_TARGET = 'INVALID_TARGET',
    OUT_OF_RANGE = 'OUT_OF_RANGE',
    INSUFFICIENT_MANA = 'INSUFFICIENT_MANA',

    // 数据库相关错误 (7xxx)
    DATABASE_ERROR = 'DATABASE_ERROR',
    CONNECTION_ERROR = 'CONNECTION_ERROR',
    TRANSACTION_ERROR = 'TRANSACTION_ERROR',

    // 权限相关错误 (8xxx)
    UNAUTHORIZED = 'UNAUTHORIZED',
    FORBIDDEN = 'FORBIDDEN',
    PERMISSION_DENIED = 'PERMISSION_DENIED',
}

/**
 * 游戏错误基类
 */
export class GameError extends Error {
    public readonly code: ErrorCode;
    public readonly details?: any;
    public readonly timestamp: Date;

    constructor(code: ErrorCode, message: string, details?: any) {
        super(message);
        this.name = 'GameError';
        this.code = code;
        this.details = details;
        this.timestamp = new Date();

        // 保持正确的原型链
        Object.setPrototypeOf(this, GameError.prototype);
    }

    /**
     * 转换为JSON格式
     */
    toJSON() {
        return {
            error: true,
            code: this.code,
            message: this.message,
            details: this.details,
            timestamp: this.timestamp.toISOString(),
        };
    }
}

/**
 * 验证错误
 */
export class ValidationError extends GameError {
    constructor(message: string, details?: any) {
        super(ErrorCode.VALIDATION_ERROR, message, details);
        this.name = 'ValidationError';
    }
}

/**
 * 玩家未找到错误
 */
export class PlayerNotFoundError extends GameError {
    constructor(playerName: string) {
        super(
            ErrorCode.PLAYER_NOT_FOUND,
            `玩家不存在: ${playerName}`,
            { playerName }
        );
        this.name = 'PlayerNotFoundError';
    }
}

/**
 * 玩家已存在错误
 */
export class PlayerAlreadyExistsError extends GameError {
    constructor(playerName: string) {
        super(
            ErrorCode.PLAYER_ALREADY_EXISTS,
            `玩家已存在: ${playerName}`,
            { playerName }
        );
        this.name = 'PlayerAlreadyExistsError';
    }
}

/**
 * 玩家已死亡错误
 */
export class PlayerDeadError extends GameError {
    constructor(playerName: string) {
        super(
            ErrorCode.PLAYER_DEAD,
            `玩家已死亡: ${playerName}`,
            { playerName }
        );
        this.name = 'PlayerDeadError';
    }
}

/**
 * 等级不足错误
 */
export class InsufficientLevelError extends GameError {
    constructor(required: number, current: number) {
        super(
            ErrorCode.INSUFFICIENT_LEVEL,
            `等级不足。需要等级 ${required},当前等级 ${current}`,
            { required, current }
        );
        this.name = 'InsufficientLevelError';
    }
}

/**
 * 物品未找到错误
 */
export class ItemNotFoundError extends GameError {
    constructor(itemId: string) {
        super(
            ErrorCode.ITEM_NOT_FOUND,
            `物品不存在: ${itemId}`,
            { itemId }
        );
        this.name = 'ItemNotFoundError';
    }
}

/**
 * 物品数量不足错误
 */
export class InsufficientItemsError extends GameError {
    constructor(itemId: string, required: number, available: number) {
        super(
            ErrorCode.INSUFFICIENT_ITEMS,
            `${itemId} 数量不足。需要 ${required},拥有 ${available}`,
            { itemId, required, available }
        );
        this.name = 'InsufficientItemsError';
    }
}

/**
 * 任务未找到错误
 */
export class QuestNotFoundError extends GameError {
    constructor(questId: string) {
        super(
            ErrorCode.QUEST_NOT_FOUND,
            `任务不存在: ${questId}`,
            { questId }
        );
        this.name = 'QuestNotFoundError';
    }
}

/**
 * 任务已激活错误
 */
export class QuestAlreadyActiveError extends GameError {
    constructor(questId: string) {
        super(
            ErrorCode.QUEST_ALREADY_ACTIVE,
            `任务已经激活: ${questId}`,
            { questId }
        );
        this.name = 'QuestAlreadyActiveError';
    }
}

/**
 * 配方未找到错误
 */
export class RecipeNotFoundError extends GameError {
    constructor(recipeId: string) {
        super(
            ErrorCode.RECIPE_NOT_FOUND,
            `配方不存在: ${recipeId}`,
            { recipeId }
        );
        this.name = 'RecipeNotFoundError';
    }
}

/**
 * 材料不足错误
 */
export class InsufficientMaterialsError extends GameError {
    constructor(materials: Record<string, { required: number; available: number }>) {
        const missing = Object.entries(materials)
            .filter(([_, { required, available }]) => available < required)
            .map(([id, { required, available }]) => `${id}(需要${required},拥有${available})`)
            .join(', ');

        super(
            ErrorCode.INSUFFICIENT_MATERIALS,
            `材料不足: ${missing}`,
            { materials }
        );
        this.name = 'InsufficientMaterialsError';
    }
}

/**
 * 技能等级不足错误
 */
export class InsufficientSkillError extends GameError {
    constructor(skill: string, required: number, current: number) {
        super(
            ErrorCode.INSUFFICIENT_SKILL,
            `${skill} 技能等级不足。需要 ${required},当前 ${current}`,
            { skill, required, current }
        );
        this.name = 'InsufficientSkillError';
    }
}

/**
 * 数据库错误
 */
export class DatabaseError extends GameError {
    constructor(message: string, details?: any) {
        super(ErrorCode.DATABASE_ERROR, message, details);
        this.name = 'DatabaseError';
    }
}

/**
 * 权限被拒绝错误
 */
export class PermissionDeniedError extends GameError {
    constructor(action: string, resource?: string) {
        const message = resource
            ? `无权执行操作 "${action}" 于资源 "${resource}"`
            : `无权执行操作 "${action}"`;

        super(ErrorCode.PERMISSION_DENIED, message, { action, resource });
        this.name = 'PermissionDeniedError';
    }
}

/**
 * 错误处理辅助函数
 */
export function handleError(error: unknown): GameError {
    if (error instanceof GameError) {
        return error;
    }

    if (error instanceof Error) {
        return new GameError(
            ErrorCode.UNKNOWN_ERROR,
            error.message,
            { originalError: error.name, stack: error.stack }
        );
    }

    return new GameError(
        ErrorCode.UNKNOWN_ERROR,
        '发生未知错误',
        { error }
    );
}

/**
 * 格式化错误响应
 */
export function formatErrorResponse(error: unknown): string {
    const gameError = handleError(error);
    return JSON.stringify(gameError.toJSON(), null, 2);
}