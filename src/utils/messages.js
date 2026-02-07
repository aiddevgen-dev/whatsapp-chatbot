/**
 * Bilingual message templates
 */

export const MESSAGES = {
  WELCOME: {
    en: `Welcome to ${process.env.BUSINESS_NAME || 'Our Store'}! 🛍️\n\nWe offer the best quality products at amazing prices. Browse our collection below and order directly through WhatsApp — it's quick and easy!\n\n👇 Here's what we have for you:`,
    ur: `${process.env.BUSINESS_NAME || 'ہماری دکان'} میں خوش آمدید! 🛍️\n\nہم بہترین کوالٹی کی مصنوعات حیرت انگیز قیمتوں پر پیش کرتے ہیں۔ نیچے ہماری مصنوعات دیکھیں اور واٹس ایپ پر آسانی سے آرڈر کریں!\n\n👇 آئیے آپ کو دکھاتے ہیں:`,
  },

  PRODUCT_CARD: {
    en: (product) =>
      `📦 *${product.name}*\n\n${product.description}\n\n💰 Price: Rs ${product.price.toLocaleString()}\n📋 SKU: ${product.sku}\n📊 Stock: ${product.stock} units`,
    ur: (product) =>
      `📦 *${product.name_ur || product.name}*\n\n${product.description_ur || product.description}\n\n💰 قیمت: Rs ${product.price.toLocaleString()}\n📋 SKU: ${product.sku}\n📊 اسٹاک: ${product.stock} یونٹس`,
  },

  ASK_QUANTITY: {
    en: 'How many units would you like to order?\n\nPlease select from the list or send a number:',
    ur: 'آپ کتنے یونٹس آرڈر کرنا چاہیں گے؟\n\nبراہِ کرم فہرست سے منتخب کریں یا نمبر بھیجیں:',
  },

  ASK_NAME: {
    en: 'Please provide your full name:',
    ur: 'براہِ کرم اپنا پورا نام فراہم کریں:',
  },

  ASK_PHONE: {
    en: 'Please provide your mobile number:\n\n(Format: 03XXXXXXXXX or +92 3XXXXXXXXX)',
    ur: 'براہِ کرم اپنا موبائل نمبر فراہم کریں:\n\n(فارمیٹ: 03XXXXXXXXX یا \u200E+92 3XXXXXXXXX)',
  },

  ASK_ADDRESS: {
    en: 'Please provide your complete delivery address:\n\n(Include street, area, and city)',
    ur: 'براہِ کرم اپنا مکمل ڈیلیوری پتہ فراہم کریں:\n\n(گلی، علاقہ اور شہر شامل کریں)',
  },

  ASK_PAYMENT_METHOD: {
    en: 'Please select your payment method:',
    ur: 'براہِ کرم ادائیگی کا طریقہ منتخب کریں:',
  },

  EASYPAISA_INSTRUCTIONS: {
    en: (accountName, accountNumber) =>
      `💳 *EasyPaisa Payment Details*\n\n` +
      `Account Name: ${accountName}\n` +
      `Account Number: ${accountNumber}\n\n` +
      `Please send:\n` +
      `1️⃣ Payment screenshot, OR\n` +
      `2️⃣ Transaction ID\n\n` +
      `After payment confirmation, our team will contact you.`,
    ur: (accountName, accountNumber) =>
      `💳 *ایزی پیسہ ادائیگی کی تفصیلات*\n\n` +
      `اکاؤنٹ کا نام: ${accountName}\n` +
      `اکاؤنٹ نمبر: ${accountNumber}\n\n` +
      `براہِ کرم بھیجیں:\n` +
      `1️⃣ ادائیگی کا اسکرین شاٹ، یا\n` +
      `2️⃣ ٹرانزیکشن ID\n\n` +
      `ادائیگی کی تصدیق کے بعد، ہماری ٹیم آپ سے رابطہ کرے گی۔`,
  },

  PAYMENT_RECEIVED: {
    en: (hours) =>
      `✅ Thank you! Your payment information has been received.\n\n` +
      `You will receive a confirmation call within ${hours} hours.\n\n` +
      `Order ID will be shared during the call.`,
    ur: (hours) =>
      `✅ شکریہ! آپ کی ادائیگی کی معلومات موصول ہو گئی ہیں۔\n\n` +
      `آپ کو ${hours} گھنٹوں کے اندر تصدیقی کال موصول ہوگی۔\n\n` +
      `آرڈر ID کال کے دوران شیئر کی جائے گی۔`,
  },

  COD_CONFIRMATION: {
    en: (hours) =>
      `✅ Thank you! Your Cash on Delivery order has been received.\n\n` +
      `You will receive a confirmation call within ${hours} hours.`,
    ur: (hours) =>
      `✅ شکریہ! آپ کا کیش آن ڈیلیوری آرڈر موصول ہو گیا ہے۔\n\n` +
      `آپ کو ${hours} گھنٹوں کے اندر تصدیقی کال موصول ہوگی۔`,
  },

  ORDER_SUMMARY: {
    en: (context, product) =>
      `📋 *Order Summary*\n\n` +
      `Product: ${product.name}\n` +
      `Quantity: ${context.qty}\n` +
      `Price: Rs ${product.price.toLocaleString()} × ${context.qty} = Rs ${(product.price * context.qty).toLocaleString()}\n\n` +
      `Customer: ${context.name}\n` +
      `Phone: ${context.phone}\n` +
      `Address: ${context.address}`,
    ur: (context, product) =>
      `📋 *آرڈر کا خلاصہ*\n\n` +
      `پروڈکٹ: ${product.name}\n` +
      `تعداد: ${context.qty}\n` +
      `قیمت: Rs ${product.price.toLocaleString()} × ${context.qty} = Rs ${(product.price * context.qty).toLocaleString()}\n\n` +
      `کسٹمر: ${context.name}\n` +
      `فون: ${context.phone}\n` +
      `پتہ: ${context.address}`,
  },

  INVALID_INPUT: {
    en: 'Invalid input. Please try again.',
    ur: 'غلط ان پٹ۔ براہِ کرم دوبارہ کوشش کریں۔',
  },

  ERROR_GENERIC: {
    en: 'Sorry, something went wrong. Please try again later.',
    ur: 'معذرت، کچھ غلط ہو گیا۔ براہِ کرم بعد میں دوبارہ کوشش کریں۔',
  },

  SELECT_CATEGORY: {
    en: 'Please select a product category to browse:',
    ur: 'براہِ کرم مصنوعات کی کیٹیگری منتخب کریں:',
  },

  NO_PRODUCTS: {
    en: 'Sorry, no products are currently available. Please check back later.',
    ur: 'معذرت، فی الوقت کوئی پروڈکٹ دستیاب نہیں ہے۔ براہِ کرم بعد میں چیک کریں۔',
  },

  TALK_TO_AGENT: {
    en: 'Please share your phone number so our agent can contact you shortly.',
    ur: 'براہِ کرم اپنا فون نمبر بھیجیں تاکہ ہمارا ایجنٹ آپ سے جلد رابطہ کر سکے۔',
  },

  THANK_YOU_AGENT: {
    en: 'Thank you! Our agent will contact you shortly. Please wait for the call.',
    ur: 'شکریہ! ہمارا ایجنٹ آپ سے جلد رابطہ کرے گا۔ براہِ کرم کال کا انتظار کریں۔',
  },
};

