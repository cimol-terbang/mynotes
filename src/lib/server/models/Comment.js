import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema({
  postId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  authorName: { type: String, default: 'Anonym' },
  content:    { type: String, required: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

CommentSchema.index({ postId: 1, createdAt: 1 });

export const Comment = mongoose.models.Comment || mongoose.model('Comment', CommentSchema);
