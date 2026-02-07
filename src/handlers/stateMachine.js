
import Conversation from '../models/Conversation.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import { sendText, sendButtons, sendList, sendImage, sendAudio } from '../whatsapp.js';
import { processVoiceMessage, savePaymentProof } from '../services/media.js';
import { transcribeAudio, detectLanguage, extractField, cleanupTranscription } from '../services/groq.js';
import {
  validatePakistaniPhone,
  validateQuantity,
  validateName,
  validateAddress,
} from '../utils/validators.js';
import { getBilingualMessage, getButton, getAudioUrl } from '../utils/messages.js';

/**
 * Send an audio message for a given message key (graceful no-op if no audio file)
 */
async function sendWithAudio(wa_id, audioKey) {
  const url = getAudioUrl(audioKey);
  if (!url) return;
  try {
    await sendAudio(wa_id, url);
  } catch (err) {
    console.error(`⚠️  Failed to send audio for ${audioKey}:`, err.message);
  }
}

/**
 * Main handler for incoming messages
 */
export async function handleIncomingMessage(messageData) {
  const { wa_id, type } = messageData;

  try {
    // Get or create conversation
    const conversation = await Conversation.getOrCreate(wa_id);

    // Process voice/audio messages (including 'ptt' type from Whapi.Cloud)
    if (type === 'audio' || type === 'voice' || type === 'ptt') {
      console.log('🎤 Processing voice message...');

      // Download and convert audio
      const audioPath = await processVoiceMessage(messageData.mediaUrl, wa_id);

      // Build Whisper prompt hint based on current state
      const whisperPrompts = {
        ASKING_ADDRESS: 'میرا پتہ ہے مکان نمبر 5، گلی نمبر 3، بلاک B، ڈیفنس فیز 2، لاہور۔ محلہ، علاقہ، کالونی، سوسائٹی، ٹاؤن، روڈ، بازار، سیکٹر، کراچی، اسلام آباد، راولپنڈی، فیصل آباد، ملتان، پشاور، گوجرانوالہ، سیالکوٹ، حیدرآباد، ساہیوال، بہاولپور',
        ASKING_NAME: 'My name is Muhammad Ali Khan. Wasif, Wasi, Ahmed, Hassan, Hussain, Umar, Usman, Bilal, Tariq, Imran, Fatima, Ayesha, Zainab, Maryam, Raza, Iqbal, Shah, Malik, Chaudhry, Butt, Rajput, Sheikh, Syed, Qureshi, Ansari, Abbasi, Abdullah, Naeem, Rasool, Rahman',
        ASKING_PHONE: 'میرا نمبر ہے صفر تین صفر صفر ایک دو تین چار پانچ چھ سات۔ 03001234567، 03211234567، 03331234567، 03451234567، صفر، ایک، دو، تین، چار، پانچ، چھ، سات، آٹھ، نو، فون نمبر، موبائل نمبر',
        ASKING_QUANTITY: 'مجھے ایک چاہیے۔ ایک، دو، تین، چار، پانچ، چھ، سات، آٹھ، نو، دس، یونٹ، عدد',
      };
      const whisperPrompt = whisperPrompts[conversation.state] || null;

      // Transcribe with Groq Whisper
      let transcription;
      let cleanedText;

      if (conversation.state === 'ASKING_NAME') {
        // Dual transcription for names — try both English and Urdu, let LLM pick the best
        const [enTranscription, urTranscription] = await Promise.all([
          transcribeAudio(audioPath, 'en', whisperPrompt),
          transcribeAudio(audioPath, 'ur', whisperPrompt),
        ]);
        console.log(`📝 Name transcription (EN): "${enTranscription}"`);
        console.log(`📝 Name transcription (UR): "${urTranscription}"`);

        // Let LLM pick the best name from both transcriptions
        cleanedText = await cleanupTranscription(`English: ${enTranscription}\nUrdu: ${urTranscription}`, 'name');
        transcription = enTranscription;
      } else {
        const languageCode = conversation.lang === 'ur' ? 'ur' : 'en';
        transcription = await transcribeAudio(audioPath, languageCode, whisperPrompt);
        console.log(`📝 Raw transcription: "${transcription}"`);

        // LLM cleanup based on current state
        const stateToField = {
          ASKING_PHONE: 'phone',
          ASKING_ADDRESS: 'address',
          ASKING_QUANTITY: 'quantity',
        };
        const fieldType = stateToField[conversation.state];
        cleanedText = fieldType
          ? await cleanupTranscription(transcription, fieldType)
          : transcription;
      }

      console.log(`📝 Final text: "${cleanedText}"`);

      // Replace message data with cleaned transcription
      messageData.type = 'text';
      messageData.text = cleanedText;
    }

    // Detect greeting messages — only reset if not in the middle of an order flow
    const orderStates = ['ASKING_QUANTITY', 'ASKING_NAME', 'ASKING_PHONE', 'ASKING_ADDRESS', 'ASKING_PAYMENT_METHOD', 'WAITING_PAYMENT_PROOF'];
    if (messageData.type === 'text' && !orderStates.includes(conversation.state)) {
      const greetings = ['wwwwaaa'];
      const text = messageData.text.trim().toLowerCase();
      if (greetings.some(g => text === g || text.startsWith(g + ' '))) {
        conversation.lang = null;
        conversation.state = 'LANGUAGE_SELECTION';
        conversation.resetContext();
        await conversation.save();

        // Send welcome message + language selection buttons
        await sendLanguageSelection(wa_id);
        return;
      }
    }

    // Route to appropriate state handler
    await routeToStateHandler(conversation, messageData);

  } catch (error) {
    console.error('❌ State machine error:', error);

    // Send generic error message
    try {
      const conv = await Conversation.findOne({ wa_id });
      const lang = conv?.lang || 'en';
      await sendText(wa_id, getBilingualMessage('ERROR_GENERIC'));
      await sendWithAudio(wa_id, 'ERROR_GENERIC');
    } catch (e) {
      console.error('❌ Error sending error message:', e);
    }
  }
}

