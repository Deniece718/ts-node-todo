import { IncomingMessage } from 'http';
import { CreateTodoDto, UpdateTodoDto } from "./types";

function isObject(input: unknown): input is Record<string, any> {
    return typeof input === 'object' && input !== null;
}

function isString(input: unknown): input is string {
    return typeof input === 'string';
}

function isBoolean(input: unknown): input is boolean {
    return typeof input === 'boolean';
}

export function isCreateTodoDto(input: unknown): input is CreateTodoDto {
    if(!isObject(input)) return false;
    if(!('title' in input)) return false;
    if(!isString(input.title)) return false;
    if('description' in input && input.description !== undefined && !isString(input.description)) return false;
    return true;
}

export function isUpdateTodoDto(input: unknown): input is UpdateTodoDto {
    if (!isObject(input)) return false;
    if ('title' in input && input.title !== undefined && !isString(input.title)) return false;
    if ('description' in input && input.description !== undefined && !isString(input.description)) return false;
    if ('completed' in input && input.completed !== undefined && !isBoolean(input.completed)) return false;
    return true;
}

export async function parseJsonBody<T>(req: IncomingMessage): Promise<T> {
    return new Promise((resolve, reject) => {
        let body = "";

        req.on('data', (chunk) => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const result = JSON.parse(body) as T;
                resolve(result);
            } catch (error) {
                reject(new Error('Invalid JSON'));
            }
        });

        req.on('error', () => {
            reject(new Error('Failed to read body'));
        });
    })
}