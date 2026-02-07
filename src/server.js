import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleIncomingMessage } from './handlers/stateMachine.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve audio files statically
app.use('/audio', express.static(path.join(__dirname, '..', 'storage', 'audio')));

// Create storage directory if it doesn't exist
const storagePath = process.env.STORAGE_PATH || './storage';
if (!fs.existsSync(storagePath)) {
  fs.mkdirSync(storagePath, { recursive: true });
  console.log(`✅ Created storage directory: ${storagePath}`);
}

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    service: 'WhatsApp Ecommerce Bot (Pakistan)',
    timestamp: new Date().toISOString(),
  });
});

// WhatsApp Webhook Verification (GET)
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('✅ Webhook verified successfully');
    res.status(200).send(challenge);
  } else if (mode) {
    console.error('❌ Webhook verification failed');
    res.sendStatus(403);
  } else {
    // Whapi.Cloud webhook health check
    res.status(200).json({ status: 'ok' });
  }
});

// WhatsApp Webhook Handler (POST) - Whapi.Cloud format
app.post('/webhook', async (req, res) => {
  // Acknowledge receipt immediately
  res.sendStatus(200);

  try {
    const body = req.body;

    // Debug: log raw payload structure (keys only, to avoid flooding)
    console.log('📨 Webhook payload keys:', Object.keys(body));
    if (body.messages) {
      console.log(`📨 Messages count: ${body.messages.length}`);
    }

    // Whapi.Cloud sends messages as an array
    const messages = body.messages;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.log('⚠️  No messages in webhook payload, raw body:', JSON.stringify(body).substring(0, 500));
      return;
    }

    for (const message of messages) {
      // Skip outgoing messages (from_me = true)
      if (message.from_me) {
        console.log('📤 Outgoing message, skipping');
        continue;
      }

      const from = message.chat_id?.replace('@s.whatsapp.net', '') || message.from;
      const messageId = message.id;
      const timestamp = message.timestamp;

      console.log(`\n📩 Incoming message from ${from} (ID: ${messageId})`);

      // Extract message details based on type
      let messageData = {
        wa_id: from,
        messageId,
        timestamp,
        type: message.type,
      };

      // Debug: log raw message structure for non-text types
      if (message.type !== 'text') {
        console.log(`📨 Raw message (type=${message.type}):`, JSON.stringify(message).substring(0, 800));
      }

      switch (message.type) {
        case 'text':
          messageData.text = message.text?.body || message.text;
          console.log(`📝 Text: "${messageData.text}"`);
          break;

        case 'interactive':
          if (message.interactive?.type === 'button_reply') {
            messageData.interactiveType = 'button_reply';
            messageData.buttonId = message.interactive.button_reply.id;
            messageData.buttonTitle = message.interactive.button_reply.title;
            console.log(`🔘 Button: ${messageData.buttonTitle} (${messageData.buttonId})`);
          } else if (message.interactive?.type === 'list_reply') {
            messageData.interactiveType = 'list_reply';
            messageData.listId = message.interactive.list_reply.id;
            messageData.listTitle = message.interactive.list_reply.title;
            console.log(`📋 List selection: ${messageData.listTitle} (${messageData.listId})`);
          }
          break;

        case 'reply':
          // Whapi.Cloud sends button/list replies as type "reply"
          if (message.reply?.type === 'buttons_reply' && message.reply.buttons_reply) {
            messageData.type = 'interactive';
            messageData.interactiveType = 'button_reply';
            // Button ID comes as "ButtonsV3:buy" — strip the prefix
            messageData.buttonId = message.reply.buttons_reply.id?.replace(/^ButtonsV3:/, '') || '';
            messageData.buttonTitle = message.reply.buttons_reply.title || '';
            console.log(`🔘 Button reply: ${messageData.buttonTitle} (${messageData.buttonId})`);
          } else if (message.reply?.type === 'list_reply' && message.reply.list_reply) {
            messageData.type = 'interactive';
            messageData.interactiveType = 'list_reply';
            messageData.listId = message.reply.list_reply.id?.replace(/^ListV3:/, '') || '';
            messageData.listTitle = message.reply.list_reply.title || '';
            console.log(`📋 List reply: ${messageData.listTitle} (${messageData.listId})`);
          } else {
            console.log(`⚠️  Unknown reply type: ${message.reply?.type}`);
            continue;
          }
          break;

        case 'action':
          // Whapi.Cloud button replies may also come as action type
          // Try to extract button ID from action payload
          if (message.action) {
            const buttonId = message.action.id || message.action.button_id;
            const buttonBody = message.action.body || message.action.title;

            if (buttonId) {
              // Has button ID - treat as interactive button reply
              messageData.type = 'interactive';
              messageData.interactiveType = 'button_reply';
              messageData.buttonId = buttonId;
              messageData.buttonTitle = buttonBody || '';
              console.log(`🔘 Action button: ${messageData.buttonTitle} (${messageData.buttonId})`);
            } else if (buttonBody) {
              // No button ID - convert text to button ID by matching known buttons
              const textLower = buttonBody.toLowerCase().trim();
              let matchedId = null;

              if (textLower.includes('buy') || textLower.includes('خرید')) matchedId = 'buy';
              else if (textLower.includes('next') || textLower.includes('اگل')) matchedId = 'next';
              else if (textLower.includes('agent') || textLower.includes('ایجنٹ')) matchedId = 'agent';
              else if (textLower.includes('easypaisa') || textLower.includes('ایزی')) matchedId = 'payment_easypaisa';
              else if (textLower.includes('cash') || textLower.includes('کیش')) matchedId = 'payment_cod';

              if (matchedId) {
                messageData.type = 'interactive';
                messageData.interactiveType = 'button_reply';
                messageData.buttonId = matchedId;
                messageData.buttonTitle = buttonBody;
                console.log(`🔘 Action mapped to button: ${buttonBody} -> ${matchedId}`);
              } else {
                // Fallback: treat as text
                messageData.type = 'text';
                messageData.text = buttonBody;
                console.log(`🔘 Action as text: "${buttonBody}"`);
              }
            }
          }
          break;

        case 'image':
          messageData.mediaId = message.image?.id;
          messageData.mimeType = message.image?.mime_type;
          messageData.caption = message.image?.caption || '';
          messageData.mediaUrl = message.image?.link;
          if (!messageData.mediaUrl && messageData.mediaId) {
            messageData.mediaUrl = `${process.env.WHAPI_BASE_URL || 'https://gate.whapi.cloud'}/media/${messageData.mediaId}`;
          }
          console.log(`🖼️  Image received (mediaUrl: ${messageData.mediaUrl ? 'yes' : 'missing'})`);
          break;

        case 'audio':
        case 'voice':
        case 'ptt':
          messageData.type = 'audio';
          messageData.mediaId = message.audio?.id || message.voice?.id || message.ptt?.id;
          messageData.mimeType = message.audio?.mime_type || message.voice?.mime_type || message.ptt?.mime_type;
          messageData.mediaUrl = message.audio?.link || message.voice?.link || message.ptt?.link;
          // If no direct link, construct download URL from media ID
          if (!messageData.mediaUrl && messageData.mediaId) {
            messageData.mediaUrl = `${process.env.WHAPI_BASE_URL || 'https://gate.whapi.cloud'}/media/${messageData.mediaId}`;
          }
          console.log(`🎤 Audio/Voice received (mediaUrl: ${messageData.mediaUrl ? 'yes' : 'missing'})`);
          break;

        default:
          console.log(`⚠️  Unsupported message type: ${message.type}`);
          continue;
      }

      // Process message through state machine
      await handleIncomingMessage(messageData);
    }
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    // Don't send error response - already sent 200
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log('\n🚀 WhatsApp Ecommerce Bot Server Started');
    console.log(`📍 Port: ${PORT}`);
    console.log(`🌐 Webhook URL: http://localhost:${PORT}/webhook`);
    console.log(`🔑 Verify Token: ${process.env.WHATSAPP_VERIFY_TOKEN}`);
    console.log('\n⚠️  Remember to expose this server using ngrok or similar service');
    console.log('   Example: ngrok http 3000\n');
  });
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏳ Shutting down gracefully...');
  await mongoose.connection.close();
  console.log('✅ MongoDB connection closed');
  process.exit(0);
});

startServer();
