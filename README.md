# WhatsApp Ecommerce Bot for Pakistan (Whapi.Cloud)

A production-ready WhatsApp ecommerce bot built with Node.js, MongoDB, **Whapi.Cloud API**, and Groq AI. Supports bilingual communication (English/Urdu), voice messages, interactive buttons/lists, and multiple payment methods.

**✨ Uses Whapi.Cloud - NO Meta business verification required! Much easier setup than official Meta API.**

## Features

- ✅ **Bilingual Support**: English and Urdu (اردو)
- ✅ **Voice Messages**: Groq Whisper speech-to-text transcription
- ✅ **Interactive UI**: Buttons and lists for better UX
- ✅ **Smart Field Extraction**: LLM-powered data extraction from free text
- ✅ **Payment Methods**: EasyPaisa and Cash on Delivery
- ✅ **State Machine**: Strict conversation flow management
- ✅ **Media Handling**: Product images, payment screenshots, QR codes
- ✅ **Pakistani Phone Validation**: E.164 format normalization
- ✅ **Easy Setup**: Uses Whapi.Cloud - just scan QR code!

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Database**: MongoDB 7.0 (with Mongoose ODM)
- **WhatsApp**: Whapi.Cloud API (easiest setup!)
- **AI**: Groq API (LLM + Whisper STT)
- **Media**: FFmpeg for audio processing
- **Deployment**: Docker Compose

## Prerequisites

