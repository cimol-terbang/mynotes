# Tasks: Personal Writing Platform

## Task List

- [x] 1. Setup Proyek dan Infrastruktur Dasar
  - [x] 1.1 Hapus TypeScript: hapus `tsconfig.json`, ubah `vite.config.ts` → `vite.config.js`, hapus `src/app.d.ts`, dan hapus semua devDependencies TypeScript (`typescript`, `svelte-check`, `tslib`, `@types/*`)
  - [x] 1.2 Update `package.json`: hapus script `check`/`check:watch`, ganti `seed` script ke `node --env-file=.env scripts/seed.js`, tambahkan `mongoose` sebagai dependency, hapus `mongodb`
  - [x] 1.3 Buat Mongoose connection singleton (`src/lib/server/db.js`) dengan fungsi `connectDb()` yang menggunakan `MONGODB_URI` dari environment variable
  - [x] 1.4 Buat Mongoose models: `src/lib/server/models/Post.js`, `Comment.js`, `AdminUser.js`, `Session.js` dengan schema, validasi, dan indeks yang sesuai
  - [x] 1.5 Buat script seed (`scripts/seed.js`) untuk membuat admin user pertama dengan bcrypt hash, menggunakan Mongoose

- [x] 2. Utilities dan Konstanta
  - [x] 2.1 Buat `src/lib/utils/slug.js` dengan fungsi `generateSlug` dan `generateUniqueSlug` (pure function, tanpa DB)
  - [x] 2.2 Buat `src/lib/utils/sanitize.js` dengan fungsi `sanitizeCommentContent` dan `normalizeAuthorName`
  - [x] 2.3 Buat `src/lib/utils/markdown.js` sebagai wrapper `marked` + `DOMPurify` dengan fungsi `renderMarkdown`
  - [x] 2.4 Buat `src/lib/constants.js` dengan `CATEGORY_LABELS` object

- [x] 3. Services (Mongoose)
  - [x] 3.1 Implementasikan `PostService` (`src/lib/server/post.service.js`) dengan method `listPosts`, `getPostBySlug`, `createPost`, `updatePost`, `deletePost`, `generateUniqueSlug` — menggunakan Mongoose models
  - [x] 3.2 Implementasikan `CommentService` (`src/lib/server/comment.service.js`) dengan method `getCommentsByPostId` dan `addComment` — menggunakan Mongoose models
  - [x] 3.3 Implementasikan `AuthService` (`src/lib/server/auth.service.js`) dengan method `verifyCredentials`, `createSession`, `validateSession`, `destroySession` — menggunakan Mongoose models dan bcrypt

- [x] 4. Autentikasi dan Keamanan
  - [x] 4.1 Implementasikan `src/hooks.server.js` untuk auth guard (validasi sesi, redirect ke `/admin/login` jika tidak valid) dan rate limiter untuk endpoint komentar
  - [x] 4.2 Buat halaman login admin (`src/routes/admin/login/+page.svelte` dan `+page.server.js`) dengan form action yang memanggil `AuthService.verifyCredentials` dan `createSession`
  - [x] 4.3 Buat form action logout (`src/routes/admin/logout/+page.server.js`) yang memanggil `AuthService.destroySession`
  - [x] 4.4 Konfigurasi cookie sesi dengan atribut `httpOnly: true`, `sameSite: 'strict'`, `maxAge: 86400` (24 jam)
  - [x] 4.5 Implementasikan `src/lib/server/rate-limiter.js` menggunakan `sveltekit-rate-limiter` dengan limit 10 request/menit per IP untuk endpoint komentar

