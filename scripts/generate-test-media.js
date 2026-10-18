import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.resolve(__dirname, '../tests/fixtures');

if (!fs.existsSync(fixturesDir)) {
  fs.mkdirSync(fixturesDir, { recursive: true });
}

console.log('--- Generating Synthetic Test Media Fixtures via FFmpeg ---');

const sampleMp4 = path.join(fixturesDir, 'synthetic-sample.mp4');
const noAudioMp4 = path.join(fixturesDir, 'synthetic-no-audio.mp4');
const sampleWebm = path.join(fixturesDir, 'synthetic-sample.webm');

try {
  // 1. Synthetic 10s MP4 with Video (SMPTE bars + timestamp) and Audio (440Hz tone)
  console.log('1. Creating synthetic-sample.mp4 (10s H.264 + AAC)...');
  execSync(
    `ffmpeg -y -f lavfi -i testsrc=duration=10:size=640x360:rate=30 -f lavfi -i sine=frequency=440:duration=10 -c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 96k -movflags +faststart "${sampleMp4}"`,
    { stdio: 'pipe' }
  );

  // 2. Synthetic 5s MP4 with NO audio stream
  console.log('2. Creating synthetic-no-audio.mp4 (5s H.264 without audio)...');
  execSync(
    `ffmpeg -y -f lavfi -i testsrc=duration=5:size=320x240:rate=25 -c:v libx264 -pix_fmt yuv420p -an -movflags +faststart "${noAudioMp4}"`,
    { stdio: 'pipe' }
  );

  // 3. Synthetic 5s WebM (VP8 + Vorbis)
  console.log('3. Creating synthetic-sample.webm (5s VP8 + Vorbis)...');
  execSync(
    `ffmpeg -y -f lavfi -i testsrc=duration=5:size=320x240:rate=25 -f lavfi -i sine=frequency=880:duration=5 -c:v libvpx -b:v 500k -c:a libvorbis "${sampleWebm}"`,
    { stdio: 'pipe' }
  );

  // Probe and verify files with ffprobe
  console.log('\n--- Probing Created Fixtures with FFprobe ---');
  for (const file of [sampleMp4, noAudioMp4, sampleWebm]) {
    const probeJson = execSync(
      `ffprobe -v quiet -print_format json -show_format -show_streams "${file}"`,
      { encoding: 'utf8' }
    );
    const probe = JSON.parse(probeJson);
    const duration = parseFloat(probe.format.duration);
    const size = parseInt(probe.format.size, 10);
    const streams = probe.streams.map(s => `${s.codec_type}:${s.codec_name}`).join(', ');

    console.log(`✅ ${path.basename(file)}: Duration=${duration.toFixed(2)}s, Size=${(size / 1024).toFixed(1)} KB, Streams=[${streams}]`);
  }

  console.log('\nAll test fixtures generated and verified successfully!');
} catch (err) {
  console.error('Error generating test media:', err);
  process.exit(1);
}