/**
 * Route to appropriate state handler
 */
async function routeToStateHandler(conversation, messageData) {
  const handlers = {
    LANGUAGE_SELECTION: handleLanguageSelection,
    SHOWING_PRODUCT: handleProductView,
    ASKING_QUANTITY: handleQuantityInput,
    ASKING_NAME: handleNameInput,
    ASKING_PHONE: handlePhoneInput,
    ASKING_ADDRESS: handleAddressInput,
    ASKING_PAYMENT_METHOD: handlePaymentMethod,
    WAITING_PAYMENT_PROOF: handlePaymentProof,
    WAITING_FOR_AGENT: handleWaitingForAgent,
  };

  const handler = handlers[conversation.state];

  if (handler) {
    await handler(conversation, messageData);
  } else {
    console.error(`❌ Unknown state: ${conversation.state}`);
    await handleLanguageSelection(conversation, messageData);
  }
}

/**
 * STATE: LANGUAGE_SELECTION
 */
async function handleLanguageSelection(conversation, messageData) {
  const { wa_id, type } = messageData;

  // Handle button response (language chosen)
  if (type === 'interactive' && messageData.interactiveType === 'button_reply') {
    const buttonId = messageData.buttonId;

    if (buttonId === 'lang_en') {
      conversation.lang = 'en';
    } else if (buttonId === 'lang_ur') {
      conversation.lang = 'ur';
    } else {
      await sendLanguageSelection(wa_id);
      return;
    }

    conversation.state = 'SHOWING_PRODUCT';
    await conversation.save();

    console.log(`✅ Language set to ${conversation.lang} for ${wa_id}`);

    // Show first product
    await handleProductView(conversation, messageData);
    return;
  }

  // Ignore any other input — only respond to greeting or button press
  return;
}

