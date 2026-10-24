import mongoose from 'mongoose';
const { Schema, model } = mongoose;
const L = { en: String, sw: String };

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['worker', 'supervisor', 'admin'], default: 'worker' },
  unit: { type: Schema.Types.ObjectId, ref: 'Unit' },
  language: { type: String, enum: ['en', 'sw'], default: 'en' },
  certification: {
    status: { type: String, enum: ['certified', 'due', 'expired', 'in_training'], default: 'in_training' },
    certifiedAt: Date,
    expiresAt: Date,
  },
}, { timestamps: true });
UserSchema.methods.toSafe = function () {
  const { passwordHash, __v, ...rest } = this.toObject();
  return rest;
};

const StepSchema = new Schema({
  order: Number, title: L, instruction: L, expectedItems: [String], critical: Boolean,
}, { _id: false });

const ProtocolSchema = new Schema({
  key: { type: String, unique: true },
  kind: { type: String, enum: ['donning', 'doffing'] },
  title: L,
  sourceSection: String,
  sourceUrl: String,
  steps: [StepSchema],
}, { timestamps: true });

const DetectionSchema = new Schema({
  at: { type: Date, default: Date.now },
  provider: String, model: String, latencyMs: Number, ok: Boolean,
  stepOk: Boolean, items: [{ name: String, present: Boolean, correct: Boolean, issue: String, confidence: Number, _id: false }],
  riskFlags: [String], feedbackEn: String, feedbackSw: String, error: String,
}, { _id: false });

const SessionStepSchema = new Schema({
  order: Number,
  status: { type: String, enum: ['pending', 'passed', 'failed', 'overridden'], default: 'pending' },
  startedAt: Date, completedAt: Date,
  checks: { type: Number, default: 0 },
  overrideReason: String,
  detections: [DetectionSchema],
}, { _id: false });

const SessionSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  unit: { type: Schema.Types.ObjectId, ref: 'Unit' },
  protocol: { type: Schema.Types.ObjectId, ref: 'Protocol', required: true },
  kind: { type: String, enum: ['donning', 'doffing'] },
  mode: { type: String, enum: ['live', 'training'], default: 'live' },
  status: { type: String, enum: ['active', 'completed', 'aborted'], default: 'active' },
  currentStep: { type: Number, default: 1 },
  steps: [SessionStepSchema],
  overrides: [{ order: Number, reason: String, at: { type: Date, default: Date.now }, _id: false }],
  issues: [{ order: Number, note: String, at: { type: Date, default: Date.now }, _id: false }],
  riskScore: Number,
  riskBreakdown: Schema.Types.Mixed,
  coachingNote: { en: String, sw: String },
  trainingScore: Number,
  startedAt: { type: Date, default: Date.now },
  finishedAt: Date,
}, { timestamps: true });

const InventorySchema = new Schema({
  sku: { type: String, unique: true },
  name: L,
  category: String,
  unit: { type: Schema.Types.ObjectId, ref: 'Unit' },
  quantity: Number,
  reorderLevel: Number,
  expiresAt: Date,
}, { timestamps: true });

const UnitSchema = new Schema({ name: String, code: { type: String, unique: true }, facility: String }, { timestamps: true });

export const User = model('User', UserSchema);
export const Protocol = model('Protocol', ProtocolSchema);
export const Session = model('Session', SessionSchema);
export const InventoryItem = model('InventoryItem', InventorySchema);
export const Unit = model('Unit', UnitSchema);
