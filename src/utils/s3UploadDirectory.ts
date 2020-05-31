import S3 from '../s3Client';
import readdir from 'recursive-readdir';
import { promises as fs } from 'fs';
import path from 'path';
import filePathToS3Key from './filePathToS3Key';
import mimeTypes from 'mime-types';

export default async (bucketName: string, directory: string) => {
  const normalizedPath = path.normalize(directory);

  const files = await readdir(normalizedPath);  
  await Promise.all(
    files.map(async filePath => {
      const s3Key = filePathToS3Key(filePath.replace(normalizedPath, ''));

      console.log(`Uploading ${s3Key} to ${bucketName}`);

      try {
        const fileBuffer = await fs.readFile(filePath);
        const mimeType =
          mimeTypes.lookup(filePath) || 'application/octet-stream';

        await S3.putObject({
          Bucket: bucketName,
          Key: s3Key,
          Body: fileBuffer,
          ACL: 'public-read',
          ServerSideEncryption: 'AES256',
          ContentType: mimeType
        }).promise();
      } catch (e) {
        const message = `Failed to upload ${s3Key}: ${e.code} - ${e.message}`;
        console.log(message);
        throw message;
      }
    })
  );
};
