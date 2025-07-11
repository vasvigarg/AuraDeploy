import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";

import dotenv from "dotenv";
dotenv.config();

export const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  endpoint: process.env.S3_ENDPOINT!,
  region: process.env.AWS_REGION!,
});

export async function downloadS3Folder(prefix: string) {
  try {
    const command = new ListObjectsV2Command({
      Bucket: "aura-deploy",
      Prefix: prefix,
    });

    const allFiles = await s3Client.send(command);

    const allPromises =
      allFiles.Contents?.map(async ({ Key }) => {
        if (!Key) return;

        const finalOutputPath = path.join(__dirname, Key);
        const dirName = path.dirname(finalOutputPath);

        if (!fs.existsSync(dirName)) {
          fs.mkdirSync(dirName, { recursive: true });
        }

        const getObjectCommand = new GetObjectCommand({
          Bucket: "aura-deploy",
          Key,
        });

        const response = await s3Client.send(getObjectCommand);
        const outputFile = fs.createWriteStream(finalOutputPath);

        if (response.Body) {
          await pipeline(response.Body as NodeJS.ReadableStream, outputFile);
        }
      }) || [];

    console.log("awaiting");
    await Promise.all(allPromises);
  } catch (error) {
    console.error("Error downloading S3 folder:", error);
    throw error;
  }
}

export function copyFinalDist(id: string) {
  const folderPath = path.join(__dirname, `output/${id}/dist`);
  const allFiles = getAllFiles(folderPath);
  allFiles.forEach((file) => {
    uploadFile(`dist/${id}/` + file.slice(folderPath.length + 1), file);
  });
}

const getAllFiles = (folderPath: string) => {
  let response: string[] = [];

  const allFilesAndFolders = fs.readdirSync(folderPath);
  allFilesAndFolders.forEach((file) => {
    const fullFilePath = path.join(folderPath, file);
    if (fs.statSync(fullFilePath).isDirectory()) {
      response = response.concat(getAllFiles(fullFilePath));
    } else {
      response.push(fullFilePath);
    }
  });
  return response;
};

const uploadFile = async (fileName: string, localFilePath: string) => {
  try {
    const fileContent = fs.readFileSync(localFilePath);

    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: "aura-deploy",
        Key: fileName,
        Body: fileContent,
      },
    });

    const response = await upload.done();
    console.log(response);
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};