- [x] 5. Halaman Publik - Halaman Utama
  - [x] 5.1 Buat root layout (`src/routes/+layout.svelte`) dengan navigasi, `DarkModeToggle`, dan struktur halaman
  - [x] 5.2 Buat `src/routes/+layout.server.js` untuk memuat data sesi ke layout
  - [x] 5.3 Buat komponen `src/lib/components/CategoryNav.svelte` yang menampilkan ketiga kategori dengan label yang benar
  - [x] 5.4 Buat komponen `src/lib/components/PostCard.svelte` yang menampilkan judul, kategori, tanggal, dan cuplikan
  - [x] 5.5 Implementasikan `src/routes/+page.server.js` dengan load function yang memanggil `PostService.listPosts` dengan filter kategori opsional
  - [x] 5.6 Implementasikan `src/routes/+page.svelte` yang menampilkan daftar postingan dan pesan "Belum ada tulisan di kategori ini." jika kosong

- [x] 6. Halaman Publik - Detail Postingan dan Komentar
  - [x] 6.1 Implementasikan `src/routes/[slug]/+page.server.js` dengan load function yang memanggil `PostService.getPostBySlug` dan `CommentService.getCommentsByPostId`, throw 404 jika tidak ditemukan
  - [x] 6.2 Buat komponen `src/lib/components/PostContent.svelte` yang merender konten Markdown menggunakan `renderMarkdown` dengan `{@html}`
  - [x] 6.3 Buat komponen `src/lib/components/CommentList.svelte` yang menampilkan komentar diurutkan dari terlama ke terbaru dengan nama dan waktu
  - [x] 6.4 Buat komponen `src/lib/components/CommentForm.svelte` dengan field nama (default "Anonym"), field komentar (required), validasi client-side, dan `use:enhance` untuk submit tanpa reload
  - [x] 6.5 Implementasikan form action komentar di `src/routes/[slug]/+page.server.js` yang memanggil `CommentService.addComment` dengan sanitasi input dan rate limiting
  - [x] 6.6 Implementasikan `src/routes/+error.svelte` untuk halaman 404 dan error umum
  - [x] 6.7 Implementasikan `src/routes/[slug]/+page.svelte` dengan konten postingan, navigasi kembali, dan seksi komentar

- [x] 7. Dark Mode
  - [x] 7.1 Buat komponen `src/lib/components/DarkModeToggle.svelte` yang membaca preferensi dari `localStorage`, fallback ke `prefers-color-scheme`, toggle class `dark` pada `<html>`, dan menyimpan ke `localStorage`
  - [x] 7.2 Konfigurasi Tailwind CSS untuk `darkMode: 'class'` di `tailwind.config.js`
  - [x] 7.3 Tambahkan script inline di `src/app.html` untuk menerapkan tema sebelum render (mencegah flash of unstyled content)

- [x] 8. Panel Admin - Dasbor dan Manajemen Postingan
  - [x] 8.1 Buat admin layout (`src/routes/admin/+layout.svelte` dan `+layout.server.js`) dengan auth guard yang redirect ke login jika tidak ada sesi valid
  - [x] 8.2 Implementasikan dasbor admin (`src/routes/admin/+page.svelte` dan `+page.server.js`) yang menampilkan daftar semua postingan dengan status dan tanggal
  - [x] 8.3 Buat komponen `src/lib/components/MarkdownEditor.svelte` dengan split-pane textarea dan preview reaktif menggunakan `renderMarkdown`
  - [x] 8.4 Implementasikan halaman buat postingan baru (`src/routes/admin/posts/new/`) dengan form yang memanggil `PostService.createPost` dan auto-generate slug
  - [x] 8.5 Implementasikan halaman edit postingan (`src/routes/admin/posts/[id]/`) dengan form yang memanggil `PostService.updatePost`
  - [x] 8.6 Implementasikan form action delete di `src/routes/admin/posts/[id]/+page.server.js` yang memanggil `PostService.deletePost` (cascade delete komentar) dengan konfirmasi dialog di UI
  - [x] 8.7 Tambahkan pesan konfirmasi "Postingan berhasil disimpan." setelah save berhasil dan pesan error "Gagal menyimpan postingan. Silakan coba lagi." jika gagal

