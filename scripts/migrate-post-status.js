/**
 * Migration script: set status 'published' for all existing posts without a status field.
 * Run once before deploying the post-draft feature.
 * Usage: node --env-file=.env scripts/migrate-post-status.js
 */
import mongoose from 'mongoose';
import '../src/lib/server/models/Post.js';

const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/personal_writing_platform';

async function connectDb() {
  if (mongoose.connection.readyState === 1) return;
  if (!MONGODB_URI) throw new Error('MONGODB_URI environment variable tidak ditemukan');
  await mongoose.connect(MONGODB_URI);
}

const Post = mongoose.model('Post');

async function migrate() {
  console.log('Menghubungkan ke MongoDB...');
  await connectDb();
  console.log('Terhubung.\n');

  console.log('Menjalankan migrasi: set status "published" untuk dokumen tanpa field status...');
  const result = await Post.updateMany(
    { status: { $exists: false } },
    { $set: { status: 'published' } }
  );

  console.log(`Migrasi selesai. ${result.modifiedCount} dokumen diperbarui.`);
  console.log('Semua dokumen lama kini memiliki status "published".');

  await mongoose.connection.close();
  console.log('\nKoneksi ditutup. Migrasi berhasil.');
}

migrate().catch(err => {
  console.error('Migrasi gagal:', err);
  process.exit(1);
});
