import mongoose, { Schema, Document } from 'mongoose';

export interface IIncome extends Document {
  userId: string;
  familyId?: string; // If set, this is family income
  type: 'personal' | 'family'; // Type of income
  amount: number;
  currency: string;
  source: string;
  description: string;
  date: Date;
  frequency: 'one-time' | 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'yearly';
  isRecurring: boolean;
  nextOccurrence?: Date;
  contributedBy?: string; // User who contributed this income to family
  allocation?: {
    toFamily: number; // Amount allocated to family budget
    toPersonal: number; // Amount kept for personal use
  };
  createdAt: Date;
  updatedAt: Date;
}

const IncomeSchema = new Schema<IIncome>(
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
      default: 'USD',
      trim: true,
      uppercase: true,
    },
    source: {
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
    frequency: {
      type: String,
      required: true,
      enum: ['one-time', 'weekly', 'bi-weekly', 'monthly', 'quarterly', 'yearly'],
      default: 'one-time',
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    nextOccurrence: {
      type: Date,
      required: false,
    },
    contributedBy: {
      type: String,
      ref: 'User',
      required: false,
    },
    allocation: {
      toFamily: {
        type: Number,
        default: 0,
      },
      toPersonal: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
IncomeSchema.index({ userId: 1, date: -1 });
IncomeSchema.index({ familyId: 1, date: -1 });
IncomeSchema.index({ type: 1 });
IncomeSchema.index({ source: 1 });
IncomeSchema.index({ frequency: 1 });
IncomeSchema.index({ contributedBy: 1 });

export default mongoose.models.Income || mongoose.model<IIncome>('Income', IncomeSchema);
