import mongoose, { Schema, Document } from 'mongoose';

export interface IExpense extends Document {
  userId?: string;
  amount: number;
  category: string;
  description: string;
  date: Date;
  paymentMethod: 'Cash' | 'Card' | 'UPI' | 'Bank Transfer';
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    userId: {
      type: String,
      required: false, // Optional for single-user mode
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['Cash', 'Card', 'UPI', 'Bank Transfer'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
ExpenseSchema.index({ userId: 1, date: -1 });
ExpenseSchema.index({ category: 1 });
ExpenseSchema.index({ paymentMethod: 1 });

export default mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);