async function sendLanguageSelection(wa_id) {
  await sendButtons(
    wa_id,
    getBilingualMessage('WELCOME'),
    [
      getButton('LANGUAGE_EN', 'en'),
      getButton('LANGUAGE_UR', 'ur'),
    ]
  );
  await sendWithAudio(wa_id, 'WELCOME');
}

/**
 * STATE: SHOWING_PRODUCT
 */
async function handleProductView(conversation, messageData) {
  const { wa_id, type } = messageData;
  const lang = conversation.lang;

  // Handle button responses
  if (type === 'interactive' && messageData.interactiveType === 'button_reply') {
    const buttonId = messageData.buttonId;

    if (buttonId === 'buy') {
      // Move to quantity selection
      conversation.state = 'ASKING_QUANTITY';
      await conversation.save();
      await sendQuantitySelection(wa_id, lang);
      return;
    }

    if (buttonId === 'next') {
      // Show next product
      const nextProduct = await Product.getNextProduct(conversation.context.productSku);

      if (!nextProduct) {
        await sendText(wa_id, getBilingualMessage('NO_PRODUCTS'));
        await sendWithAudio(wa_id, 'NO_PRODUCTS');
        return;
      }

      conversation.context.productSku = nextProduct.sku;
      await conversation.save();
      await sendProductCard(wa_id, nextProduct, lang);
      return;
    }

    if (buttonId === 'agent') {
      conversation.state = 'WAITING_FOR_AGENT';
      await conversation.save();

      await sendText(wa_id, getBilingualMessage('TALK_TO_AGENT'));
      await sendWithAudio(wa_id, 'TALK_TO_AGENT');
      return;
    }
  }

  // Ignore non-button messages (text, voice, etc.) — only buttons navigate products
  if (type !== 'interactive') {
    return;
  }

  // Show current or first product
  let product;

  if (conversation.context.productSku) {
    product = await Product.findOne({ sku: conversation.context.productSku, active: true });
  }

  if (!product) {
    product = await Product.getNextProduct(null);
  }

  if (!product) {
    await sendText(wa_id, getBilingualMessage('NO_PRODUCTS'));
    await sendWithAudio(wa_id, 'NO_PRODUCTS');
    return;
  }

  conversation.context.productSku = product.sku;
  await conversation.save();

  await sendProductCard(wa_id, product, lang);
}

async function sendProductCard(wa_id, product, lang) {
  // Send product image with caption
  await sendImage(
    wa_id,
    product.imageUrl,
    getBilingualMessage('PRODUCT_CARD', product)
  );

  // Send action buttons
  await sendButtons(
    wa_id,
    'What would you like to do?\n\n─────────────────\n\nآپ کیا کرنا چاہیں گے؟',
    [
      getButton('BUY', lang),
      getButton('NEXT_PRODUCT', lang),
      getButton('TALK_TO_AGENT', lang),
    ]
  );
  await sendWithAudio(wa_id, 'PRODUCT_CARD');
}

/**
 * STATE: ASKING_QUANTITY
 */
async function handleQuantityInput(conversation, messageData) {
  const { wa_id, type } = messageData;
  const lang = conversation.lang;
  let quantity = null;

  // Handle list selection
  if (type === 'interactive' && messageData.interactiveType === 'list_reply') {
    const listId = messageData.listId;
    quantity = parseInt(listId.replace('qty_', ''), 10);
  }

  // Handle text input
  if (type === 'text') {
    quantity = validateQuantity(messageData.text);

    // If validation fails, try LLM extraction
    if (!quantity) {
      quantity = await extractField(messageData.text, 'quantity', lang);
    }
  }

  if (!quantity) {
    await sendText(wa_id, getBilingualMessage('INVALID_INPUT'));
    await sendWithAudio(wa_id, 'INVALID_INPUT');
    await sendQuantitySelection(wa_id, lang);
    return;
  }

  // Save quantity
  conversation.context.qty = quantity;
  conversation.state = 'ASKING_NAME';
  await conversation.save();

  console.log(`✅ Quantity set to ${quantity} for ${wa_id}`);

  // Ask for name
  await sendText(wa_id, getBilingualMessage('ASK_NAME'));
  await sendWithAudio(wa_id, 'ASK_NAME');
}

