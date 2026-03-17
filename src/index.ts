import http, { IncomingMessage, ServerResponse } from 'http';
import { FileMetadata, CreateFileMetadataDto, FetchFileMetadataResponse,  } from './types';
import { isCreateFileMetadataDto, parseJsonBody } from './validators';
import { getFileMetadata, saveFileMetadata } from './store';
import crypto from 'crypto';
import { getPresignedDownloadUrl, getPresignedUploadUrl } from './s3';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

function setCorsHeaders(res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

function sendJSON(res: ServerResponse, status: number, data: unknown) {
    const payload = JSON.stringify(data);
    setCorsHeaders(res);
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
        POST /files
        GET /files/:id
    */

    // route: /files
    if (pathName === '/files') {
        if (method === 'POST') {
            if (req.headers['content-type'] !== undefined && !String(req.headers['content-type']).includes('application/json')) {
                return badRequest(res, 'Content-Type must be application/json');
            }
            const body = await parseJsonBody<CreateFileMetadataDto>(req);
            if (!isCreateFileMetadataDto(body)) {
                return badRequest(res, 'Invalid body to create file metadata');
            }
            const fileId = crypto.randomUUID();
            const fileMetadata: FileMetadata = {
                fileId,
                title: body.title,
                description: body.description,
                createdAt: Date.now(),
                s3Key:`${fileId}/${body.filename}`,
                isUploaded: false
            }
            await saveFileMetadata(fileMetadata);

            const presignedUrl = await getPresignedUploadUrl(fileMetadata.s3Key);
            return sendJSON(res, 200, { ...fileMetadata, presignedUrl });
        }
        return methodNotAllowed(res);
    }

    // route: /files/:id/download-url
    const fileMetadataIdMatch = pathName.match(/^\/files\/([^/]+)$/);
    if (fileMetadataIdMatch) {
        const id = decodeURIComponent(fileMetadataIdMatch[1]);
        if (method === 'GET') {
            const fileMetadataItem = await getFileMetadata(id);
            if (!fileMetadataItem) return notFound(res);
            const presignedUrl = await getPresignedDownloadUrl(fileMetadataItem.s3Key);
            const responseData: FetchFileMetadataResponse = {
                title: fileMetadataItem.title,
                description: fileMetadataItem.description,
                createdAt: new Date(fileMetadataItem.createdAt).toISOString(),
                updatedAt: fileMetadataItem.updatedAt? new Date(fileMetadataItem.updatedAt).toISOString() : undefined,
                presignedUrl
            }
            return sendJSON(res, 200, responseData);
        }
        return methodNotAllowed(res);
    }

    return notFound(res);
}

const server = http.createServer((req, res) => {
    setCorsHeaders(res);
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }

    handleRequest(req, res).catch((err) => {
        console.error('Unhandled error', err);
        sendJSON(res, 500, { error: 'Internal Server Error' });
    });
});

server.listen(process.env.HTTP_PORT, () => {
    console.log(`File API (strict TS) listening at http://localhost:${process.env.HTTP_PORT}`);
});