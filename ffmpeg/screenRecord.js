const { spawn } = require('child_process');
const path = require('path');
const readline = require('readline');
const fs = require('fs');

function getDateTime() {
  const now = new Date();
  return now.toISOString().replace(/:/g, '-').replace(/\..+/, '');
}

const outputDir = path.join(process.env.HOME, 'Desktop');
const outputFile = path.join(outputDir, `screen_recording_${getDateTime()}.mp4`);

console.log('Listing available input devices...');
const listDevices = spawn('ffmpeg', ['-f', 'avfoundation', '-list_devices', 'true', '-i', '']);

let deviceList = '';
listDevices.stderr.on('data', (data) => {
  deviceList += data.toString();
});

listDevices.on('close', () => {
  console.log(deviceList);
  promptUser();
});

function promptUser() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Enter screen device index (default 2): ', (screenIndex) => {
    rl.question('Enter audio device index (default 2): ', (audioIndex) => {
      rl.close();
      startRecording(screenIndex || '2', audioIndex || '2');
    });
  });
}

function startRecording(screenIndex, audioIndex) {
  const ffmpegCommand = [
    '-f', 'avfoundation',
    '-i', `${screenIndex}:${audioIndex}`,
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-crf', '23',
    '-c:a', 'aac',
    '-movflags', '+faststart',
    '-pix_fmt', 'yuv420p',
    '-r', '30',
    '-s', '1920x1080',
    outputFile
  ];

  console.log('Starting screen recording...');
  console.log(`Output file: ${outputFile}`);

  const ffmpeg = spawn('ffmpeg', ffmpegCommand);

  ffmpeg.stderr.on('data', (data) => {
    console.log(`FFmpeg: ${data}`);
  });

  ffmpeg.on('error', (err) => {
    console.error('FFmpeg process error:', err);
  });

  let gracefullyClosing = false;

  function stopRecording() {
    if (gracefullyClosing) return;
    gracefullyClosing = true;
    
    console.log('Stopping recording gracefully...');
    ffmpeg.stdin.write('q');
    
    setTimeout(() => {
      if (ffmpeg.exitCode === null) {
        console.log('Forcing FFmpeg to close...');
        ffmpeg.kill('SIGKILL');
      }
    }, 10000);
  }

  ffmpeg.on('close', (code) => {
    if (code === 0 || gracefullyClosing) {
      if (fs.existsSync(outputFile) && fs.statSync(outputFile).size > 0) {
        console.log('Recording completed successfully.');
        console.log(`Output file: ${outputFile}`);
      } else {
        console.error('Output file is missing or empty.');
      }
    } else {
      console.error(`FFmpeg process exited with code ${code}`);
    }
    process.exit();
  });

  process.on('SIGINT', stopRecording);
  process.on('SIGTERM', stopRecording);

  console.log('Press Ctrl+C to stop recording.');
}