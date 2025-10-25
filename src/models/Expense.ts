import mongoose, { Schema, Document } from 'mongoose';

export interface IExpense extends Document {
  userId: string;
  familyId?: string; // If set, this is a family expense
  type: 'personal' | 'family'; // Type of expense
  amount: number;
  currency: string;
  category: string;
  description: string;
  date: Date;
  paymentMethod: 'Cash' | 'Card' | 'Wallet' | 'Bank Transfer';
  paidBy?: string; // User who paid for this expense
  splitBetween?: {
    userId: string;
    amount: number;
    settled: boolean;
  }[]; // For family expenses split between members
  approvalStatus?: 'pending' | 'approved' | 'rejected'; // For large expenses
  approvedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    userId: {
      type: String,
      required: true,
      ref: 'User',
    },
    familyId: {
      type: String,
      ref: 'Family',
      required: false,
    },
    type: {
      type: String,
      enum: ['personal', 'family'],
      required: true,
      default: 'personal',
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      trim: true,
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
      enum: ['Cash', 'Card', 'Wallet', 'Bank Transfer'],
    },
    paidBy: {
      type: String,
      ref: 'User',
      required: false,
    },
    splitBetween: [{
      userId: {
        type: String,
        ref: 'User',
        required: true,
      },
      amount: {
        type: Number,
        required: true,
        min: 0,
      },
      settled: {
        type: Boolean,
        default: false,
      },
    }],
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      required: false,
    },
    approvedBy: {
      type: String,
      ref: 'User',
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
ExpenseSchema.index({ userId: 1, date: -1 });
ExpenseSchema.index({ familyId: 1, date: -1 });
ExpenseSchema.index({ type: 1 });
ExpenseSchema.index({ category: 1 });
ExpenseSchema.index({ paymentMethod: 1 });
ExpenseSchema.index({ paidBy: 1 });
ExpenseSchema.index({ approvalStatus: 1 });

export default mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);
