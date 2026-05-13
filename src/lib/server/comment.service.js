import { connectDb } from './db.js';
import { Comment } from './models/Comment.js';

class CommentService {
  async getCommentsByPostId(postId) {
    await connectDb();
    const comments = await Comment.find({ postId })
      .sort({ createdAt: 1 })
      .lean();
    return comments;
  }

  async addComment({ postId, authorName, content }) {
    await connectDb();
    const name = (authorName ?? '').trim() || 'Anonym';
    const comment = await Comment.create({ postId, authorName: name, content });
    return comment.toObject();
  }
}

export const commentService = new CommentService();
