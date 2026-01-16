import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

// Initialize S3 client
export const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION!,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const BUCKET_NAME = process.env.NEXT_PUBLIC_AWS_S3_BUCKET!;

/**
 * Generate a unique filename with timestamp and random string
 */
export function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split(".").pop();
  return `${timestamp}-${randomString}.${extension}`;
}

/**
 * Get the public URL for an S3 object
 */
export function getS3Url(key: string): string {
  return `https://${BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${key}`;
}

/**
 * Upload a file to S3
 */
export async function uploadToS3(
  file: File,
  folder: string = "uploads"
): Promise<string> {
  const filename = generateUniqueFilename(file.name);
  const key = `${folder}/${filename}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: file.type,
  });

  await s3Client.send(command);

  return getS3Url(key);
}

/**
 * Delete a file from S3
 */
export async function deleteFromS3(url: string): Promise<void> {
  // Extract key from URL
  const urlParts = url.split(".amazonaws.com/");
  if (urlParts.length !== 2) {
    throw new Error("Invalid S3 URL");
  }

  const key = urlParts[1];

  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}
