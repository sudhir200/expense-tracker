import mongoose, { Schema, Document } from 'mongoose';

export interface IFamily extends Document {
  name: string;
  description?: string;
  currency: string; // Default family currency
  createdBy: string; // User ID of family creator
  members: {
    userId: string;
    role: 'head' | 'adult' | 'child'; // Family roles
    joinedAt: Date;
    permissions: {
      canViewFamilyIncome: boolean;
      canAddFamilyIncome: boolean;
      canViewFamilyExpenses: boolean;
      canAddFamilyExpenses: boolean;
      canManageMembers: boolean;
      canManageBudgets: boolean;
    };
  }[];
  settings: {
    allowPersonalExpenses: boolean; // Allow members to track personal expenses
    requireApprovalForLargeExpenses: boolean;
    largeExpenseThreshold: number;
    sharedCategories: string[]; // Categories that are family-wide
    personalCategories: string[]; // Categories that are personal only
  };
  inviteCodes: {
    code: string;
    expiresAt: Date;
    createdBy: string;
    isActive: boolean;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const FamilySchema = new Schema<IFamily>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
      uppercase: true,
    },
    createdBy: {
      type: String,
      required: true,
      ref: 'User',
    },
    members: [{
      userId: {
        type: String,
        required: true,
        ref: 'User',
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
    }],
    settings: {
      allowPersonalExpenses: {
        type: Boolean,
        default: true,
      },
      requireApprovalForLargeExpenses: {
        type: Boolean,
        default: false,
      },
      largeExpenseThreshold: {
        type: Number,
        default: 1000,
      },
      sharedCategories: [{
        type: String,
        trim: true,
      }],
      personalCategories: [{
        type: String,
        trim: true,
      }],
    },
    inviteCodes: [{
      code: {
        type: String,
        required: true,
        unique: true,
      },
      expiresAt: {
        type: Date,
        required: true,
      },
      createdBy: {
        type: String,
        required: true,
        ref: 'User',
      },
      isActive: {
        type: Boolean,
        default: true,
      },
    }],
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
FamilySchema.index({ createdBy: 1 });
FamilySchema.index({ 'members.userId': 1 });
FamilySchema.index({ 'inviteCodes.code': 1 });

// Methods
FamilySchema.methods.isMember = function(userId: string) {
  return this.members.some((member: any) => member.userId.toString() === userId);
};

FamilySchema.methods.getMember = function(userId: string) {
  return this.members.find((member: any) => member.userId.toString() === userId);
};

FamilySchema.methods.isHead = function(userId: string) {
  const member = this.getMember(userId);
  return member && member.role === 'head';
};

FamilySchema.methods.canManageFamily = function(userId: string) {
  const member = this.getMember(userId);
  return member && (member.role === 'head' || member.permissions.canManageMembers);
};

export default mongoose.models.Family || mongoose.model<IFamily>('Family', FamilySchema);
