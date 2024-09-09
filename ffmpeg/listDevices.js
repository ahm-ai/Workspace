const { spawn } = require('child_process');

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

// Example usage:
listDevices()
  .then(devices => {
    console.log('Audio Devices:');
    devices.audio.forEach(device => console.log(`[${device.index}] ${device.name}`));
    console.log('\nVideo Devices:');
    devices.video.forEach(device => console.log(`[${device.index}] ${device.name}`));
  })
  .catch(err => console.error('Error listing devices:', err));