1. **Node.js 20+** - [Download](https://nodejs.org/)
2. **MongoDB** - Use Docker Compose (included) or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
3. **FFmpeg** - [Download](https://ffmpeg.org/download.html)
4. **Whapi.Cloud Account** - [Sign up](https://panel.whapi.cloud) (free trial available)
5. **Groq API Key** - [Sign up](https://console.groq.com/) (free tier available)

## Why Whapi.Cloud?

Compared to Meta's official Cloud API:
- ✅ **No business verification** required
- ✅ **Setup in 5 minutes** vs hours/days with Meta
- ✅ **QR code login** - just scan like WhatsApp Web
- ✅ **Instant activation** - no waiting for approval
- ✅ **Same features** - buttons, lists, media, everything works
- ✅ **Better documentation** and support

## Installation

### 1. Clone and Install Dependencies

```bash
cd whatappautomation
npm install
```

### 2. Install FFmpeg

**Windows:**
```bash
# Using Chocolatey
choco install ffmpeg

# Or download from https://ffmpeg.org/download.html and add to PATH
```

**macOS:**
```bash
brew install ffmpeg
```

**Linux:**
```bash
sudo apt-get update
sudo apt-get install ffmpeg
```

### 3. Set Up MongoDB

Using Docker Compose (recommended):

```bash
docker-compose up -d
```

MongoDB will be available at `mongodb://localhost:27017/whatsapp_ecommerce`

MongoDB Express (Web UI) will be available at `http://localhost:8081`
- Username: `admin`
- Password: `admin123`

### 4. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and fill in your credentials:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/whatsapp_ecommerce

# Whapi.Cloud (get from https://panel.whapi.cloud)
WHAPI_API_TOKEN=your_token_here
WHAPI_BASE_URL=https://gate.whapi.cloud

# Groq API (get from https://console.groq.com)
GROQ_API_KEY=your_groq_api_key_here

# Payment (EasyPaisa)
EASYPAISA_ACCOUNT_NAME=Your Business Name
EASYPAISA_ACCOUNT_NUMBER=03XXXXXXXXX
EASYPAISA_QR_CODE_URL=https://your-domain.com/qr-code.jpg

# Business
BUSINESS_NAME=Your Business Name
SUPPORT_PHONE=+923XXXXXXXXX
```

### 5. Seed Sample Products

```bash
npm run seed
```

This will create 5 sample products in your database.

## Whapi.Cloud Setup (Super Easy!)

### Step 1: Create Account

1. Go to [https://panel.whapi.cloud](https://panel.whapi.cloud)
2. Sign up for free (free trial available)
3. You'll get access to the dashboard

### Step 2: Create a Channel

1. Click "Create Channel"
2. Choose "WhatsApp"
3. Scan the QR code with your WhatsApp mobile app:
   - Open WhatsApp on your phone
   - Go to Settings → Linked Devices
   - Tap "Link a Device"
   - Scan the QR code from Whapi.Cloud dashboard
4. Your WhatsApp is now connected! ✅

### Step 3: Get API Token

1. In your channel settings, find the **API Token**
2. Copy it and paste into your `.env` file as `WHAPI_API_TOKEN`

### Step 4: Set Up Webhook

1. First, expose your local server using ngrok:

```bash
ngrok http 3000
```

2. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

3. In Whapi.Cloud dashboard:
   - Go to your channel settings
   - Find "Webhooks" section
   - Enter webhook URL: `https://abc123.ngrok.io/webhook`
   - Select events: **messages.upsert**
   - Save

That's it! You're ready to go! 🎉

## Running the Bot

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

The server will start on `http://localhost:3000`

## Testing the Bot

1. Send a message to your WhatsApp test number from your personal WhatsApp
2. The bot will respond with language selection
3. Follow the conversation flow:
   - Select language (English/اردو)
   - View products
   - Click "Buy" to start ordering
   - Provide quantity, name, phone, address
   - Select payment method
   - For EasyPaisa: Send payment proof
   - Receive confirmation message

## Conversation Flow

```
START
  ↓
LANGUAGE SELECTION (Buttons: English / اردو)
  ↓
SHOW PRODUCT (Buttons: Buy / Next Product / Talk to Agent)
  ↓
ASK QUANTITY (List: 1-10 or voice/text)
  ↓
ASK NAME (Text or voice)
  ↓
ASK PHONE (Text or voice - validates Pakistani format)
  ↓
ASK ADDRESS (Text or voice)
  ↓
ORDER SUMMARY
  ↓
PAYMENT METHOD (Buttons: EasyPaisa / Cash on Delivery)
  ↓
IF EASYPAISA:
  - Show QR code & account details
  - Wait for payment proof (image or text)
  - Save proof to database
  - Send confirmation: "Call within 1-3 hours"

IF COD:
  - Send confirmation: "Call within 1-3 hours"
  ↓
ORDER COMPLETED → Back to SHOW PRODUCT
```

## Database Models

### Product
```javascript
{
  sku: String,           // Unique product SKU
  name: String,          // Product name
  description: String,   // Product description
  price: Number,         // Price in PKR
  currency: String,      // "PKR"
  imageUrl: String,      // Public image URL
  active: Boolean,       // Is product active?
  stock: Number,         // Available stock
  timestamps: true
}
```

### Conversation
```javascript
{
  wa_id: String,         // WhatsApp ID (unique)
  lang: String,          // "en" | "ur"
  state: String,         // Current state in flow
  context: {
    productSku: String,
    qty: Number,
    name: String,
    phone: String,
    address: String,
    paymentMethod: String
  },
  timestamps: true
}
```

### Order
```javascript
{
  orderId: String,       // Unique order ID
  wa_id: String,         // WhatsApp ID
  productSku: String,
  productName: String,
  productPrice: Number,
  qty: Number,
  totalAmount: Number,
  customer: {
    name: String,
    phone: String,       // E.164 format
    address: String
  },
  paymentMethod: String, // "easypaisa" | "cod"
  status: String,        // "pending_review" | "pending_confirmation" | "confirmed" | "cancelled"
  paymentProof: {
    type: String,        // "text" | "image"
    text: String,
    mediaId: String,
    storedPath: String,
    receivedAt: Date
  },
  timestamps: true
}
```

## API Endpoints

### GET /
Health check endpoint

**Response:**
```json
{
  "status": "running",
  "service": "WhatsApp Ecommerce Bot (Pakistan)",
  "timestamp": "2026-01-31T..."
}
```

### POST /webhook
Whapi.Cloud webhook handler (receives messages)

**Payload:** Whapi.Cloud webhook payload

## Voice Message Support

The bot supports voice messages at ANY step in the conversation:

1. User sends voice message
2. Bot downloads and converts audio to 16kHz mono MP3
3. Groq Whisper transcribes the audio
4. Transcription is processed as text input
5. Bot responds according to current state

**Supported Languages:**
- English
- Urdu

## Adding Products

### Method 1: Using MongoDB Compass or Mongo Express

1. Open MongoDB Compass or Mongo Express (`http://localhost:8081`)
2. Navigate to `whatsapp_ecommerce` database → `products` collection
3. Insert new document:

```json
{
  "sku": "PRODUCT-001",
  "name": "Product Name",
  "description": "Product description here",
  "price": 1999,
  "currency": "PKR",
  "imageUrl": "https://example.com/image.jpg",
  "active": true,
  "stock": 100
}
```

### Method 2: Using Script

Create a file `src/scripts/addProduct.js`:

```javascript
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';

dotenv.config();

const newProduct = {
  sku: 'HOODIE-001',
  name: 'Premium Cotton Hoodie',
  description: 'Warm and comfortable hoodie for winter',
  price: 2999,
  currency: 'PKR',
  imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800',
  active: true,
  stock: 40,
};

async function addProduct() {
  await mongoose.connect(process.env.MONGODB_URI);
  const product = await Product.create(newProduct);
  console.log('✅ Product added:', product);
  await mongoose.connection.close();
}

addProduct();
```

Run: `node src/scripts/addProduct.js`

## Groq API Setup

1. Go to [https://console.groq.com](https://console.groq.com)
2. Sign up for free
3. Create an API key
4. Copy and paste into `.env` as `GROQ_API_KEY`

Groq provides:
- **LLM**: Fast language model for field extraction
- **Whisper STT**: Ultra-fast speech-to-text (216x real-time)

## Security Best Practices

- ✅ Never commit `.env` file to Git
- ✅ Use environment variables for all secrets
- ✅ Validate all user inputs
- ✅ Sanitize phone numbers and addresses before logging
- ✅ Use HTTPS for webhook URL (ngrok provides this)
- ✅ Keep API tokens secure
- ✅ Implement rate limiting for production

## Production Deployment

### Option 1: VPS (DigitalOcean, Linode, AWS EC2)

1. Set up Ubuntu server
2. Install Node.js, MongoDB, FFmpeg
3. Clone repository
4. Configure `.env` with production values
5. Use PM2 for process management:

```bash
npm install -g pm2
pm2 start src/server.js --name whatsapp-bot
pm2 startup
pm2 save
```

6. Set up Nginx reverse proxy with SSL (Let's Encrypt)
7. Update webhook URL in Whapi.Cloud to your domain

### Option 2: Docker

Create `Dockerfile`:

```dockerfile
FROM node:20-alpine

RUN apk add --no-cache ffmpeg

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "src/server.js"]
```

Build and run:

```bash
docker build -t whatsapp-bot .
docker-compose up -d
```

### Option 3: Cloud Platform (Heroku, Railway, Render)

Most cloud platforms support Node.js deployment. Ensure:
- Add FFmpeg buildpack
- Configure environment variables
- Set up MongoDB Atlas for database
- Use persistent storage for media files
- Update webhook URL in Whapi.Cloud

## Troubleshooting

### Webhook not receiving messages

1. Check ngrok is running: `ngrok http 3000`
2. Verify webhook URL in Whapi.Cloud matches ngrok URL
3. Ensure you selected "messages.upsert" event
4. Check server logs for errors
5. Test webhook from Whapi.Cloud dashboard (send test event)

### Audio transcription fails

1. Verify FFmpeg is installed: `ffmpeg -version`
2. Check Groq API key is valid
3. Ensure storage directory has write permissions
4. Check audio file format is supported

### Database connection errors

1. Verify MongoDB is running: `docker-compose ps`
2. Check `MONGODB_URI` in `.env`
3. Ensure MongoDB port 27017 is not blocked
4. Check MongoDB logs: `docker-compose logs mongodb`

### Messages not sending

1. Verify Whapi.Cloud API token in `.env`
2. Check your WhatsApp is still connected (check Whapi.Cloud dashboard)
3. Ensure you're not rate limited
4. Check for errors in server logs

## Whapi.Cloud Pricing

- **Free Trial**: Available to test the service
- **Paid Plans**: Start from $49/month for production use
- **No hidden costs**: Clear pricing, no Meta approval fees

Visit [https://whapi.cloud/pricing](https://whapi.cloud/pricing) for latest pricing.

## Resources

### Documentation
- [Whapi.Cloud Documentation](https://whapi.cloud/)
- [Whapi.Cloud API Docs](https://whapi.cloud/docs)
- [Groq Speech-to-Text Docs](https://console.groq.com/docs/speech-to-text)
- [Groq API Reference](https://console.groq.com/docs/api-reference)

### Tools
- [ngrok](https://ngrok.com/) - Expose local server
- [MongoDB Compass](https://www.mongodb.com/products/compass) - MongoDB GUI
- [Postman](https://www.postman.com/) - API testing

## Comparison: Whapi.Cloud vs Meta Cloud API

| Feature | Whapi.Cloud | Meta Cloud API |
|---------|-------------|----------------|
| Setup Time | 5 minutes | Hours/Days |
| Business Verification | Not required | Required |
| Approval Process | Instant | Can take days |
| Connection Method | QR Code (like WhatsApp Web) | Complex Meta setup |
| Interactive Buttons/Lists | ✅ Yes | ✅ Yes |
| Media Support | ✅ Yes | ✅ Yes |
| Webhooks | ✅ Simple setup | ⚠️ Complex verification |
| Cost | From $49/month | Free tier + costs |
| Support | ✅ Responsive | ⚠️ Limited |

## License

MIT License - See LICENSE file for details

## Support

For issues and questions:
- Whapi.Cloud Support: [https://whapi.cloud/support](https://whapi.cloud/support)
- Contact: ${process.env.SUPPORT_PHONE}

---

Built with ❤️ for Pakistan 🇵🇰

**Powered by [Whapi.Cloud](https://whapi.cloud) - The easiest WhatsApp API**
