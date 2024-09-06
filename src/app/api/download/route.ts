import { createWriteStream } from 'fs';
import fs from "fs"
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import ytdl from 'ytdl-core';

export async function POST(req : NextRequest) {
  const { url } = await req.json();

  if (!url) {
    return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
  }

  const downloadPath = path.join(process.cwd(), 'downloads');
  if (!fs.existsSync(downloadPath)) {
    fs.mkdirSync(downloadPath);
  }

  try {
    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title.replace(/[<>:"/\\|?*]+/g, '_');
    const filePath = path.join(downloadPath, `${title}.mp4`);

    const videoStream = ytdl(url, { quality: 'highestvideo' });
    const fileStream = createWriteStream(filePath);

    videoStream.pipe(fileStream);

    return new Promise((resolve, reject) => {
      fileStream.on('finish', () => {
        resolve(NextResponse.json({ fileName: `${title}.mp4`, filePath }));
      });

      fileStream.on('error', (error) => {
        console.error(`File stream error: ${error}`);
        reject(NextResponse.json({ error: 'Failed to download video' }, { status: 500 }));
      });
    });
  } catch (error : any) {
    console.error(`Error: ${error.message}`);
    return NextResponse.json({ error: 'Failed to download video' }, { status: 500 });
  }
}
