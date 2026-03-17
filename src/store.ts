import { FileMetadata } from './types';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'eu-north-1' });
const ddbDocClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = 'file-metadata';

export async function getFileMetadata(fileId: string): Promise<FileMetadata | undefined> {
    return await ddbDocClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: {
            fileId: fileId
        }
    })).then((data) => {
        if (data.Item) {
            return {
                fileId: data.Item.fileId,
                title: data.Item.title,
                description: data.Item.description,
                createdAt: data.Item.createdAt,
                updatedAt: data.Item.updatedAt,
                s3Key: data.Item.s3Key,
                isUploaded: data.Item.isUploaded
            }
        } else {
            return undefined;
        }
    }).catch((error) => {
        console.error('Error getting file metadata:', error);
        return undefined;
    });
}

export async function saveFileMetadata(fileMetadata: FileMetadata): Promise<void> {
    await ddbDocClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: {
            fileId: fileMetadata.fileId,
            title: fileMetadata.title,
            description: fileMetadata.description,
            createdAt: fileMetadata.createdAt,
            updatedAt: fileMetadata.updatedAt,
            s3Key: fileMetadata.s3Key,
            isUploaded: fileMetadata.isUploaded
        }
    })).catch((error) => {
        console.error('Error saving file metadata:', error);
    });
}

export async function deleteFileMetadata(fileId: string): Promise<boolean> {
    return await ddbDocClient.send(new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
            fileId: fileId
        }
    })).then(() => {
        return true;
    }).catch((error) => {
        console.error('Error deleting file metadata:', error);
        return false;
    });
}
