/**
 * Seed script: creates admin user and lorem ipsum sample posts.
 * Usage: node --env-file=.env scripts/seed.js
 */
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import slugify from 'slugify';

const SALT_ROUNDS = 12;
const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/personal_writing_platform';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'changeme';

if (!process.env.ADMIN_PASSWORD) {
  console.warn('WARNING: Using default admin password. Set ADMIN_PASSWORD env var.');
}

const AdminUserSchema = new mongoose.Schema({
  username:     { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
});
const AdminUser = mongoose.model('AdminUser', AdminUserSchema);

const PostSchema = new mongoose.Schema({
  title:    { type: String, required: true },
  slug:     { type: String, required: true, unique: true },
  content:  { type: String, required: true },
  category: { type: String, enum: ['essay', 'poetry', 'story'], required: true },
  excerpt:  { type: String, required: true },
}, { timestamps: true });
const Post = mongoose.model('Post', PostSchema);

const SAMPLE_POSTS = [
  {
    title: 'Lorem Ipsum Dolor Sit Amet',
    category: 'essay',
    content: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

## De Finibus Bonorum

Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.

> Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

## Sed Ut Perspiciatis

Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.

Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.

## Neque Porro Quisquam

Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.`,
  },
  {
    title: 'Consectetur Adipiscing Elit',
    category: 'essay',
    content: `Consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.

## Quis Nostrud Exercitation

Quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.

Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem.

## Accusantium Doloremque

Accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur.

Aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Ut labore et dolore magnam aliquam quaerat voluptatem.`,
  },
  {
    title: 'Tempor Incididunt Ut Labore',
    category: 'poetry',
    content: `Lorem ipsum dolor sit amet,
consectetur adipiscing elit,
sed do eiusmod tempor —
incididunt ut labore.

---

Et dolore magna aliqua,
ut enim ad minim veniam,
quis nostrud exercitation
ullamco laboris nisi.

---

Ut aliquip ex ea commodo
consequat duis aute irure,
dolor in reprehenderit
in voluptate velit esse.

---

Cillum dolore eu fugiat
nulla pariatur excepteur,
sint occaecat cupidatat
non proident in culpa.`,
  },
  {
    title: 'Dolore Magna Aliqua',
    category: 'poetry',
    content: `Sed ut perspiciatis
unde omnis iste natus,
error sit voluptatem —
accusantium doloremque.

---

Laudantium totam rem,
aperiam eaque ipsa quae,
ab illo inventore veritatis
et quasi architecto.

---

Beatae vitae dicta sunt
explicabo nemo enim,
ipsam voluptatem quia
voluptas sit aspernatur.

---

Aut odit aut fugit sed,
quia consequuntur magni,
dolores eos qui ratione
voluptatem sequi nesciunt.`,
  },
  {
    title: 'Ut Enim Ad Minim Veniam',
    category: 'story',
    content: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.

Nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.

---

"Excepteur sint occaecat cupidatat non proident," she said, placing the letter on the table.

He looked at her. "Sunt in culpa qui officia deserunt mollit anim id est laborum."

"Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium."

She nodded slowly. "Totam rem aperiam."

---

Eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit.

Sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet.

---

Consectetur adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam.`,
  },
  {
    title: 'Quis Nostrud Exercitation',
    category: 'story',
    content: `Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis.

Et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit.

---

The door opened. A man entered carrying a briefcase labeled *Consequuntur Magni Dolores*.

"Eos qui ratione voluptatem sequi nesciunt," he announced to no one in particular.

The room was empty except for a chair and a window. Outside, the city moved in its usual way — purposeful, indifferent, lorem.

---

"Neque porro quisquam est," the sign on the wall read, "qui dolorem ipsum quia dolor sit amet."

He sat down. He opened the briefcase. Inside was another briefcase, smaller, labeled *Consectetur Adipisci Velit*.

He opened that one too.

---

Inside was a note. It read: *Sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.*

He folded it carefully and placed it in his pocket. Then he left, closing both briefcases behind him.

The chair remained. The window remained. The city continued.`,
  },
];

async function seedAdmin() {
  const existing = await AdminUser.findOne({ username: ADMIN_USERNAME });
  if (existing) {
    console.log(`Admin "${ADMIN_USERNAME}" already exists. Skipping.`);
    return;
  }
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);
  await AdminUser.create({ username: ADMIN_USERNAME, passwordHash });
  console.log(`Admin "${ADMIN_USERNAME}" created.`);
}

async function seedPosts() {
  // Delete all existing posts and re-seed
  const deleted = await Post.deleteMany({});
  console.log(`Deleted ${deleted.deletedCount} existing post(s).`);

  for (const p of SAMPLE_POSTS) {
    const slug = slugify(p.title, { lower: true, strict: true, trim: true });
    const excerpt = p.content.slice(0, 150);
    await Post.create({ ...p, slug, excerpt });
    console.log(`Created: "${p.title}" [${p.category}]`);
  }
}

async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected.\n');

  await seedAdmin();
  await seedPosts();

  await mongoose.disconnect();
  console.log('\nDone.');
}

main().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
