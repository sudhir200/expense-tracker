import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  avatar?: string;
  defaultCurrency: string;
  role: 'USER' | 'ADMIN' | 'SUPERUSER';
  isActive: boolean;
  createdBy?: string; // Reference to user who created this user (for ADMIN/SUPERUSER tracking)
  familyId?: string; // Reference to family this user belongs to
  familyRole?: 'head' | 'adult' | 'child'; // Role within the family
  personalBudget?: {
    monthlyAllowance: number;
    currency: string;
    autoRefill: boolean;
    currentBalance: number;
  };
  // Profile fields
  phone?: string;
  location?: string;
  bio?: string;
  jobTitle?: string;
  // Security fields
  passwordChangedAt?: Date;
  // Notification preferences
  notificationPreferences?: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    weeklyReports: boolean;
    budgetAlerts: boolean;
    familyUpdates: boolean;
    expenseReminders: boolean;
  };
  notificationPreferencesUpdatedAt?: Date;
  // General preferences
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    language?: string;
    timezone?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    avatar: {
      type: String,
      required: false,
    },
    defaultCurrency: {
      type: String,
      required: true,
      default: 'USD',
    },
    role: {
      type: String,
      enum: ['USER', 'ADMIN', 'SUPERUSER'],
      default: 'USER',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },
    createdBy: {
      type: String,
      ref: 'User',
      required: false,
    },
    familyId: {
      type: String,
      ref: 'Family',
      required: false,
    },
    familyRole: {
      type: String,
      enum: ['head', 'adult', 'child'],
      required: false,
    },
    personalBudget: {
      monthlyAllowance: {
        type: Number,
        default: 0,
      },
      currency: {
        type: String,
        default: 'USD',
      },
      autoRefill: {
        type: Boolean,
        default: false,
      },
      currentBalance: {
        type: Number,
        default: 0,
      },
    },
    // Profile fields
    phone: {
      type: String,
      required: false,
    },
    location: {
      type: String,
      required: false,
    },
    bio: {
      type: String,
      required: false,
      maxlength: 500,
    },
    jobTitle: {
      type: String,
      required: false,
    },
    // Security fields
    passwordChangedAt: {
      type: Date,
      required: false,
    },
    // Notification preferences
    notificationPreferences: {
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      pushNotifications: {
        type: Boolean,
        default: false,
      },
      weeklyReports: {
        type: Boolean,
        default: true,
      },
      budgetAlerts: {
        type: Boolean,
        default: true,
      },
      familyUpdates: {
        type: Boolean,
        default: true,
      },
      expenseReminders: {
        type: Boolean,
        default: false,
      },
    },
    notificationPreferencesUpdatedAt: {
      type: Date,
      required: false,
    },
    // General preferences
    preferences: {
      theme: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'system',
      },
      language: {
        type: String,
        default: 'en',
      },
      timezone: {
        type: String,
        default: 'UTC',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ createdBy: 1 });
UserSchema.index({ familyId: 1 });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
