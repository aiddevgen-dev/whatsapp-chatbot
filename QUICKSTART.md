# 🚀 Quick Start Guide - WhatsApp Ecommerce Bot

Get your WhatsApp ecommerce bot running in **10 minutes**!

## 📋 Prerequisites Checklist

Before starting, make sure you have:

- [ ] **Node.js 20+** installed ([Download](https://nodejs.org/))
- [ ] **Docker Desktop** installed (for MongoDB) ([Download](https://www.docker.com/products/docker-desktop))
- [ ] **FFmpeg** installed ([Instructions below](#install-ffmpeg))
- [ ] **WhatsApp** on your mobile phone
- [ ] **Internet connection** for API access

## 🛠️ Installation Steps

### Step 1: Install FFmpeg

**Windows (using Chocolatey):**
```bash
choco install ffmpeg
```

**Windows (Manual):**
1. Download from [https://ffmpeg.org/download.html](https://ffmpeg.org/download.html)
2. Extract to `C:\ffmpeg`
3. Add `C:\ffmpeg\bin` to your PATH

**macOS:**
```bash
brew install ffmpeg
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install ffmpeg
```

**Verify FFmpeg installation:**
```bash
ffmpeg -version
```

### Step 2: Install Project Dependencies

Open terminal in the project folder:

```bash
cd h:\whatappautomation
npm install
```

This will install all required packages (~2 minutes).

### Step 3: Start MongoDB Database

```bash
docker-compose up -d
```

**Verify MongoDB is running:**
```bash
docker-compose ps
```

You should see MongoDB container running on port 27017.

**View MongoDB (Optional):**
- Open browser: [http://localhost:8081](http://localhost:8081)
- Login: `admin` / `admin123`

### Step 4: Get Whapi.Cloud API Token

1. **Sign up at Whapi.Cloud:**
   - Go to [https://panel.whapi.cloud](https://panel.whapi.cloud)
   - Click "Sign Up" (free trial available)
   - Verify your email

2. **Create a Channel:**
   - Click "Create Channel"
   - Select "WhatsApp"
   - You'll see a QR code

3. **Connect Your WhatsApp:**
   - Open WhatsApp on your phone
   - Go to **Settings** → **Linked Devices**
   - Tap **"Link a Device"**
   - Scan the QR code from Whapi.Cloud
   - Wait for connection (green checkmark)

4. **Copy API Token:**
   - In Whapi.Cloud dashboard, go to your channel
   - Click **Settings** or **API**
   - Copy the **API Token** (starts with `Bearer` or long string)
   - Save it for next step

### Step 5: Get Groq API Key

1. **Sign up at Groq:**
   - Go to [https://console.groq.com](https://console.groq.com)
   - Click "Sign Up" (free tier available)
   - Verify your email

2. **Create API Key:**
   - Go to **API Keys** section
   - Click **"Create API Key"**
   - Copy the key (starts with `gsk_...`)
   - Save it for next step

### Step 6: Configure Environment Variables

1. **Copy example file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` file:**
   Open `.env` in your text editor and fill in:

   ```env
   # MongoDB (already configured)
   MONGODB_URI=mongodb://localhost:27017/whatsapp_ecommerce

   # Whapi.Cloud - PASTE YOUR TOKEN HERE
   WHAPI_API_TOKEN=your_whapi_token_here
   WHAPI_BASE_URL=https://gate.whapi.cloud

   # Groq API - PASTE YOUR KEY HERE
   GROQ_API_KEY=your_groq_key_here
   GROQ_MODEL=llama-3.3-70b-versatile
   GROQ_WHISPER_MODEL=whisper-large-v3-turbo

   # Payment Details (EasyPaisa)
   EASYPAISA_ACCOUNT_NAME=Your Business Name
   EASYPAISA_ACCOUNT_NUMBER=03001234567
   EASYPAISA_QR_CODE_URL=https://your-domain.com/qr.jpg

   # Business Info
   BUSINESS_NAME=My Store
   SUPPORT_PHONE=+923001234567
   CONFIRMATION_WAIT_HOURS=1-3

   # Storage
   STORAGE_PATH=./storage
   MAX_MEDIA_SIZE_MB=15
   ```

   **Important:** Replace these values:
   - `your_whapi_token_here` → Your Whapi.Cloud API token
   - `your_groq_key_here` → Your Groq API key
   - `Your Business Name` → Your actual business name
   - `03001234567` → Your EasyPaisa number
   - `My Store` → Your store name
   - `+923001234567` → Your support phone number

3. **Save the file** (Ctrl+S)

### Step 7: Seed Sample Products

Load 5 sample products into the database:

```bash
npm run seed
```

You should see:
```
✅ Connected to MongoDB
🗑️  Cleared existing products
✅ Inserted 5 products:
   - TSHIRT-001: Premium Cotton T-Shirt (Rs 1299)
   - JEANS-001: Slim Fit Denim Jeans (Rs 2499)
   - SHOES-001: Casual Sneakers (Rs 3999)
   - WATCH-001: Stainless Steel Watch (Rs 4999)
   - BAG-001: Leather Backpack (Rs 5999)
```

### Step 8: Start the Bot Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

You should see:
```
✅ MongoDB connected successfully
✅ Created storage directory: ./storage
🚀 WhatsApp Ecommerce Bot Server Started (Whapi.Cloud)
📍 Port: 3000
🌐 Webhook URL: http://localhost:3000/webhook
```

**Keep this terminal window open!** The bot is now running.

### Step 9: Expose Server with ngrok

Open a **NEW terminal window** (keep the first one running):

```bash
ngrok http 3000
```

You should see:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:3000
```

**Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

**Keep this terminal window open too!**

### Step 10: Set Up Webhook in Whapi.Cloud

1. Go back to [https://panel.whapi.cloud](https://panel.whapi.cloud)
2. Open your WhatsApp channel
3. Go to **Settings** → **Webhooks**
4. Click **"Add Webhook"** or **"Edit"**
5. Paste your ngrok URL + `/webhook`:
   ```
   https://abc123.ngrok.io/webhook
   ```
6. Select events:
   - ✅ **messages.upsert** (REQUIRED)
7. Click **"Save"** or **"Test"**

## 🎉 Test Your Bot!

1. **Open WhatsApp** on another phone (not the one linked to Whapi.Cloud)
2. **Send a message** to the phone number linked to Whapi.Cloud
3. **The bot should respond** with language selection buttons!

### Test Flow:

```
You: Hi
Bot: Welcome! Please choose language / براہِ کرم زبان منتخب کریں
     [English] [اردو]

You: [Click English]
Bot: [Shows product with image]
     📦 Premium Cotton T-Shirt
     💰 Price: Rs 1,299
     [Buy 🛒] [Next Product ➡️] [Talk to Agent 👤]

You: [Click Buy]
Bot: How many units would you like?
     [Select Quantity] (opens list 1-10)

...and so on!
```

## 📱 Test Voice Messages

1. **Send a voice message** saying "I want to buy"
2. Bot will **transcribe** it and process as text
3. Works in **English and Urdu**!

## 🔍 Monitoring

### Check Server Logs

In the terminal where bot is running, you'll see:
```
📩 Incoming message from 923001234567 (ID: msg_123)
📝 Text: "Hi"
✅ Language set to en for 923001234567
✅ Text sent to 923001234567
```

### Check MongoDB

Visit [http://localhost:8081](http://localhost:8081) to view:
- **products** collection (5 sample products)
- **conversations** collection (user states)
- **orders** collection (completed orders)

### Check Whapi.Cloud Dashboard

Visit [https://panel.whapi.cloud](https://panel.whapi.cloud) to:
- See message logs
- Check connection status
- Monitor webhook deliveries

## ⚠️ Troubleshooting

### Bot not responding to messages?

**Check 1: Is server running?**
```bash
# Look for this in terminal:
🚀 WhatsApp Ecommerce Bot Server Started
```

**Check 2: Is ngrok running?**
```bash
# Look for this in second terminal:
Forwarding  https://abc123.ngrok.io -> http://localhost:3000
```

**Check 3: Is webhook configured?**
- Go to Whapi.Cloud → Settings → Webhooks
- URL should be: `https://your-ngrok-url.ngrok.io/webhook`
- Event: `messages.upsert` should be checked

**Check 4: Is WhatsApp connected?**
- Go to Whapi.Cloud dashboard
- Channel status should be green/online
- If disconnected, rescan QR code

**Check 5: Check logs**
Look for errors in the terminal where bot is running.

### FFmpeg errors?

```bash
# Test FFmpeg
ffmpeg -version

# If not found, reinstall FFmpeg
# Windows: choco install ffmpeg
# Mac: brew install ffmpeg
# Linux: sudo apt install ffmpeg
```

### MongoDB errors?

```bash
# Check if MongoDB is running
docker-compose ps

# Restart MongoDB
docker-compose restart

# View logs
docker-compose logs mongodb
```

### Groq API errors?

- Check API key is correct in `.env`
- Visit [https://console.groq.com](https://console.groq.com)
- Verify API key is active
- Check usage limits

### ngrok session expired?

**Free ngrok URLs expire after 2 hours.**

Solution:
1. Stop ngrok (Ctrl+C)
2. Restart: `ngrok http 3000`
3. Get NEW URL
4. Update webhook in Whapi.Cloud with new URL

**Better solution:** Get ngrok free account for persistent URLs:
```bash
ngrok authtoken YOUR_TOKEN
```

## 🛑 Stopping the Bot

1. **Stop server:** Press `Ctrl+C` in first terminal
2. **Stop ngrok:** Press `Ctrl+C` in second terminal
3. **Stop MongoDB (optional):**
   ```bash
   docker-compose down
   ```

## 🔄 Restarting the Bot

**Next time you want to run it:**

1. Start MongoDB (if stopped):
   ```bash
   docker-compose up -d
   ```

2. Start server:
   ```bash
   npm run dev
   ```

3. Start ngrok (new terminal):
   ```bash
   ngrok http 3000
   ```

4. Update webhook URL in Whapi.Cloud (if ngrok URL changed)

## 📝 Adding Your Own Products

### Method 1: Using MongoDB Express (Easy)

1. Open [http://localhost:8081](http://localhost:8081)
2. Login: `admin` / `admin123`
3. Database: `whatsapp_ecommerce` → Collection: `products`
4. Click **"New Document"**
5. Paste this template (modify values):
   ```json
   {
     "sku": "PRODUCT-001",
     "name": "Your Product Name",
     "description": "Product description here",
     "price": 1999,
     "currency": "PKR",
     "imageUrl": "https://example.com/image.jpg",
     "active": true,
     "stock": 100
   }
   ```
6. Click **"Save"**

### Method 2: Edit seed file

Edit `src/scripts/seedProducts.js` and run:
```bash
npm run seed
```

## 💡 Tips

### Free Image Hosting
- **Unsplash**: [https://unsplash.com](https://unsplash.com) (free stock photos)
- **Imgur**: [https://imgur.com](https://imgur.com) (free image hosting)
- **Cloudinary**: Free tier for product images

### EasyPaisa QR Code
1. Ask your bank for QR code image
2. Upload to Imgur or similar
3. Use public URL in `.env`

### Testing Without Orders
Comment out the payment proof section to test full flow without actual payments.

## 📚 Next Steps

- **Add more products** (see above)
- **Customize messages** in `src/utils/messages.js`
- **Change button labels** in `src/utils/messages.js`
- **Add more languages** (contact me for help)
- **Deploy to production** (see README.md)

## 🆘 Need Help?

1. **Check server logs** for error messages
2. **Check Whapi.Cloud logs** in dashboard
3. **Review README.md** for detailed documentation
4. **Test each component separately** (MongoDB, server, ngrok, webhook)

## ✅ Success Checklist

- [ ] FFmpeg installed and working
- [ ] Node.js dependencies installed
- [ ] MongoDB running via Docker
- [ ] Whapi.Cloud account created
- [ ] WhatsApp connected (QR code scanned)
- [ ] Groq API key obtained
- [ ] `.env` file configured correctly
- [ ] Sample products seeded
- [ ] Server started (port 3000)
- [ ] ngrok running and public URL obtained
- [ ] Webhook configured in Whapi.Cloud
- [ ] Test message received and bot responded
- [ ] Voice message test successful

## 🎯 What You Built

You now have a **production-ready** WhatsApp bot that:
- Handles customer conversations in **English and Urdu**
- Shows products with **images and buttons**
- Takes orders with **voice or text**
- Validates **Pakistani phone numbers**
- Collects **payment proof**
- Stores everything in **MongoDB**
- Uses **AI for voice transcription** and field extraction

**Congratulations!** 🎉

---

**Need more help?** Check the full [README.md](README.md) for detailed documentation.

**Built with ❤️ for Pakistan** 🇵🇰
