import bcryptjs from 'bcryptjs';
import { connectDb } from './db.js';
import { AdminUser } from './models/AdminUser.js';
import { Session } from './models/Session.js';

const COOKIE_NAME = 'session_id';
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const COOKIE_MAX_AGE = 86400; // seconds

class AuthService {
  async verifyCredentials(username, password) {
    await connectDb();
    const admin = await AdminUser.findOne({ username }).lean();
    if (!admin) return false;
    return bcryptjs.compare(password, admin.passwordHash);
  }

  async createSession(event) {
    await connectDb();
    const admin = await AdminUser.findOne({}).lean();
    if (!admin) throw new Error('No admin user found');

    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

    await Session.create({ _id: sessionId, adminId: admin._id, expiresAt });

    event.cookies.set(COOKIE_NAME, sessionId, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: COOKIE_MAX_AGE,
      path: '/'
    });

    return sessionId;
  }

  async validateSession(sessionId) {
    if (!sessionId) return false;
    await connectDb();
    const session = await Session.findOne({
      _id: sessionId,
      expiresAt: { $gt: new Date() }
    }).lean();
    return session !== null;
  }

  async destroySession(event) {
    const sessionId = event.cookies.get(COOKIE_NAME);
    if (sessionId) {
      await connectDb();
      await Session.deleteOne({ _id: sessionId });
    }
    event.cookies.delete(COOKIE_NAME, { path: '/' });
  }
}

export const authService = new AuthService();
