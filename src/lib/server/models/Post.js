import mongoose from 'mongoose';

const PostSchema = new mongoose.Schema({
  title:    { type: String, required: true },
  slug:     { type: String, required: true, unique: true },
  content:  { type: String, required: true },
  category: { type: String, enum: ['essay', 'poetry', 'story'], required: true },
  excerpt:  { type: String, required: true },
  status:   { type: String, enum: ['draft', 'published'], default: 'draft', required: true },
  tags:     { type: [String], default: [] },
}, { timestamps: true });

PostSchema.index({ status: 1, category: 1, updatedAt: -1 });
PostSchema.index({ status: 1, updatedAt: -1 });
PostSchema.index({ tags: 1, status: 1, updatedAt: -1 });

export const Post = mongoose.models.Post || mongoose.model('Post', PostSchema);
