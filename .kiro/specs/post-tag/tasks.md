# Tasks — Post Tag

## Task List

- [x] 1. Update Post Model dan PostService
  - [x] 1.1 Tambah field `tags: [String]` dengan default `[]` ke `PostSchema` di `src/lib/server/models/Post.js`
  - [x] 1.2 Tambah index `{ tags: 1, status: 1, updatedAt: -1 }` ke `PostSchema`
  - [x] 1.3 Tambah dan ekspor helper `generateTagSlug(tagName)` di `src/lib/server/post.service.js`
  - [x] 1.4 Update `createPost` untuk menerima parameter `tags` opsional (default `[]`) dengan normalisasi lowercase+trim+deduplikasi
  - [x] 1.5 Update `updatePost` untuk menerima parameter `tags` opsional dengan normalisasi; jika `tags` undefined, tidak mengubah tags yang ada
  - [x] 1.6 Update `listPosts` untuk menyertakan field `tags` di `.select()`
  - [x] 1.7 Implementasi method `getAllTags()` menggunakan MongoDB aggregation (`$unwind`, `$group`, `$sort`) yang mengembalikan tag unik terurut alfabetis
  - [x] 1.8 Implementasi method `getPostsByTag(tagSlug)` yang mengembalikan published posts yang memiliki tag dengan slug yang cocok, diurutkan `updatedAt` descending

- [x] 2. Buat API Endpoint `/api/tags`
  - [x] 2.1 Buat file `src/routes/api/tags/+server.js` dengan GET handler yang memanggil `postService.getAllTags()` dan mengembalikan JSON

- [x] 3. Buat Komponen `TagInput`
  - [x] 3.1 Buat file `src/lib/components/TagInput.svelte` dengan props: `tags`, `existingTags`, `name`
  - [x] 3.2 Implementasi tampilan tag pills dengan tombol hapus (×) untuk setiap tag yang sudah ditambahkan
  - [x] 3.3 Implementasi input text dengan event handler untuk Enter dan koma yang menambahkan tag baru (normalize, deduplikasi)
  - [x] 3.4 Implementasi dropdown autocomplete yang memfilter `existingTags` berdasarkan teks yang diketik (case-insensitive)
  - [x] 3.5 Implementasi klik pada saran autocomplete untuk menambahkan tag ke daftar
  - [x] 3.6 Render setiap tag sebagai `<input type="hidden" name="tags" value="...">` untuk form submission

- [x] 4. Update Admin Post Editor — Halaman Baru (`/admin/posts/new`)
  - [x] 4.1 Update `src/routes/admin/posts/new/+page.server.js`: tambah parsing `tags` dari `formData.getAll('tags')` di kedua actions (`saveDraft`, `publish`)
  - [x] 4.2 Update `src/routes/admin/posts/new/+page.svelte`: import dan gunakan komponen `TagInput`, fetch existing tags dari `/api/tags` saat `onMount`

- [x] 5. Update Admin Post Editor — Halaman Edit (`/admin/posts/[id]`)
  - [x] 5.1 Update `src/routes/admin/posts/[id]/+page.server.js` load function: tambah `postService.getAllTags()` secara paralel dan sertakan `existingTags` di return value
  - [x] 5.2 Update semua actions di `+page.server.js` (`saveDraft`, `publish`, `update`): tambah parsing `tags` dari `formData.getAll('tags')` dan sertakan saat memanggil `updatePost`
  - [x] 5.3 Update `src/routes/admin/posts/[id]/+page.svelte`: import dan gunakan komponen `TagInput` dengan `bind:tags` diinisialisasi dari `data.post.tags` dan `existingTags={data.existingTags}`

- [x] 6. Update Tampilan Publik — PostCard
  - [x] 6.1 Update `src/lib/components/PostCard.svelte`: import `generateTagSlug` dan tambah tampilan tag pills di bawah excerpt, hanya jika `post.tags && post.tags.length > 0`
  - [x] 6.2 Setiap tag dirender sebagai `<a href="/tag/{generateTagSlug(tag)}">` dengan `on:click|stopPropagation` untuk mencegah navigasi ke post detail

- [x] 7. Update Tampilan Publik — Halaman Detail Post
  - [x] 7.1 Update `src/routes/[slug]/+page.svelte`: import `generateTagSlug` dan tambah tampilan tag di header artikel, hanya jika `data.post.tags && data.post.tags.length > 0`
  - [x] 7.2 Setiap tag dirender sebagai `<a href="/tag/{generateTagSlug(tag)}">` dengan styling yang konsisten dengan desain halaman

- [x] 8. Buat Route Tag Filter Page (`/tag/[tag-slug]`)
  - [x] 8.1 Buat file `src/routes/tag/[tag-slug]/+page.server.js` dengan load function yang memanggil `postService.getPostsByTag(params['tag-slug'])` dan mengembalikan `{ posts, tagSlug, displayName }`
  - [x] 8.2 Buat file `src/routes/tag/[tag-slug]/+page.svelte` yang menampilkan heading dengan nama tag, daftar `PostCard`, dan empty state message jika tidak ada postingan

- [x] 9. Tulis Tests
  - [x] 9.1 Tulis property-based tests di `tests/post-tag.property.test.js` menggunakan fast-check untuk Properties 1–9 dari design document
  - [x] 9.2 Tulis unit tests untuk `PostService` (getAllTags, getPostsByTag, normalisasi tags) di `src/lib/server/post.service.test.js`
  - [x] 9.3 Tulis unit tests untuk komponen `TagInput` di `src/lib/components/TagInput.test.js`
  - [x] 9.4 Tulis unit tests untuk `PostCard` dengan tags di `src/lib/components/PostCard.test.js`
  - [x] 9.5 Jalankan semua tests dan pastikan lulus
