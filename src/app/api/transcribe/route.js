import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { GetTranscriptionJobCommand, StartTranscriptionJobCommand, TranscribeClient } from "@aws-sdk/client-transcribe";

function getClient() {
  return new TranscribeClient({
    region: 'us-east-2',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_A,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_A,
    },
  });
}
function createTranscriptionCommand(fileName) {
  return new StartTranscriptionJobCommand({
    TranscriptionJobName: fileName,
    LanguageCode: 'en-US',
    Media: {
      MediaFileUri: `https://captionapp.s3.us-east-2.amazonaws.com/${fileName}`,
    },
    OutputBucketName: process.env.BUCKET_NAME_A,
    Settings: {
      ChannelIdentification: false,
      MaxAlternatives: 2,
      ShowAlternatives: true,
      MaxSpeakerLabels: 2,
      ShowSpeakerLabels: true,
    },
  });
}
async function createTranscriptionJob(fileName) {
  const transcribeClient = getClient();
  const transcriptionCommand = createTranscriptionCommand(fileName);
  return transcribeClient.send(transcriptionCommand);
}

async function getJob(fileName) {
  const transcribeClient = getClient();
  let jobStatusResult = null;
  try {
    const transcriptionJobStatusCommand = new GetTranscriptionJobCommand({
      TranscriptionJobName: fileName,
    });
    jobStatusResult = await transcribeClient.send(
      transcriptionJobStatusCommand
    );
  } catch (e) { }
  return jobStatusResult;
}

async function streamToString(stream) {
  const chunks = [];
  return new Promise((resolve, reject) => {
    stream.on('data', chunk => chunks.push(Buffer.from(chunk)));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    stream.on('error', reject);
  });
}

async function getTranscriptionFile(fileName) {
  const transcriptionFile = fileName + '.json';
  const s3client = new S3Client({
    region: 'us-east-2',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_A,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_A,
    },
  });
  const getObjectCommand = new GetObjectCommand({
    Bucket: process.env.BUCKET_NAME_A,
    Key: transcriptionFile,
  });
  let transcriptionFileResponse = null;
  try {
    transcriptionFileResponse = await s3client.send(getObjectCommand);
  } catch (e) { }
  if (transcriptionFileResponse) {
    return JSON.parse(
      await streamToString(transcriptionFileResponse.Body)
    );
  }
  return null;
}

export async function GET(req) {
  const url = new URL(req.url);
  const searchParams = new URLSearchParams(url.searchParams);
  const fileName = searchParams.get('fileName');

  // find ready transcription
  const transcription = await getTranscriptionFile(fileName);
  if (transcription) {
    return Response.json({
      status: 'COMPLETED',
      transcription,
    });
  }

  // check if already transcribing
  const existingJob = await getJob(fileName);

  if (existingJob) {
    return Response.json({
      status: existingJob.TranscriptionJob.TranscriptionJobStatus,
    })
  }

  // creating new transcription job
  if (!existingJob) {
    const newJob = await createTranscriptionJob(fileName);
    return Response.json({
      status: newJob.TranscriptionJob.TranscriptionJobStatus,
    });
  }

  return Response.json(null);
}