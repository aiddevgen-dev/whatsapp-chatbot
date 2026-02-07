import axios from 'axios';
import fs from 'fs';

const getBaseUrl = () => process.env.WHAPI_BASE_URL || 'https://gate.whapi.cloud';
const getToken = () => process.env.WHAPI_API_TOKEN;

/**
 * Send a simple text message
 */
export async function sendText(to, text) {
  try {
    const response = await axios.post(
      `${getBaseUrl()}/messages/text`,
      {
        to,
        body: text,
      },
      {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log(`✅ Text sent to ${to}`);
    return response.data;
  } catch (error) {
    console.error('❌ Error sending text:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Send interactive button message (max 3 buttons)
 * @param {string} to - WhatsApp phone number
 * @param {string} bodyText - Main message text
 * @param {Array} buttons - Array of {id, title} objects (max 3)
 * @param {string} headerText - Optional header text
 * @param {string} footerText - Optional footer text
 */
export async function sendButtons(to, bodyText, buttons, headerText = null, footerText = null) {
  if (buttons.length > 3) {
    throw new Error('WhatsApp allows maximum 3 buttons');
  }

  const payload = {
    to,
    type: 'button',
    body: { text: bodyText },
    action: {
      buttons: buttons.map((btn) => ({
        type: 'quick_reply',
        id: btn.id,
        title: btn.title.substring(0, 20),
      })),
    },
  };

  if (headerText) {
    payload.header = { text: headerText };
  }

  if (footerText) {
    payload.footer = { text: footerText };
  }

  try {
    const response = await axios.post(
      `${getBaseUrl()}/messages/interactive`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log(`✅ Buttons sent to ${to}`);
    return response.data;
  } catch (error) {
    console.error('❌ Error sending buttons:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Send interactive list message
 * @param {string} to - WhatsApp phone number
 * @param {string} bodyText - Main message text
 * @param {string} buttonText - Button text to open list (e.g., "Select quantity")
 * @param {Array} rows - Array of {id, title, description?} objects
 * @param {string} headerText - Optional header text
 * @param {string} footerText - Optional footer text
 * @param {string} sectionTitle - Optional section title
 */
export async function sendList(to, bodyText, buttonText, rows, headerText = null, footerText = null, sectionTitle = 'Options') {
  if (rows.length > 10) {
    console.warn('⚠️  WhatsApp recommends max 10 list items');
  }

  const payload = {
    to,
    type: 'list',
    body: { text: bodyText },
    action: {
      list: {
        label: buttonText.substring(0, 20),
        sections: [
          {
            title: sectionTitle,
            rows: rows.map((row) => ({
              id: row.id,
              title: row.title.substring(0, 24),
              description: row.description ? row.description.substring(0, 72) : undefined,
            })),
          },
        ],
      },
    },
  };

  if (headerText) {
    payload.header = { text: headerText };
  }

  if (footerText) {
    payload.footer = { text: footerText };
  }

  try {
    const response = await axios.post(
      `${getBaseUrl()}/messages/interactive`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log(`✅ List sent to ${to}`);
    return response.data;
  } catch (error) {
    console.error('❌ Error sending list:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Send image message
 * @param {string} to - WhatsApp phone number
 * @param {string} imageUrl - Public image URL
 * @param {string} caption - Optional caption
 */
export async function sendImage(to, imageUrl, caption = null) {
  const payload = {
    to,
    media: imageUrl,
  };

  if (caption) {
    payload.caption = caption;
  }

  try {
    const response = await axios.post(
      `${getBaseUrl()}/messages/image`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log(`✅ Image sent to ${to}`);
    return response.data;
  } catch (error) {
    console.error('❌ Error sending image:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Send audio message
 * @param {string} to - WhatsApp phone number
 * @param {string} audioUrl - Public audio URL
 */
export async function sendAudio(to, audioUrl) {
  try {
    const response = await axios.post(
      `${getBaseUrl()}/messages/audio`,
      {
        to,
        media: audioUrl,
      },
      {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log(`✅ Audio sent to ${to}`);
    return response.data;
  } catch (error) {
    console.error('❌ Error sending audio:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Download media file from URL
 * @param {string} mediaUrl - Media URL from webhook
 * @param {string} outputPath - Local file path to save
 */
export async function downloadMedia(mediaUrl, outputPath) {
  try {
    const response = await axios.get(mediaUrl, {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
      responseType: 'stream',
    });

    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log(`✅ Media downloaded to ${outputPath}`);
        resolve(outputPath);
      });
      writer.on('error', reject);
    });
  } catch (error) {
    console.error('❌ Error downloading media:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Mark message as read
 */
export async function markAsRead(messageId) {
  try {
    await axios.post(
      `${getBaseUrl()}/messages/read/${messageId}`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log(`✅ Message ${messageId} marked as read`);
  } catch (error) {
    console.error('❌ Error marking as read:', error.response?.data || error.message);
  }
}
