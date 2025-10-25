import mongoose, { Schema, Document } from 'mongoose';

export interface IUserFamily extends Document {
  userId: string;
  familyId: string;
  role: 'head' | 'adult' | 'child';
  joinedAt: Date;
  isActive: boolean;
  isPrimary: boolean; // Mark one family as primary for default selection
  permissions: {
    canViewFamilyIncome: boolean;
    canAddFamilyIncome: boolean;
    canViewFamilyExpenses: boolean;
    canAddFamilyExpenses: boolean;
    canManageMembers: boolean;
    canManageBudgets: boolean;
  };
  personalBudget?: {
    monthlyAllowance: number;
    currency: string;
    autoRefill: boolean;
    currentBalance: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserFamilySchema = new Schema<IUserFamily>(
  {
    userId: {
      type: String,
      required: true,
      ref: 'User',
    },
    familyId: {
      type: String,
      required: true,
      ref: 'Family',
    },
    role: {
      type: String,
      required: true,
      enum: ['head', 'adult', 'child'],
      default: 'adult',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    permissions: {
      canViewFamilyIncome: {
        type: Boolean,
        default: true,
      },
      canAddFamilyIncome: {
        type: Boolean,
        default: true,
      },
      canViewFamilyExpenses: {
        type: Boolean,
        default: true,
      },
      canAddFamilyExpenses: {
        type: Boolean,
        default: true,
      },
      canManageMembers: {
        type: Boolean,
        default: false,
      },
      canManageBudgets: {
        type: Boolean,
        default: false,
      },
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
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
UserFamilySchema.index({ userId: 1 });
UserFamilySchema.index({ familyId: 1 });
UserFamilySchema.index({ userId: 1, familyId: 1 }, { unique: true }); // Prevent duplicate memberships
UserFamilySchema.index({ userId: 1, isPrimary: 1 });
UserFamilySchema.index({ isActive: 1 });

// Ensure only one primary family per user
UserFamilySchema.pre('save', async function(next) {
  if (this.isPrimary && this.isModified('isPrimary')) {
    // Remove primary flag from other families for this user
    await mongoose.model('UserFamily').updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { isPrimary: false }
    );
  }
  next();
});

export default mongoose.models.UserFamily || mongoose.model<IUserFamily>('UserFamily', UserFamilySchema);