/**
 * Get message in user's preferred language
 */
export function getMessage(key, lang = 'en', ...args) {
  const message = MESSAGES[key];

  if (!message) {
    console.error(`❌ Message key not found: ${key}`);
    return '';
  }

  const text = message[lang] || message.en;

  return typeof text === 'function' ? text(...args) : text;
}

/**
 * Get bilingual message (English + Urdu) separated by a divider
 */
export function getBilingualMessage(key, ...args) {
  const en = getMessage(key, 'en', ...args);
  const ur = getMessage(key, 'ur', ...args);

  return `${en}\n\n─────────────────\n\n${ur}`;
}

/**
 * Audio file map: message key -> audio filename
 */
export const AUDIO_FILES = {
  WELCOME: 'welcome.mp3',
  PRODUCT_CARD: 'product_card.mp3',
  ASK_QUANTITY: 'ask_quantity.mp3',
  ASK_NAME: 'ask_name.mp3',
  ASK_PHONE: 'ask_phone.mp3',
  ASK_ADDRESS: 'ask_address.mp3',
  ASK_PAYMENT_METHOD: 'ask_payment_method.mp3',
  EASYPAISA_INSTRUCTIONS: 'easypaisa_instructions.mp3',
  PAYMENT_RECEIVED: 'payment_received.mp3',
  COD_CONFIRMATION: 'cod_confirmation.mp3',
  ORDER_SUMMARY: 'order_summary.mp3',
  SELECT_CATEGORY: 'select_category.mp3',
  INVALID_INPUT: 'invalid_input.mp3',
  ERROR_GENERIC: 'error_generic.mp3',
  NO_PRODUCTS: 'no_products.mp3',
  TALK_TO_AGENT: 'talk_to_agent.mp3',
  THANK_YOU_AGENT: 'thank_you_agent.mp3',
};

/**
 * Get full audio URL for a message key
 * @param {string} key - Message key (e.g. 'WELCOME')
 * @returns {string|null} Full URL or null if no audio file for key
 */
export function getAudioUrl(key) {
  const filename = AUDIO_FILES[key];
  if (!filename) return null;
  const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
  return `${baseUrl}/audio/${filename}`;
}

/**
 * Button labels
 */
export const BUTTONS = {
  LANGUAGE_EN: { id: 'lang_en', title: { en: 'English', ur: 'English' } },
  LANGUAGE_UR: { id: 'lang_ur', title: { en: 'اردو', ur: 'اردو' } },

  BUY: { id: 'buy', title: { en: 'Buy 🛒', ur: 'خریدیں 🛒' } },
  NEXT_PRODUCT: { id: 'next', title: { en: 'Next Product ➡️', ur: 'اگلا پروڈکٹ ➡️' } },
  TALK_TO_AGENT: { id: 'agent', title: { en: 'Talk to Agent 👤', ur: 'ایجنٹ سے بات کریں 👤' } },

  BACK_TO_CATEGORIES: { id: 'back_categories', title: { en: 'Back to Categories 🔙', ur: 'واپس کیٹیگریز 🔙' } },

  PAYMENT_EASYPAISA: { id: 'payment_easypaisa', title: { en: 'EasyPaisa 💳', ur: 'ایزی پیسہ 💳' } },
  PAYMENT_COD: { id: 'payment_cod', title: { en: 'Cash on Delivery 💵', ur: 'کیش آن ڈیلیوری 💵' } },
};

/**
 * Get button in user's language
 */
export function getButton(key, lang = 'en') {
  const button = BUTTONS[key];
  if (!button) {
    console.error(`❌ Button key not found: ${key}`);
    return { id: '', title: '' };
  }
  return {
    id: button.id,
    title: button.title[lang] || button.title.en,
  };
}
