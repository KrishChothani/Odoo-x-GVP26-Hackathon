import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs";
import path from "path";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const uploadToS3 = async (localFilePath, folder = "documents") => {
  try {
    if (!localFilePath) return null;

    const fileContent = fs.readFileSync(localFilePath);
    const fileName = path.basename(localFilePath);
    const timestamp = Date.now();
    const fileKey = `${folder}/${timestamp}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileKey,
      Body: fileContent,
      ContentType: getContentType(fileName),
    });

    await s3Client.send(command);

    const fileUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.ap-south-1.amazonaws.com/${fileKey}`;

    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    return {
      url: fileUrl,
      secure_url: fileUrl,
      key: fileKey,
      public_id: fileKey, 
    };
  } catch (error) {
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    return null;
  }
};

const uploadBufferToS3 = async (buffer, fileName, folder = "bills") => {
  try {
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/\s+/g, "_");
    const fileKey = `${folder}/${timestamp}-${sanitizedFileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileKey,
      Body: buffer,
      ContentType: "application/pdf",
    });

    await s3Client.send(command);

    const fileUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.ap-south-1.amazonaws.com/${fileKey}`;

    return {
      url: fileUrl,
      secure_url: fileUrl,
      key: fileKey,
      public_id: fileKey,
    };
  } catch (error) {
    // console.error("S3 buffer upload error:", error);
    throw error;
  }
};

/**
 * Delete file from S3
 * @param {string} fileKey - S3 object key
 */
const deleteFromS3 = async (fileKey) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileKey,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    // console.error("S3 delete error:", error);
    return false;
  }
};

/**
 * Generate presigned URL for direct upload from frontend
 * @param {string} fileName - Original file name
 * @param {string} fileType - MIME type
 * @param {string} folder - Optional folder prefix
 * @returns {Object} - { uploadUrl, fileUrl, fileKey }
 */
const generatePresignedUploadUrl = async (fileName, fileType, folder = "documents") => {
  try {
    const timestamp = Date.now();
    const fileKey = `${folder}/${timestamp}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileKey,
      ContentType: fileType,
    //   ACL: "public-read",
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // 1 hour
    });

    const fileUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.ap-south-1.amazonaws.com/${fileKey}`;

    return {
      uploadUrl,
      fileUrl,
      fileKey,
    };
  } catch (error) {
    // console.error("Error generating presigned URL:", error);
    throw error;
  }
};

/**
 * Get content type based on file extension
 */
const getContentType = (fileName) => {
  const ext = path.extname(fileName).toLowerCase();
  const contentTypes = {
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".txt": "text/plain",
    ".csv": "text/csv",
    ".xls": "application/vnd.ms-excel",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
  return contentTypes[ext] || "application/octet-stream";
};

export { uploadToS3, uploadBufferToS3, deleteFromS3, generatePresignedUploadUrl };
