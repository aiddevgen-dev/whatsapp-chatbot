import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const getApiKey = () => process.env.GROQ_API_KEY;
const getModel = () => process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const getWhisperModel = () => process.env.GROQ_WHISPER_MODEL || 'whisper-large-v3-turbo';

/**
 * Chat completion with Groq LLM
 * @param {Array} messages - Array of {role, content} objects
 * @param {number} temperature - Temperature (0-1)
 * @param {boolean} jsonMode - Force JSON response
 */
export async function chatCompletion(messages, temperature = 0.3, jsonMode = true) {
  try {
    const payload = {
      model: getModel(),
      messages,
      temperature,
    };

    if (jsonMode) {
      payload.response_format = { type: 'json_object' };
      // Ensure system message mentions JSON
      if (messages[0]?.role === 'system') {
        if (!messages[0].content.toLowerCase().includes('json')) {
          messages[0].content += '\n\nYou MUST respond with valid JSON only.';
        }
      } else {
        messages.unshift({
          role: 'system',
          content: 'You are a helpful assistant. You MUST respond with valid JSON only.',
        });
      }
    }

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      payload,
      {
        headers: {
          'Authorization': `Bearer ${getApiKey()}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const content = response.data.choices[0].message.content;
    console.log('✅ Groq LLM response received');

    return jsonMode ? JSON.parse(content) : content;
  } catch (error) {
    console.error('❌ Groq chat completion error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Transcribe audio using Groq Whisper
 * @param {string} audioFilePath - Path to audio file
 * @param {string} language - ISO-639-1 language code (optional, e.g., 'en', 'ur')
 * @param {string} prompt - Optional prompt hint to guide transcription accuracy
 */
export async function transcribeAudio(audioFilePath, language = null, prompt = null) {
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(audioFilePath));
    formData.append('model', getWhisperModel());
    formData.append('response_format', 'json');
    formData.append('temperature', '0');

    if (language) {
      formData.append('language', language);
    }

    if (prompt) {
      formData.append('prompt', prompt);
    }

    const response = await axios.post(
      'https://api.groq.com/openai/v1/audio/transcriptions',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${getApiKey()}`,
          ...formData.getHeaders(),
        },
      }
    );

    const transcription = response.data.text;
    console.log(`✅ Audio transcribed: "${transcription}"`);
    return transcription;
  } catch (error) {
    console.error('❌ Groq transcription error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Detect language from text
 */
export async function detectLanguage(text) {
  try {
    const result = await chatCompletion([
      {
        role: 'system',
        content: 'Detect the language of the user message. Respond with JSON: {"language": "en"} for English or {"language": "ur"} for Urdu/Pakistani languages.',
      },
      {
        role: 'user',
        content: text,
      },
    ]);

    return result.language === 'ur' ? 'ur' : 'en';
  } catch (error) {
    console.error('❌ Language detection error:', error);
    return 'en'; // Default to English
  }
}

/**
 * Extract structured data from free text
 * @param {string} text - User input
 * @param {string} field - Field to extract (name, phone, address, quantity)
 * @param {string} language - User's language preference
 */
export async function extractField(text, field, language = 'en') {
  try {
    let systemPrompt = '';

    switch (field) {
      case 'name':
        systemPrompt = `Extract the person's full name from the text. The text may be a voice transcription in Urdu or English of a Pakistani person's name. Common Pakistani names include Muhammad, Ali, Ahmed, Hassan, Hussain, Umar, Usman, Bilal, Tariq, Imran, Fatima, Ayesha, Zainab, Maryam, Khan, Raza, Iqbal, Shah, Malik, Chaudhry, Butt, Rajput, Sheikh, Syed, Qureshi. Fix any obvious transcription errors. Respond with JSON: {"name": "extracted name"} or {"name": null} if not found.`;
        break;

      case 'phone':
        systemPrompt = `Extract Pakistani mobile phone number from the text. The text may be a voice transcription in Urdu where numbers are spoken as words. Convert Urdu number words to digits: صفر=0, ایک=1, دو=2, تین/تن=3, چار=4, پانچ=5, چھ/چھے=6, سات=7, آٹھ=8, نو=9. Also handle English words: zero=0, one=1, two=2, three=3, four=4, five=5, six=6, seven=7, eight=8, nine=9. Look for formats like 03XXXXXXXXX or +923XXXXXXXXX or 92 3XXXXXXXXX. Pakistani mobile numbers always start with 03. Respond with JSON: {"phone": "03XXXXXXXXX"} or {"phone": null} if not found.`;
        break;

      case 'address':
        systemPrompt = `Extract the delivery address from the text. Include street, area, city. Respond with JSON: {"address": "extracted address"} or {"address": null} if not found.`;
        break;

      case 'quantity':
        systemPrompt = `Extract the quantity/number from the text. Look for numbers or words like "one", "two", etc. in ${language === 'ur' ? 'Urdu' : 'English'}. Respond with JSON: {"quantity": number} or {"quantity": null} if not found.`;
        break;

      default:
        throw new Error(`Unknown field: ${field}`);
    }

    const result = await chatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text },
    ]);

    return result[field];
  } catch (error) {
    console.error(`❌ Field extraction error for ${field}:`, error);
    return null;
  }
}