async function sendQuantitySelection(wa_id, lang) {
  const rows = [];
  for (let i = 1; i <= 10; i++) {
    rows.push({
      id: `qty_${i}`,
      title: `${i}`,
      description: lang === 'en' ? `${i} unit${i > 1 ? 's' : ''}` : `${i} یونٹ`,
    });
  }

  await sendList(
    wa_id,
    getBilingualMessage('ASK_QUANTITY'),
    lang === 'en' ? 'Select Quantity' : 'تعداد منتخب کریں',
    rows,
    null,
    null,
    lang === 'en' ? 'Quantity' : 'تعداد'
  );
  await sendWithAudio(wa_id, 'ASK_QUANTITY');
}

/**
 * STATE: ASKING_NAME
 */
async function handleNameInput(conversation, messageData) {
  const { wa_id, type } = messageData;
  const lang = conversation.lang;

  if (type !== 'text') {
    await sendText(wa_id, getBilingualMessage('INVALID_INPUT'));
    await sendWithAudio(wa_id, 'INVALID_INPUT');
    await sendText(wa_id, getBilingualMessage('ASK_NAME'));
    await sendWithAudio(wa_id, 'ASK_NAME');
    return;
  }

  let name = validateName(messageData.text);

  // Try LLM extraction if validation fails
  if (!name) {
    name = await extractField(messageData.text, 'name', lang);
    name = validateName(name);
  }

  if (!name) {
    await sendText(wa_id, getBilingualMessage('INVALID_INPUT'));
    await sendWithAudio(wa_id, 'INVALID_INPUT');
    await sendText(wa_id, getBilingualMessage('ASK_NAME'));
    await sendWithAudio(wa_id, 'ASK_NAME');
    return;
  }

  conversation.context.name = name;
  conversation.state = 'ASKING_PHONE';
  await conversation.save();

  console.log(`✅ Name set to "${name}" for ${wa_id}`);

  // Ask for phone
  await sendText(wa_id, getBilingualMessage('ASK_PHONE'));
  await sendWithAudio(wa_id, 'ASK_PHONE');
}

/**
 * STATE: ASKING_PHONE
 */
async function handlePhoneInput(conversation, messageData) {
  const { wa_id, type } = messageData;
  const lang = conversation.lang;

  if (type !== 'text') {
    await sendText(wa_id, getBilingualMessage('INVALID_INPUT'));
    await sendWithAudio(wa_id, 'INVALID_INPUT');
    await sendText(wa_id, getBilingualMessage('ASK_PHONE'));
    await sendWithAudio(wa_id, 'ASK_PHONE');
    return;
  }

  let phone = validatePakistaniPhone(messageData.text);

  // Try LLM extraction if validation fails
  if (!phone) {
    const extracted = await extractField(messageData.text, 'phone', lang);
    phone = validatePakistaniPhone(extracted);
  }

  if (!phone) {
    await sendText(wa_id, getBilingualMessage('INVALID_INPUT'));
    await sendWithAudio(wa_id, 'INVALID_INPUT');
    await sendText(wa_id, getBilingualMessage('ASK_PHONE'));
    await sendWithAudio(wa_id, 'ASK_PHONE');
    return;
  }

  conversation.context.phone = phone;
  conversation.state = 'ASKING_ADDRESS';
  await conversation.save();

  console.log(`✅ Phone set to ${phone} for ${wa_id}`);

  // Ask for address
  await sendText(wa_id, getBilingualMessage('ASK_ADDRESS'));
  await sendWithAudio(wa_id, 'ASK_ADDRESS');
}

/**
 * STATE: ASKING_ADDRESS
 */
