import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    name_ur: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      required: true,
    },
    description_ur: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'PKR',
      enum: ['PKR'],
    },
    imageUrl: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^https?:\/\/.+/.test(v);
        },
        message: 'Invalid image URL',
      },
    },
    active: {
      type: Boolean,
      default: true,
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    category: {
      type: String,
      trim: true,
      default: '',
    },
    category_ur: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
productSchema.index({ active: 1, createdAt: -1 });
productSchema.index({ active: 1, category: 1 });

// Static method to get active products (optionally filtered by category)
productSchema.statics.getActive = function (category) {
  const query = { active: true, stock: { $gt: 0 } };
  if (category) {
    query.category = category;
  }
  return this.find(query).sort({ createdAt: -1 });
};

// Static method to get distinct categories from active products
productSchema.statics.getCategories = async function () {
  const products = await this.find({ active: true, stock: { $gt: 0 } }).select('category category_ur');
  const categoryMap = new Map();
  for (const p of products) {
    if (p.category && !categoryMap.has(p.category)) {
      categoryMap.set(p.category, p.category_ur || p.category);
    }
  }
  return Array.from(categoryMap, ([en, ur]) => ({ en, ur }));
};

// Static method to get next product (rotation), optionally filtered by category
productSchema.statics.getNextProduct = async function (currentSku, category) {
  const products = await this.getActive(category);

  if (products.length === 0) {
    return null;
  }

  if (!currentSku) {
    return products[0];
  }

  const currentIndex = products.findIndex(p => p.sku === currentSku);
  const nextIndex = (currentIndex + 1) % products.length;

  return products[nextIndex];
};

const Product = mongoose.model('Product', productSchema);

export default Product;