- [x] 9. Styling dan Responsivitas
  - [x] 9.1 Implementasikan desain minimalis dengan Tailwind CSS: tipografi yang mudah dibaca, spasi yang cukup, palet warna yang memenuhi WCAG 2.1 AA
  - [x] 9.2 Pastikan semua halaman responsif dari 320px hingga 2560px menggunakan Tailwind responsive prefixes
  - [x] 9.3 Implementasikan dark mode styles untuk semua komponen menggunakan Tailwind `dark:` prefix
  - [x] 9.4 Pastikan navigasi dapat digunakan pada perangkat layar sentuh (touch targets minimal 44x44px)

- [x] 10. Property-Based Tests
  - [x] 10.1 Setup Vitest dan fast-check, konfigurasi `vite.config.js` untuk test
  - [x] 10.2 Tulis property test untuk **Property 1** (slug uniqueness): generate judul acak dan set slug yang ada, verifikasi slug baru tidak bertabrakan — `tests/unit/slug.property.test.js`
  - [x] 10.3 Tulis property test untuk **Property 2** (komentar whitespace ditolak): generate string whitespace acak, verifikasi validasi menolak — `tests/unit/comment-validation.property.test.js`
  - [x] 10.4 Tulis property test untuk **Property 3** (nama default Anonym): generate string kosong/whitespace acak sebagai nama, verifikasi hasil "Anonym" — `tests/unit/comment-validation.property.test.js`
  - [x] 10.5 Tulis property test untuk **Property 4** (filter kategori konsisten): generate array postingan acak, filter, verifikasi semua hasil memiliki kategori yang diminta — `tests/unit/post-filter.property.test.js`
  - [x] 10.6 Tulis property test untuk **Property 5** (urutan postingan terbaru): generate array postingan acak, sort, verifikasi urutan descending — `tests/unit/post-sort.property.test.js`
  - [x] 10.7 Tulis property test untuk **Property 6** (urutan komentar terlama ke terbaru): generate array komentar acak, sort, verifikasi urutan ascending — `tests/unit/comment-sort.property.test.js`
  - [x] 10.8 Tulis property test untuk **Property 7** (XSS sanitization): generate string dengan pola XSS acak, sanitize, verifikasi tidak ada tag/atribut berbahaya — `tests/unit/sanitize.property.test.js`
  - [x] 10.9 Tulis property test untuk **Property 8** (Markdown render idempoten): generate string Markdown acak, render dua kali, verifikasi output identik — `tests/unit/markdown.property.test.js`
  - [x] 10.10 Tulis property test untuk **Property 9** (proteksi rute admin): generate rute admin dan token tidak valid, verifikasi selalu redirect ke login — `tests/unit/auth-guard.property.test.js`

- [x] 11. Unit Tests dan Integration Tests
  - [x] 11.1 Tulis unit tests untuk `slug.js`: generateSlug dari berbagai judul, sufiks numerik untuk slug duplikat — `tests/unit/slug.test.js`
  - [x] 11.2 Tulis unit tests untuk `markdown.js`: render heading, paragraf, tebal, miring, daftar, kutipan, blok kode — `tests/unit/markdown.test.js`
  - [x] 11.3 Tulis unit tests untuk `sanitize.js`: sanitizeCommentContent dan normalizeAuthorName — `tests/unit/sanitize.test.js`
  - [x] 11.4 Setup `mongodb-memory-server` untuk integration tests
  - [x] 11.5 Tulis integration tests untuk `PostService`: CRUD operations, cascade delete komentar saat post dihapus — `tests/integration/post.service.test.js`
  - [x] 11.6 Tulis integration tests untuk `CommentService`: addComment, getCommentsByPostId — `tests/integration/comment.service.test.js`
  - [x] 11.7 Tulis integration tests untuk `AuthService`: verifyCredentials, createSession, validateSession, destroySession — `tests/integration/auth.service.test.js`