async function handleAddressInput(conversation, messageData) {
  const { wa_id, type } = messageData;
  const lang = conversation.lang;

  if (type !== 'text') {
    await sendText(wa_id, getBilingualMessage('INVALID_INPUT'));
    await sendWithAudio(wa_id, 'INVALID_INPUT');
    await sendText(wa_id, getBilingualMessage('ASK_ADDRESS'));
    await sendWithAudio(wa_id, 'ASK_ADDRESS');
    return;
  }

  let address = validateAddress(messageData.text);

  // Try LLM extraction if validation fails
  if (!address) {
    const extracted = await extractField(messageData.text, 'address', lang);
    address = validateAddress(extracted);
  }

  if (!address) {
    await sendText(wa_id, getBilingualMessage('INVALID_INPUT'));
    await sendWithAudio(wa_id, 'INVALID_INPUT');
    await sendText(wa_id, getBilingualMessage('ASK_ADDRESS'));
    await sendWithAudio(wa_id, 'ASK_ADDRESS');
    return;
  }

  conversation.context.address = address;
  conversation.state = 'ASKING_PAYMENT_METHOD';
  await conversation.save();

  console.log(`✅ Address set for ${wa_id}`);

  // Show order summary and ask for payment method
  const product = await Product.findOne({ sku: conversation.context.productSku });
  await sendText(wa_id, getBilingualMessage('ORDER_SUMMARY', conversation.context, product));
  await sendWithAudio(wa_id, 'ORDER_SUMMARY');

  await sendButtons(
    wa_id,
    getBilingualMessage('ASK_PAYMENT_METHOD'),
    [
      getButton('PAYMENT_EASYPAISA', lang),
      getButton('PAYMENT_COD', lang),
    ]
  );
  await sendWithAudio(wa_id, 'ASK_PAYMENT_METHOD');
}

/**
 * STATE: ASKING_PAYMENT_METHOD
 */
async function handlePaymentMethod(conversation, messageData) {
  const { wa_id, type } = messageData;
  const lang = conversation.lang;

  if (type !== 'interactive' || messageData.interactiveType !== 'button_reply') {
    await sendButtons(
      wa_id,
      getBilingualMessage('ASK_PAYMENT_METHOD'),
      [
        getButton('PAYMENT_EASYPAISA', lang),
        getButton('PAYMENT_COD', lang),
      ]
    );
    await sendWithAudio(wa_id, 'ASK_PAYMENT_METHOD');
    return;
  }

  const buttonId = messageData.buttonId;

  if (buttonId === 'payment_easypaisa') {
    conversation.context.paymentMethod = 'easypaisa';
    conversation.state = 'WAITING_PAYMENT_PROOF';
    await conversation.save();

    console.log(`✅ Payment method: EasyPaisa for ${wa_id}`);

    // Send EasyPaisa QR code if configured with a real URL
    const qrUrl = process.env.EASYPAISA_QR_CODE_URL;
    if (qrUrl && !qrUrl.includes('your-domain.com')) {
      await sendImage(
        wa_id,
        process.env.EASYPAISA_QR_CODE_URL,
        getBilingualMessage('EASYPAISA_INSTRUCTIONS',
          process.env.EASYPAISA_ACCOUNT_NAME,
          process.env.EASYPAISA_ACCOUNT_NUMBER
        )
      );
    } else {
      await sendText(
        wa_id,
        getBilingualMessage('EASYPAISA_INSTRUCTIONS',
          process.env.EASYPAISA_ACCOUNT_NAME,
          process.env.EASYPAISA_ACCOUNT_NUMBER
        )
      );
    }
    await sendWithAudio(wa_id, 'EASYPAISA_INSTRUCTIONS');
    return;
  }

  if (buttonId === 'payment_cod') {
    conversation.context.paymentMethod = 'cod';
    await conversation.save();

    console.log(`✅ Payment method: COD for ${wa_id}`);

    // Create order
    await createOrder(conversation, null);

    // Send confirmation
    await sendText(
      wa_id,
      getBilingualMessage('COD_CONFIRMATION', process.env.CONFIRMATION_WAIT_HOURS || '1-3')
    );
    await sendWithAudio(wa_id, 'COD_CONFIRMATION');

    // Reset conversation
    await conversation.completeOrder();
    return;
  }

  // Invalid button
  await sendButtons(
    wa_id,
    getBilingualMessage('ASK_PAYMENT_METHOD'),
    [
      getButton('PAYMENT_EASYPAISA', lang),
      getButton('PAYMENT_COD', lang),
    ]
  );
  await sendWithAudio(wa_id, 'ASK_PAYMENT_METHOD');
}

