import mongoose from 'mongoose';

const SessionSchema = new mongoose.Schema({
  _id:       { type: String },
  adminId:   { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser', required: true },
  expiresAt: { type: Date, required: true },
});

SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session = mongoose.models.Session || mongoose.model('Session', SessionSchema);
