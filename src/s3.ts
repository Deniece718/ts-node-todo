import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'eu-north-1' });

export async function getPresignedUploadUrl(s3Key: string): Promise<string> {
    const command = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: s3Key
    });
    return await getSignedUrl(s3Client, command, { expiresIn: 300 });
}

export async function getPresignedDownloadUrl(s3Key: string): Promise<string> {
    const command = new GetObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: s3Key
    });
    return await getSignedUrl(s3Client, command, { expiresIn: 300 });
} 