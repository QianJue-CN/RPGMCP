/**
 * 验证器导出和辅助函数
 */
import { z, ZodError } from 'zod';
import { ValidationError } from '../errors/GameError.js';

// 导出所有验证模式
export * from './player.js';
export * from './item.js';

/**
 * 验证辅助函数
 * 验证数据并在失败时抛出 ValidationError
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
    try {
        return schema.parse(data);
    } catch (error) {
        if (error instanceof ZodError) {
            const issues = error.issues.map(issue => ({
                path: issue.path.join('.'),
                message: issue.message,
            }));

            throw new ValidationError(
                '数据验证失败',
                { issues }
            );
        }
        throw error;
    }
}

/**
 * 安全验证函数
 * 返回验证结果而不抛出错误
 */
export function safeValidate<T>(
    schema: z.ZodSchema<T>,
    data: unknown
): { success: true; data: T } | { success: false; error: ZodError } {
    const result = schema.safeParse(data);

    if (result.success) {
        return { success: true, data: result.data };
    } else {
        return { success: false, error: result.error };
    }
}

/**
 * 部分验证函数
 * 允许部分字段未定义
 */
export function validatePartial<T extends z.ZodRawShape>(
    schema: z.ZodObject<T>,
    data: unknown
): Partial<z.infer<z.ZodObject<T>>> {
    return validate(schema.partial(), data);
}

/**
 * 创建带默认值的验证器
 */
export function withDefaults<T extends z.ZodRawShape>(
    schema: z.ZodObject<T>,
    defaults: Partial<z.infer<z.ZodObject<T>>>
) {
    return (data: unknown) => {
        const validated = validate(schema.partial(), data);
        return { ...defaults, ...validated } as z.infer<z.ZodObject<T>>;
    };
}

/**
 * 批量验证
 */
export function validateArray<T>(
    schema: z.ZodSchema<T>,
    dataArray: unknown[]
): T[] {
    return dataArray.map((data, index) => {
        try {
            return validate(schema, data);
        } catch (error) {
            if (error instanceof ValidationError) {
                throw new ValidationError(
                    `数组索引 ${index} 验证失败`,
                    { index, ...error.details }
                );
            }
            throw error;
        }
    });
}

/**
 * 条件验证
 * 根据条件选择不同的验证模式
 */
export function validateConditional<T1, T2>(
    condition: boolean,
    schemaIfTrue: z.ZodSchema<T1>,
    schemaIfFalse: z.ZodSchema<T2>,
    data: unknown
): T1 | T2 {
    if (condition) {
        return validate(schemaIfTrue, data);
    } else {
        return validate(schemaIfFalse, data);
    }
}

/**
 * 自定义验证规则构建器
 */
export class ValidatorBuilder<T> {
    private schema: z.ZodSchema<T>;

    constructor(schema: z.ZodSchema<T>) {
        this.schema = schema;
    }

    /**
     * 添加自定义验证规则
     */
    refine(
        check: (data: T) => boolean,
        message: string
    ): ValidatorBuilder<T> {
        this.schema = this.schema.refine(check, message);
        return this;
    }

    /**
     * 添加转换
     */
    transform<U>(fn: (data: T) => U): ValidatorBuilder<U> {
        return new ValidatorBuilder(this.schema.transform(fn) as any);
    }

    /**
     * 构建最终验证器
     */
    build(): z.ZodSchema<T> {
        return this.schema;
    }

    /**
     * 验证数据
     */
    validate(data: unknown): T {
        return validate(this.schema, data);
    }
}

/**
 * 创建验证器构建器
 */
export function createValidator<T>(schema: z.ZodSchema<T>): ValidatorBuilder<T> {
    return new ValidatorBuilder(schema);
}