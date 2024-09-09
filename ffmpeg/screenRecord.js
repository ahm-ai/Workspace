const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');


const QUALITY = 25; // 0 - 100

function getDateTime() {
  const now = new Date();
  return now.toISOString().replace(/:/g, '-').replace(/\..+/, '');
}

const outputDir = path.join(process.env.HOME, 'Desktop');
const outputFile = path.join(outputDir, `screen_recording_${getDateTime()}.mp4`);

function getScreenResolution() {
  try {
    const output = execSync('system_profiler SPDisplaysDataType', { encoding: 'utf-8' });
    const match = output.match(/Resolution: (\d+) x (\d+)/);
    if (match) {
      return `${match[1]}x${match[2]}`;
    }
  } catch (error) {
    console.error('Error getting screen resolution:', error.message);
  }
  return '1920x1080';  // Fallback to 1080p if we can't detect the resolution
}

function listDevices() {
  return new Promise((resolve, reject) => {
    const listDevices = spawn('ffmpeg', ['-f', 'avfoundation', '-list_devices', 'true', '-i', '']);
    let deviceList = '';
    listDevices.stderr.on('data', (data) => {
      deviceList += data.toString();
    });
    listDevices.on('close', (code) => {
      const devices = {
        audio: [],
        video: []
      };
      const lines = deviceList.split('\n');
      let currentType = null;
      for (const line of lines) {
        if (line.includes('AVFoundation video devices:')) {
          currentType = 'video';
        } else if (line.includes('AVFoundation audio devices:')) {
          currentType = 'audio';
        } else if (currentType && line.includes('] ')) {
          const match = line.match(/\[(\d+)\]\s(.+)/);
          if (match) {
            devices[currentType].push({
              index: match[1],
              name: match[2].trim()
            });
          }
        }
      }
      if (devices.audio.length === 0 && devices.video.length === 0) {
        reject(new Error(`No devices found. FFmpeg output: ${deviceList}`));
      } else {
        resolve(devices);
      }
    });
    listDevices.on('error', (err) => {
      reject(new Error(`Failed to start FFmpeg process: ${err.message}`));
    });
  });
}

function findDeviceIndex(devices, type, name) {
  const device = devices[type].find(d => d.name.includes(name));
  return device ? device.index : null;
}

async function startRecording() {
  try {
    const devices = await listDevices();
    const screenIndex = findDeviceIndex(devices, 'video', 'Capture screen 0');
    const audioIndex = findDeviceIndex(devices, 'audio', 'BlackHole 2ch');

    if (!screenIndex || !audioIndex) {
      throw new Error('Could not find required devices');
    }

    const resolution = getScreenResolution();
    console.log(`Detected screen resolution: ${resolution}`);

      // Calculate CRF value based on QUALITY
    // CRF range is 0-51, where 0 is lossless, 23 is default, and 51 is worst quality
    // We'll invert the QUALITY scale so that 100 quality = 0 CRF, and 0 quality = 51 CRF
    const crf = Math.round((100 - QUALITY) * 0.51);

    const ffmpegCommand = [
      '-f', 'avfoundation',
      '-i', `${screenIndex}:${audioIndex}`,
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-crf', crf.toString(), // 23 is default
      '-c:a', 'aac',
      '-b:a', '192k',
      '-movflags', '+faststart',
      '-pix_fmt', 'yuv420p',
      '-r', '60',
      '-s', resolution,
      '-vsync', '1',
      '-async', '1',
      outputFile
    ];

    console.log('Starting screen recording...');
    console.log(`Output file: ${outputFile}`);
    console.log(`Using video device: [${screenIndex}] Capture screen 0`);
    console.log(`Using audio device: [${audioIndex}] BlackHole 2ch`);

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
  } catch (error) {
    console.error('Error starting recording:', error.message);
    process.exit(1);
  }
}

// Start the recording
startRecording();