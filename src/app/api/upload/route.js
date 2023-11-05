import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from 'uuid';

export async function POST(req) {
  const formData = await req.formData();
  const file = formData.get('file');
  const { name, type } = file;
  const data = await file.arrayBuffer();

  const s3Client = new S3Client({
    region: 'us-east-2',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_A,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_A,
    }
  });

  const id = uuidv4();
  const ext = name.split('.').slice(-1)[0];
  const newName = id + '.' + ext;

  const uploadCommand = new PutObjectCommand({
    Bucket: process.env.BUCKET_NAME_A,
    Body: data,
    ACL: 'public-read',
    ContentType: type,
    Key: newName
  })

  await s3Client.send(uploadCommand);

  return Response.json({ name, ext, newName });
}