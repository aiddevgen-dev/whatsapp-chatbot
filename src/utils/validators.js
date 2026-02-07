/**
 * Validate and normalize Pakistani phone number
 * Accepts: 03XXXXXXXXX, +92 3XXXXXXXXX, 92 3XXXXXXXXX, 923XXXXXXXXX
 * Returns: +92XXXXXXXXXX (E.164 format) or null if invalid
 */
export function validatePakistaniPhone(input) {
  if (!input) return null;

  // Remove all spaces, dashes, and parentheses
  let cleaned = input.replace(/[\s\-()]/g, '');

  // Try to extract 10-digit number starting with 3
  let digits = null;

  if (/^0(3\d{9})$/.test(cleaned)) {
    // 03XXXXXXXXX -> 3XXXXXXXXX (10 digits)
    digits = cleaned.slice(1);
  } else if (/^\+?92(3\d{9})$/.test(cleaned)) {
    // +923XXXXXXXXX or 923XXXXXXXXX -> 3XXXXXXXXX (10 digits)
    digits = cleaned.replace(/^\+?92/, '');
  }

  if (digits && digits.length === 10 && digits.startsWith('3')) {
    return `+92${digits}`;
  }

  return null;
}

/**
 * Validate quantity
 * Returns integer between 1-100 or null
 */
export function validateQuantity(input) {
  if (!input) return null;

  // Handle numeric input
  if (typeof input === 'number') {
    return input >= 1 && input <= 100 ? Math.floor(input) : null;
  }

  // Handle string input
  const cleaned = input.toString().trim();

  // Check if it's a number
  const num = parseInt(cleaned, 10);
  if (!isNaN(num) && num >= 1 && num <= 100) {
    return num;
  }

  // Word to number mapping (English and Urdu)
  const wordToNumber = {
    // English
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,

    // Urdu (romanized)
    'ek': 1, 'aik': 1, 'do': 2, 'teen': 3, 'tin': 3, 'char': 4,
    'paanch': 5, 'panch': 5, 'chay': 6, 'che': 6, 'saat': 7,
    'aath': 8, 'nau': 9, 'no': 9, 'das': 10, 'dس': 10,

    // Urdu numerals in ASCII
    '۱': 1, '۲': 2, '۳': 3, '۴': 4, '۵': 5,
    '۶': 6, '۷': 7, '۸': 8, '۹': 9, '۱۰': 10,
  };

  const lowerCleaned = cleaned.toLowerCase();
  if (wordToNumber[lowerCleaned]) {
    return wordToNumber[lowerCleaned];
  }

  return null;
}

/**
 * Validate name
 * Returns trimmed name or null
 */
export function validateName(input) {
  if (!input) return null;

  const cleaned = input.toString().trim();

  // Must be at least 1 character, max 100
  if (cleaned.length < 1 || cleaned.length > 100) {
    return null;
  }

  // Must contain at least one letter
  if (!/[a-zA-Z\u0600-\u06FF]/.test(cleaned)) {
    return null;
  }

  return cleaned;
}

/**
 * Validate address
 * Returns trimmed address or null
 */
export function validateAddress(input) {
  if (!input) return null;

  const cleaned = input.toString().trim();

  // Must be at least 5 characters, max 500
  if (cleaned.length < 5 || cleaned.length > 500) {
    return null;
  }

  return cleaned;
}
