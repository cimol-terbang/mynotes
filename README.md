# My Notes

A minimal personal writing platform built with SvelteKit and MongoDB. Write essays, poetry, and short stories — with a clean reading experience and a private admin panel to manage everything.

---

## Features

- **Three writing categories** — Essays (*What I Think*), Poetry (*What I Feel*), and Stories (*What I Imagine*)
- **Markdown editor** with live side-by-side preview
- **Image support** — upload images directly from the editor (JPEG, PNG, GIF, WebP, max 5 MB); images are embedded via shortcodes (`{{image:/uploads/images/...}}`)
- **Tagging system** — add tags to posts with autocomplete from existing tags; browse posts by tag at `/tag/[slug]`
- **Draft / Published workflow** — posts stay private as drafts until you publish them
- **Reader comments** — visitors can leave comments on published posts (rate-limited to 10 per minute per IP)
- **Dark mode** — system-aware with a manual toggle
- **Admin panel** — protected by session-based authentication; manage all posts from a single dashboard
- **Deployed on Vercel** — configured with `@sveltejs/adapter-vercel` out of the box

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [SvelteKit](https://kit.svelte.dev) |
| Database | [MongoDB](https://www.mongodb.com) via [Mongoose](https://mongoosejs.com) |
| Styling | [Tailwind CSS](https://tailwindcss.com) + [@tailwindcss/typography](https://tailwindcss.com/docs/typography-plugin) |
| Markdown | [marked](https://marked.js.org) |
| Sanitization | [isomorphic-dompurify](https://github.com/kkomelin/isomorphic-dompurify) |
| Auth | bcryptjs + cookie-based sessions |
| Rate limiting | [sveltekit-rate-limiter](https://github.com/ciscoheat/sveltekit-rate-limiter) |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A MongoDB instance (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

### 1. Clone and install

```bash
git clone https://github.com/your-username/my-notes.git
cd my-notes
npm install
```

### 2. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

```env
MONGODB_URI="your-mongodb-connection-string"
SESSION_SECRET=your-session-secret
```

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string (e.g. `mongodb+srv://...` for Atlas) |
| `SESSION_SECRET` | A long random string used to sign session cookies |

### 3. Seed the database

This creates an admin user and six sample posts:

```bash
npm run seed
```

By default the admin credentials are `admin` / `changeme`. Override them before seeding:

```bash
ADMIN_USERNAME=yourname ADMIN_PASSWORD=strongpassword npm run seed
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Project Structure

```
src/
├── routes/
│   ├── +page.svelte          # Home — post listing with category filter
│   ├── [slug]/               # Public post detail page
│   ├── tag/[tagSlug]/        # Posts filtered by tag
│   ├── about/                # About page
│   ├── admin/                # Protected admin panel
│   │   ├── posts/new/        # Create a new post
│   │   └── posts/[id]/       # Edit / delete a post
│   └── api/
│       ├── images/upload/    # Image upload endpoint
│       └── tags/             # Tag autocomplete endpoint
├── lib/
│   ├── components/           # Svelte UI components
│   ├── server/               # Server-only code
│   │   ├── models/           # Mongoose models (Post, Comment, AdminUser, Session)
│   │   ├── post.service.js   # Post CRUD logic
│   │   ├── comment.service.js
│   │   └── auth.service.js
│   └── utils/                # markdown, sanitize, slug helpers
static/
└── uploads/images/           # Uploaded images (served statically)
scripts/
└── seed.js                   # Database seeder
```

---

## Admin Panel

Navigate to `/admin/login` and sign in with your admin credentials.

From the admin dashboard you can:

- View all posts (drafts and published) in a table
- Create a new post at `/admin/posts/new`
- Edit or delete any post at `/admin/posts/[id]`
- Toggle a post between **Draft** and **Published**
- Upload images directly inside the Markdown editor
- Add and remove tags with autocomplete

All admin routes are protected by a server-side session guard. Unauthenticated requests are redirected to `/admin/login`.

---

## Writing Posts

Posts are written in **Markdown**. The editor shows a live preview alongside the raw text.

### Inserting images

Two ways to add an image inside the editor:

1. **Upload** — click *Upload Image*, pick a file. The shortcode is inserted at the cursor automatically.
2. **Insert by URL** — click *Insert Image*, paste an existing URL.

Shortcode format:

```
{{image:/uploads/images/filename.jpg}}
```

The shortcode is resolved to a full `<img>` tag when the post is rendered.

---

## Deployment

The project is pre-configured for **Vercel**. Push to your repository and connect it in the Vercel dashboard. Set the environment variables (`MONGODB_URI`, `SESSION_SECRET`) in the Vercel project settings.

To build locally:

```bash
npm run build
npm run preview
```

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build |
| `npm run seed` | Seed the database with an admin user and sample posts |
| `npm test` | Run the test suite (unit + integration) |

---

## License

Personal use. Feel free to fork and adapt for your own writing space.
