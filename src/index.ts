import http, { IncomingMessage, ServerResponse } from 'http';
import { CreateTodoDto, Todo, UpdateTodoDto } from './types';
import { isCreateTodoDto, isUpdateTodoDto, parseJsonBody } from './validators';
import { listTodos, getTodo, saveTodo, deleteTodo } from './store';
import crypto from 'crypto';

const PORT = process.env.PORT ?? 3000;

function sendJSON(res: ServerResponse, status: number, data: unknown) {
    const payload = JSON.stringify(data);
    res.writeHead(status, {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload, 'utf8')
    });
    res.end(payload);
}

function notFound(res: ServerResponse) {
    sendJSON(res, 404, { error: 'Not found' });
}

function methodNotAllowed(res: ServerResponse) {
    sendJSON(res, 405, { error: 'Method not allowed' });
}

function badRequest(res: ServerResponse, message = 'Bad request') {
    sendJSON(res, 400, { error: message });
}

async function handleRequest(req: IncomingMessage, res: ServerResponse) {
    const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
    const pathName = url.pathname;
    const method = req.method ?? 'GET';

    /*
        Routes:
        GET /todos
        POST /todos
        GET /todos/:id
        PATCH /todos/:id
        DELETE /todos/:id
    */

    // route: /todos
    if (pathName === '/todos') {
        if (method === 'GET') {
            const items = listTodos();
            return sendJSON(res, 200, items);
        }

        if (method === 'POST') {
            if (req.headers['content-type'] !== undefined && !String(req.headers['content-type']).includes('application/json')) {
                return badRequest(res, 'Content-Type must be application/json');
            }
            const body = await parseJsonBody<CreateTodoDto>(req);
            if (!isCreateTodoDto(body)) {
                return badRequest(res, 'Invalid body to create todo');
            }
            const todo: Todo = {
                id: crypto.randomUUID(),
                title: body.title,
                description: body.description,
                completed: false,
                createdAt: new Date().toISOString(),
            }
            saveTodo(todo);
            return sendJSON(res, 200, todo);
        }
    }

    // route: /todos/:id
    const todoIdMatch = pathName.match(/^\/todos\/([^/]+)$/);
    if (todoIdMatch) {
    const id = decodeURIComponent(todoIdMatch[1]);
    if (method === 'GET') {
        const todoItem = getTodo(id);
        if (!todoItem) return notFound(res);
        return sendJSON(res, 200, todoItem);
    }

    if (method === 'PATCH') {
        if (req.headers['content-type'] !== undefined && !String(req.headers['content-type']).includes('application/json')) {
            return badRequest(res, 'Content-Type must be application/json');
        }

        const body = await parseJsonBody<UpdateTodoDto>(req);
        console.log('body', body);
        if (!isUpdateTodoDto(body)) return badRequest(res, 'Invalid update body');

        const existing = getTodo(id);
        if (!existing) return notFound(res);

        const updated: Todo = {
            ...existing,
            title: body.title ?? existing.title,
            description: body.description ?? existing.description,
            completed: body.completed ?? existing.completed,
            updatedAt: new Date().toISOString()
        };
        saveTodo(updated);
        return sendJSON(res, 200, updated);
    }

    if (method === 'DELETE') {
        const deleted = deleteTodo(id);
        if (!deleted) return notFound(res);
        return sendJSON(res, 204, null);
    }

    return methodNotAllowed(res);
    }

    notFound(res);
}

const server = http.createServer((req, res) => {
  // basic logging
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  handleRequest(req, res).catch((err) => {
    console.error('Unhandled error', err);
    sendJSON(res, 500, { error: 'Internal Server Error' });
  });
});

server.listen(PORT, () => {
  console.log(`Todo API (strict TS) listening at http://localhost:${PORT}`);
});