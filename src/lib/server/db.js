import mongoose from 'mongoose';
import { env } from '$env/dynamic/private';

export async function connectDb() {
  if (mongoose.connection.readyState === 1) return;
  const uri = env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI environment variable is not set');
  await mongoose.connect(uri);
}
