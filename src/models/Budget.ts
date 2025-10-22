import mongoose, { Schema, Document } from 'mongoose';

export interface IBudget extends Document {
  userId?: string;
  category: string;
  amount: number;
  month: Date;
}

const BudgetSchema = new Schema<IBudget>(
  {
    userId: {
      type: String,
      required: false, // Optional for single-user mode
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    month: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure unique budget per category per month per user
BudgetSchema.index({ userId: 1, category: 1, month: 1 }, { unique: true });

export default mongoose.models.Budget || mongoose.model<IBudget>('Budget', BudgetSchema);