/**
 * STATE: WAITING_PAYMENT_PROOF
 */
async function handlePaymentProof(conversation, messageData) {
  const { wa_id, type } = messageData;
  const lang = conversation.lang;

  let paymentProof = {};

  // Handle image (screenshot)
  if (type === 'image') {
    console.log('📸 Payment proof image received');

    const storedPath = await savePaymentProof(messageData.mediaUrl, wa_id);

    paymentProof = {
      type: 'image',
      mediaUrl: messageData.mediaUrl,
      storedPath,
      receivedAt: new Date(),
    };
  }
  // Handle text (transaction ID)
  else if (type === 'text') {
    console.log('📝 Payment proof text received');

    paymentProof = {
      type: 'text',
      text: messageData.text,
      receivedAt: new Date(),
    };
  }
  else {
    await sendText(wa_id, getBilingualMessage('INVALID_INPUT'));
    await sendWithAudio(wa_id, 'INVALID_INPUT');
    return;
  }

  // Create order with payment proof
  await createOrder(conversation, paymentProof);

  // Send confirmation
  await sendText(
    wa_id,
    getBilingualMessage('PAYMENT_RECEIVED', process.env.CONFIRMATION_WAIT_HOURS || '1-3')
  );
  await sendWithAudio(wa_id, 'PAYMENT_RECEIVED');

  // Reset conversation
  await conversation.completeOrder();
}

/**
 * STATE: WAITING_FOR_AGENT
 */
async function handleWaitingForAgent(conversation, messageData) {
  const { wa_id, type } = messageData;

  if (type !== 'text') {
    await sendText(wa_id, getBilingualMessage('TALK_TO_AGENT'));
    await sendWithAudio(wa_id, 'TALK_TO_AGENT');
    return;
  }

  const phone = validatePakistaniPhone(messageData.text);

  if (!phone) {
    await sendText(wa_id, getBilingualMessage('INVALID_INPUT'));
    await sendWithAudio(wa_id, 'INVALID_INPUT');
    await sendText(wa_id, getBilingualMessage('TALK_TO_AGENT'));
    await sendWithAudio(wa_id, 'TALK_TO_AGENT');
    return;
  }

  console.log(`✅ Agent request: phone ${phone} from ${wa_id}`);

  // Send thank you and reset to product view
  await sendText(wa_id, getBilingualMessage('THANK_YOU_AGENT'));
  await sendWithAudio(wa_id, 'THANK_YOU_AGENT');

  conversation.state = 'SHOWING_PRODUCT';
  await conversation.save();
}

/**
 * Create order in database
 */
async function createOrder(conversation, paymentProof) {
  const { wa_id, context } = conversation;
  const product = await Product.findOne({ sku: context.productSku });

  if (!product) {
    throw new Error('Product not found');
  }

  const order = new Order({
    orderId: Order.generateOrderId(),
    wa_id,
    productSku: product.sku,
    productName: product.name,
    productPrice: product.price,
    qty: context.qty,
    totalAmount: product.price * context.qty,
    customer: {
      name: context.name,
      phone: context.phone,
      address: context.address,
    },
    paymentMethod: context.paymentMethod,
    status: context.paymentMethod === 'easypaisa' ? 'pending_review' : 'pending_confirmation',
    paymentProof: paymentProof || undefined,
  });

  await order.save();

  console.log(`✅ Order created: ${order.orderId} for ${wa_id}`);

  return order;
}
