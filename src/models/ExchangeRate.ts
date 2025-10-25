import mongoose, { Schema, Document } from 'mongoose';

export interface IExchangeRate extends Document {
  userId: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  lastUpdated: Date;
  isUserDefined: boolean;
}

const ExchangeRateSchema = new Schema<IExchangeRate>(
  {
    userId: {
      type: String,
      required: true,
      ref: 'User',
    },
    fromCurrency: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    toCurrency: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    rate: {
      type: Number,
      required: true,
      min: 0,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    isUserDefined: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure unique currency pairs per user
ExchangeRateSchema.index({ userId: 1, fromCurrency: 1, toCurrency: 1 }, { unique: true });

export default mongoose.models.ExchangeRate || mongoose.model<IExchangeRate>('ExchangeRate', ExchangeRateSchema);
