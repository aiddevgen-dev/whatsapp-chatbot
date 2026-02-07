import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ffmpeg from 'fluent-ffmpeg';
import { downloadMedia } from '../whatsapp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STORAGE_PATH = process.env.STORAGE_PATH || './storage';

/**
 * Process and download WhatsApp media from URL
 * @param {string} mediaUrl - Direct media URL from Whapi.Cloud
 * @param {string} wa_id - User's WhatsApp ID
 * @param {string} type - Media type (image, audio, voice, payment)
 */
export async function processMedia(mediaUrl, wa_id, type) {
  try {
    // Create user directory
    const userDir = path.join(STORAGE_PATH, wa_id);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    // Generate filename with timestamp
    const timestamp = Date.now();
    const extension = type === 'image' || type === 'payment' ? 'jpg' : 'ogg';
    const originalPath = path.join(userDir, `${type}_${timestamp}_original.${extension}`);

    // Download media
    await downloadMedia(mediaUrl, originalPath);

    return {
      originalPath,
      userDir,
      timestamp,
    };
  } catch (error) {
    console.error('❌ Media processing error:', error);
    throw error;
  }
}

/**
 * Convert audio to 16kHz mono for Whisper
 * @param {string} inputPath - Input audio file path
 * @param {string} outputPath - Output audio file path
 */
export async function convertAudioForWhisper(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioFrequency(16000) // 16kHz
      .audioChannels(1) // Mono
      .audioCodec('libmp3lame') // MP3 codec
      .toFormat('mp3')
      .on('end', () => {
        console.log(`✅ Audio converted: ${outputPath}`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error('❌ FFmpeg conversion error:', err);
        reject(err);
      })
      .save(outputPath);
  });
}

/**
 * Process voice message for transcription
 * @param {string} mediaUrl - Direct media URL from Whapi.Cloud
 * @param {string} wa_id - User's WhatsApp ID
 */
export async function processVoiceMessage(mediaUrl, wa_id) {
  try {
    // Download original audio
    const { originalPath, userDir, timestamp } = await processMedia(mediaUrl, wa_id, 'voice');

    // Convert to 16kHz mono
    const convertedPath = path.join(userDir, `voice_${timestamp}_converted.mp3`);
    await convertAudioForWhisper(originalPath, convertedPath);

    return convertedPath;
  } catch (error) {
    console.error('❌ Voice processing error:', error);
    throw error;
  }
}

/**
 * Save payment proof image
 * @param {string} mediaUrl - Direct media URL from Whapi.Cloud
 * @param {string} wa_id - User's WhatsApp ID
 */
export async function savePaymentProof(mediaUrl, wa_id) {
  try {
    const { originalPath } = await processMedia(mediaUrl, wa_id, 'payment');
    return originalPath;
  } catch (error) {
    console.error('❌ Payment proof save error:', error);
    throw error;
  }
}

/**
 * Clean up old media files (older than 7 days)
 */
export async function cleanupOldMedia() {
  const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  const now = Date.now();

  try {
    const userDirs = fs.readdirSync(STORAGE_PATH);

    for (const userDir of userDirs) {
      const userPath = path.join(STORAGE_PATH, userDir);
      if (!fs.statSync(userPath).isDirectory()) continue;

      const files = fs.readdirSync(userPath);
      for (const file of files) {
        const filePath = path.join(userPath, file);
        const stats = fs.statSync(filePath);

        if (now - stats.mtimeMs > maxAge) {
          fs.unlinkSync(filePath);
          console.log(`🗑️  Deleted old file: ${filePath}`);
        }
      }
    }
  } catch (error) {
    console.error('❌ Cleanup error:', error);
  }
}

// Run cleanup daily
setInterval(cleanupOldMedia, 24 * 60 * 60 * 1000);
