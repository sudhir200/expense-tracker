import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  userId: string;
  name: string;
  color: string;
  icon?: string;
  isDefault: boolean;
}

const CategorySchema = new Schema<ICategory>(
  {
    userId: {
      type: String,
      required: true,
      ref: 'User',
    },
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    color: {
      type: String,
      required: true,
      match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, // Hex color validation
    },
    icon: {
      type: String,
      required: false,
    },
    isDefault: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
CategorySchema.index({ userId: 1, name: 1 });
CategorySchema.index({ isDefault: 1 });

export default mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);
