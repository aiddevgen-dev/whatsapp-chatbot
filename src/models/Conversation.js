import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    wa_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    lang: {
      type: String,
      enum: ['en', 'ur'],
      default: null,
    },
    state: {
      type: String,
      enum: [
        'LANGUAGE_SELECTION',
        'CATEGORY_SELECTION',
        'SHOWING_PRODUCT',
        'ASKING_QUANTITY',
        'ASKING_NAME',
        'ASKING_PHONE',
        'ASKING_ADDRESS',
        'ASKING_PAYMENT_METHOD',
        'WAITING_PAYMENT_PROOF',
        'WAITING_FOR_AGENT',
        'ORDER_COMPLETED',
      ],
      default: 'LANGUAGE_SELECTION',
    },
    context: {
      category: { type: String, default: null },
      productSku: { type: String, default: null },
      qty: { type: Number, default: null },
      name: { type: String, default: null },
      phone: { type: String, default: null },
      address: { type: String, default: null },
      paymentMethod: { type: String, default: null },
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Update lastMessageAt on save
conversationSchema.pre('save', function (next) {
  this.lastMessageAt = new Date();
  next();
});

// Static method to get or create conversation
conversationSchema.statics.getOrCreate = async function (wa_id) {
  let conversation = await this.findOne({ wa_id });

  if (!conversation) {
    conversation = await this.create({ wa_id });
    console.log(`✅ New conversation created for ${wa_id}`);
  }

  return conversation;
};

// Instance method to reset context
conversationSchema.methods.resetContext = function () {
  this.context = {
    category: null,
    productSku: null,
    qty: null,
    name: null,
    phone: null,
    address: null,
    paymentMethod: null,
  };
};

// Instance method to complete order and reset
conversationSchema.methods.completeOrder = async function () {
  this.state = 'CATEGORY_SELECTION';
  this.resetContext();
  await this.save();
};

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;