/**
 * Validate and normalize Pakistani phone number
 * Returns E.164 format: +92XXXXXXXXXX
 */
export async function normalizePhoneNumber(text) {
  try {
    const result = await chatCompletion([
      {
        role: 'system',
        content: `Normalize Pakistani phone number to E.164 format (+92XXXXXXXXXX).
        Accept formats: 03XXXXXXXXX, +923XXXXXXXXX, 923XXXXXXXXX, 923XXXXXXXXX.
        Respond with JSON: {"normalized": "+92XXXXXXXXXX", "valid": true} or {"normalized": null, "valid": false} if invalid.`,
      },
      {
        role: 'user',
        content: text,
      },
    ]);

    return result.valid ? result.normalized : null;
  } catch (error) {
    console.error('❌ Phone normalization error:', error);
    return null;
  }
}

/**
 * Clean up voice transcription using LLM based on expected field type
 * @param {string} rawText - Raw Whisper transcription
 * @param {string} fieldType - Expected field: 'name', 'phone', 'address', 'quantity'
 * @returns {string} Cleaned up text
 */
export async function cleanupTranscription(rawText, fieldType) {
  try {
    const prompts = {
      name: `You are extracting a Pakistani person's name from two voice transcriptions (English and Urdu) of the same audio.
You will receive both transcriptions. Compare them and extract the correct name.

Rules:
1. The English transcription usually has better spelling of Pakistani names (Ali, Muhammad, Wasif, etc.)
2. The Urdu transcription may help confirm the name if English is garbled.
3. Remove filler words from both: "my name is", "mera naam hai", "mera naam", "English:", "Urdu:", "ji", commas, periods.
4. Fix common misspellings: "Wasee"→"Wasi", "Muhammed"→"Muhammad", "Aly"→"Ali", "Abzar"→"Abuzar", "Naim"→"Naeem", "Rasul"→"Rasool", "Aysha"→"Ayesha"
5. Capitalize first letter of each name part.
6. Pick the transcription that looks most like a real Pakistani name.
7. Do NOT invent names. If both are garbled, return the English one cleaned up.
Respond with JSON: {"cleaned": "The Clean Name"}`,

      phone: `You are cleaning up a voice transcription of a Pakistani mobile phone number spoken in Urdu or English.
The number may be spoken as words in Urdu: صفر=0, ایک=1, دو=2, تین=3, چار=4, پانچ=5, چھ/چھے=6, سات=7, آٹھ=8, نو=9.
Or in English: zero=0, one=1, two=2, three=3, four=4, five=5, six=6, seven=7, eight=8, nine=9.
Pakistani mobile numbers start with 03 and have 11 digits total (03XXXXXXXXX).
Remove filler words like "میرا نمبر ہے" or "my number is".
Convert all spoken words to digits and form the complete number.
Respond with JSON: {"cleaned": "03XXXXXXXXX"}`,

      address: `You are cleaning up a voice transcription of a Pakistani delivery address spoken in Urdu or English.
The transcription may have errors in area names, city names, or street numbers.
Common Pakistani cities: Lahore, Karachi, Islamabad, Rawalpindi, Faisalabad, Multan, Peshawar, Gujranwala, Sialkot, Hyderabad.
Common address terms: مکان/house, گلی/street/gali, محلہ/mohalla, بلاک/block, فیز/phase, سیکٹر/sector, کالونی/colony, سوسائٹی/society, ٹاؤن/town, روڈ/road.
Fix obvious transcription errors in place names. Keep the full address intact.
Remove filler words like "میرا پتہ ہے" or "my address is".
Respond with JSON: {"cleaned": "the clean address"}`,

      quantity: `You are cleaning up a voice transcription of an order quantity spoken in Urdu or English.
Convert Urdu number words to digits: ایک=1, دو=2, تین=3, چار=4, پانچ=5, چھ=6, سات=7, آٹھ=8, نو=9, دس=10.
Remove filler words like "مجھے چاہیے" or "I want".
Respond with JSON: {"cleaned": "the number as digits"}`,
    };

    const systemPrompt = prompts[fieldType];
    if (!systemPrompt) return rawText;

    const result = await chatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: rawText },
    ]);

    const cleaned = result.cleaned;
    if (cleaned) {
      console.log(`✅ Transcription cleaned (${fieldType}): "${rawText}" → "${cleaned}"`);
      return cleaned;
    }
    return rawText;
  } catch (error) {
    console.error(`❌ Transcription cleanup error for ${fieldType}:`, error);
    return rawText; // Return original if cleanup fails
  }
}
