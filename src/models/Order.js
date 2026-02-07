import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    wa_id: {
      type: String,
      required: true,
      index: true,
    },
    productSku: {
      type: String,
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    productPrice: {
      type: Number,
      required: true,
    },
    qty: {
      type: Number,
      required: true,
      min: 1,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    customer: {
      name: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
        match: /^\+92\d{10}$/, // E.164 format
      },
      address: {
        type: String,
        required: true,
      },
    },
    paymentMethod: {
      type: String,
      enum: ['easypaisa', 'cod'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending_review', 'pending_confirmation', 'confirmed', 'cancelled'],
      default: 'pending_review',
    },
    paymentProof: {
      type: {
        type: String,
        enum: ['text', 'image'],
      },
      text: String,
      mediaId: String,
      mediaUrl: String,
      storedPath: String,
      receivedAt: Date,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Generate unique order ID
orderSchema.statics.generateOrderId = function () {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

// Index for queries
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ wa_id: 1, createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;
