export type FileMetadata = {
    fileId: string;
    title: string;
    description?: string;
    createdAt: number | string;
    updatedAt?: number | string;
    s3Key: string;
    isUploaded: boolean;
}

export type CreateFileMetadataDto = Pick<FileMetadata, 'title' | 'description'> & { filename: string };

export type FetchFileMetadataResponse = Pick<FileMetadata, 'title' | 'description' | 'createdAt' | 'updatedAt'> & { presignedUrl: string };
