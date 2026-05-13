# Implementation Plan: Post Draft

## Overview

Implementasi fitur Post Draft secara bertahap: mulai dari data layer (model + service), lanjut ke server layer (route actions), kemudian UI layer (komponen Svelte), dan diakhiri dengan migration script serta test suite. Setiap langkah membangun di atas langkah sebelumnya sehingga tidak ada kode yang tergantung tanpa integrasi.

## Tasks

- [x] 1. Update Post model — tambah field `status` dan index baru
  - Di `src/lib/server/models/Post.js`, tambahkan field `status` ke `PostSchema`:
    ```js
    status: { type: String, enum: ['draft', 'published'], default: 'draft', required: true }
    ```
  - Hapus dua index lama (`{ category, createdAt }` dan `{ createdAt }`) dan ganti dengan:
    ```js
    PostSchema.index({ status: 1, category: 1, updatedAt: -1 });
    PostSchema.index({ status: 1, updatedAt: -1 });
    ```
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Update PostService — perbarui `listPosts`, `createPost`, dan `updatePost`
  - [x] 2.1 Perbarui `listPosts(category, status)` di `src/lib/server/post.service.js`
    - Tambah parameter `status` opsional ke signature method
    - Jika `status` diberikan, tambahkan ke objek `filter`: `if (status) filter.status = status`
    - Tambah field `status` ke `.select()`: `'title slug category excerpt status createdAt updatedAt'`
    - Ubah sort dari `{ createdAt: -1 }` menjadi `{ updatedAt: -1 }`
    - _Requirements: 1.4, 4.3, 5.2, 5.3_

  - [x] 2.2 Perbarui `createPost` di `src/lib/server/post.service.js`
    - Ubah signature menjadi `createPost({ title, content, category, status = 'draft' })`
    - Sertakan `status` saat memanggil `Post.create({ title, slug, content, category, excerpt, status })`
    - _Requirements: 1.2, 2.2, 2.3_

  - [x] 2.3 Perbarui `updatePost` di `src/lib/server/post.service.js`
    - Ubah signature menjadi `updatePost(id, { title, content, category, status })`
    - Tambah kondisi: `if (status !== undefined) update.status = status`
    - Jika `status` tidak diberikan, field `status` tidak masuk ke `$set` (preservasi eksplisit)
    - _Requirements: 6.1, 6.2_

  - [x] 2.4 Tulis property test untuk PostService — Property 1: Status Round-Trip
    - **Property 1: Status Round-Trip** — buat post dengan status valid acak, ambil kembali via `getPostBySlug`, verifikasi `status` yang dikembalikan sama persis
    - Gunakan `fc.constantFrom('draft', 'published')` sebagai arbitrary untuk status
    - Gunakan `mongodb-memory-server` untuk isolasi test
    - Tag komentar: `// Feature: post-draft, Property 1: Status Round-Trip`
    - **Validates: Requirements 1.1, 1.3, 1.4**
    - Tulis di `tests/post-draft.property.test.js`

  - [x] 2.5 Tulis property test untuk PostService — Property 2: Default Status adalah Draft
    - **Property 2: Default Status adalah Draft** — buat post tanpa field `status`, verifikasi `status === 'draft'`
    - Gunakan `fc.record({ title: fc.string({ minLength: 1 }), content: fc.string({ minLength: 1 }), category: fc.constantFrom('essay', 'poetry', 'story') })` sebagai arbitrary
    - Tag komentar: `// Feature: post-draft, Property 2: Default Status adalah Draft`
    - **Validates: Requirements 1.2**
    - Tulis di `tests/post-draft.property.test.js`

  - [ ]* 2.6 Tulis property test untuk PostService — Property 4: Update Mempreservasi Status
    - **Property 4: Update Mempreservasi Status** — buat post dengan status tertentu, panggil `updatePost` dengan konten baru tanpa menyertakan `status`, verifikasi status tidak berubah
    - Gunakan `fc.constantFrom('draft', 'published')` untuk status awal dan `fc.string({ minLength: 1 })` untuk konten baru
    - Tag komentar: `// Feature: post-draft, Property 4: Update Mempreservasi Status`
    - **Validates: Requirements 6.1, 6.2**
    - Tulis di `tests/post-draft.property.test.js`

  - [ ]* 2.7 Tulis property test untuk PostService — Property 5: Public Feed Hanya Menampilkan Published
    - **Property 5: Public Feed Hanya Menampilkan Published** — buat array post dengan status acak, panggil `listPosts(undefined, 'published')`, verifikasi tidak ada satu pun post berstatus `draft` dalam hasil
    - Gunakan `fc.array(fc.constantFrom('draft', 'published'), { minLength: 1, maxLength: 10 })` sebagai arbitrary
    - Tag komentar: `// Feature: post-draft, Property 5: Public Feed Hanya Menampilkan Published`
    - **Validates: Requirements 5.2, 5.3**
    - Tulis di `tests/post-draft.property.test.js`

- [x] 3. Checkpoint — Pastikan semua tests PostService lulus
  - Pastikan semua tests lulus, tanyakan kepada user jika ada pertanyaan.

- [x] 4. Update route actions — `/admin/posts/new/+page.server.js`
  - Di `src/routes/admin/posts/new/+page.server.js`, hapus `default` action dan ganti dengan dua named actions:
  - **Action `saveDraft`**: ambil `title`, `content`, `category` dari form data; validasi sama seperti sebelumnya; panggil `postService.createPost({ title, content, category, status: 'draft' })`; redirect ke `/admin/posts/${post._id}`
  - **Action `publish`**: ambil `title`, `content`, `category` dari form data; validasi sama; panggil `postService.createPost({ title, content, category, status: 'published' })`; redirect ke `/admin?success=published`
  - Kedua actions mengembalikan `fail(400, ...)` untuk validasi error dan `fail(500, ...)` untuk DB error
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6_

  - [ ]* 4.1 Tulis unit test untuk action `saveDraft` (post baru)
    - Verifikasi: `createPost` dipanggil dengan `status: 'draft'`
    - Verifikasi: redirect ke `/admin/posts/[id]` setelah sukses
    - Verifikasi: `fail(500)` dikembalikan jika DB error
    - Tulis di `src/routes/admin/posts/new/+page.server.test.js`
    - _Requirements: 2.2, 2.4, 2.6_

  - [ ]* 4.2 Tulis unit test untuk action `publish` (post baru)
    - Verifikasi: `createPost` dipanggil dengan `status: 'published'`
    - Verifikasi: redirect ke `/admin?success=published` setelah sukses
    - Tulis di `src/routes/admin/posts/new/+page.server.test.js`
    - _Requirements: 2.3_

- [x] 5. Update route actions — `/admin/posts/[id]/+page.server.js`
  - [x] 5.1 Perbarui action `update` di `src/routes/admin/posts/[id]/+page.server.js`
    - Ubah panggilan `postService.updatePost(params.id, { title, content, category })` — **jangan** sertakan `status` agar status dipreservasi
    - Redirect tetap ke `/admin?success=updated`
    - _Requirements: 6.1, 6.2_

  - [x] 5.2 Tambah action `saveDraft` di `src/routes/admin/posts/[id]/+page.server.js`
    - Ambil `title`, `content`, `category` dari form data; validasi sama seperti action `update`
    - Panggil `postService.updatePost(params.id, { title, content, category, status: 'draft' })`
    - Jika sukses, kembalikan `{ success: true }` (tetap di halaman yang sama, tidak redirect)
    - Jika post tidak ditemukan, throw `error(404, ...)`
    - Jika DB error, kembalikan `fail(500, ...)`
    - _Requirements: 2.2, 2.5, 2.6, 6.1_

  - [x] 5.3 Tambah action `publish` di `src/routes/admin/posts/[id]/+page.server.js`
    - Ambil `title`, `content`, `category` dari form data; validasi sama
    - Panggil `postService.updatePost(params.id, { title, content, category, status: 'published' })`
    - Jika sukses, redirect ke `/admin?success=published`
    - _Requirements: 2.3, 3.1, 3.2_

  - [x] 5.4 Tambah action `unpublish` di `src/routes/admin/posts/[id]/+page.server.js`
    - Panggil `postService.updatePost(params.id, { status: 'draft' })` (hanya ubah status, tidak perlu validasi konten)
    - Jika sukses, redirect ke `/admin/posts/${params.id}` (halaman yang sama)
    - _Requirements: 3.4, 3.5_

  - [ ]* 5.5 Tulis unit test untuk actions di `/admin/posts/[id]`
    - Test `saveDraft`: verifikasi `updatePost` dipanggil dengan `status: 'draft'`, tidak redirect
    - Test `publish`: verifikasi `updatePost` dipanggil dengan `status: 'published'`, redirect ke `/admin`
    - Test `unpublish`: verifikasi `updatePost` dipanggil dengan `{ status: 'draft' }`, redirect ke halaman yang sama
    - Test `update`: verifikasi `updatePost` dipanggil **tanpa** field `status`
    - Tulis di `src/routes/admin/posts/[id]/+page.server.test.js`
    - _Requirements: 6.1, 6.2, 3.1, 3.5_

  - [ ]* 5.6 Tulis property test — Property 3: Action Menentukan Status
    - **Property 3: Action Menentukan Status** — untuk data post valid acak, jika action `saveDraft` dipanggil maka status tersimpan harus `draft`; jika action `publish` dipanggil maka status tersimpan harus `published`
    - Gunakan `fc.constantFrom('saveDraft', 'publish')` sebagai arbitrary untuk action
    - Tag komentar: `// Feature: post-draft, Property 3: Action Menentukan Status`
    - **Validates: Requirements 2.2, 2.3, 3.1**
    - Tulis di `tests/post-draft.property.test.js`

- [x] 6. Update public routes — filter draft dari public feed dan slug
  - [x] 6.1 Perbarui `src/routes/+page.server.js`
    - Ubah panggilan `postService.listPosts(activeCategory ?? undefined)` menjadi `postService.listPosts(activeCategory ?? undefined, 'published')`
    - _Requirements: 5.2, 5.3_

  - [x] 6.2 Perbarui `src/routes/[slug]/+page.server.js`
    - Setelah `getPostBySlug` berhasil, tambah pengecekan status sebelum return:
      ```js
      if (!post || post.status === 'draft') {
        throw error(404, 'Tulisan tidak ditemukan.');
      }
      ```
    - Pastikan `getPostBySlug` sudah mengembalikan field `status` (tidak perlu `.select()` karena menggunakan `.lean()` tanpa projection)
    - _Requirements: 5.1, 5.4_

  - [ ]* 6.3 Tulis unit test untuk draft 404 di `/[slug]`
    - Test: akses slug post berstatus `draft` → verifikasi `error(404)` dilempar
    - Test: akses slug post berstatus `published` → verifikasi data post dikembalikan
    - Tulis di `src/routes/[slug]/+page.server.test.js`
    - _Requirements: 5.1, 5.4_

  - [ ]* 6.4 Tulis property test — Property 6: Draft Tidak Dapat Diakses Publik
    - **Property 6: Draft Tidak Dapat Diakses Publik** — untuk sembarang post berstatus `draft`, akses via slug di route publik harus menghasilkan error 404
    - Gunakan `fc.string({ minLength: 1 })` untuk slug dan `fc.record(...)` untuk data post
    - Tag komentar: `// Feature: post-draft, Property 6: Draft Tidak Dapat Diakses Publik`
    - **Validates: Requirements 5.1, 5.4**
    - Tulis di `tests/post-draft.property.test.js`

- [x] 7. Checkpoint — Pastikan semua tests server layer lulus
  - Pastikan semua tests lulus, tanyakan kepada user jika ada pertanyaan.

- [x] 8. Update UI — `/admin/posts/new/+page.svelte`
  - Di `src/routes/admin/posts/new/+page.svelte`, ganti satu tombol "Simpan Tulisan" dengan dua tombol menggunakan `formaction`:
    - Tombol "Simpan Draft": `type="submit"` dengan `formaction="?/saveDraft"`, style sekunder (border, tidak solid)
    - Tombol "Publikasikan": `type="submit"` dengan `formaction="?/publish"`, style primer (solid dark)
  - Kedua tombol harus di-disable saat `submitting = true`
  - Perbarui logika `use:enhance` agar `submitting` di-reset setelah kedua action selesai
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 9. Update UI — `/admin/posts/[id]/+page.svelte`
  - [x] 9.1 Tambah badge status di header halaman edit di `src/routes/admin/posts/[id]/+page.svelte`
    - Di bawah `<h1>Edit Tulisan</h1>`, tambah badge inline:
      - Jika `data.post.status === 'draft'`: `<span class="... bg-yellow-100 text-yellow-800 ...">Draft</span>`
      - Jika `data.post.status === 'published'`: `<span class="... bg-green-100 text-green-800 ...">Dipublikasikan</span>`
    - _Requirements: 6.3_

  - [x] 9.2 Ganti tombol aksi dengan tombol kontekstual berdasarkan status di `src/routes/admin/posts/[id]/+page.svelte`
    - Hapus form `action="?/update"` yang ada di `<form method="POST">`
    - Jika `data.post.status === 'draft'`:
      - Tombol "Simpan Draft" (`formaction="?/saveDraft"`, style sekunder)
      - Tombol "Publikasikan" (`formaction="?/publish"`, style primer)
    - Jika `data.post.status === 'published'`:
      - Tombol "Perbarui" (`formaction="?/update"`, style primer)
      - Tombol "Jadikan Draft" (`formaction="?/unpublish"`, style sekunder/warning)
    - Semua tombol di-disable saat `submitting = true`
    - _Requirements: 2.1, 3.3, 3.4_

  - [x] 9.3 Tambah form terpisah untuk action `unpublish` di `src/routes/admin/posts/[id]/+page.svelte`
    - Action `unpublish` tidak membutuhkan field konten, buat `<form method="POST" action="?/unpublish">` terpisah di luar form utama
    - Tombol "Jadikan Draft" berada di dalam form ini
    - _Requirements: 3.4, 3.5_

- [x] 10. Update UI — `/admin/+page.svelte`
  - Di `src/routes/admin/+page.svelte`, tambah kolom "Status" di tabel postingan:
    - Tambah `<th>` baru "Status" di `<thead>` setelah kolom "Kategori"
    - Tambah `<td>` baru di setiap row `{#each data.posts as post}` dengan badge visual:
      - Draft: `<span class="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Draft</span>`
      - Published: `<span class="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Dipublikasikan</span>`
    - Kolom status bisa disembunyikan di layar kecil dengan `hidden sm:table-cell`
  - _Requirements: 4.1, 4.2, 4.4_

- [x] 11. Buat migration script
  - Buat file `scripts/migrate-post-status.js`
  - Script melakukan `Post.updateMany({ status: { $exists: false } }, { $set: { status: 'published' } })` untuk semua dokumen lama yang belum memiliki field `status`
  - Tambah logging: jumlah dokumen yang diperbarui dan konfirmasi selesai
  - Script harus bisa dijalankan standalone: import `connectDb` dan `Post`, jalankan migrasi, lalu tutup koneksi
  - _Requirements: (migration strategy dari design)_

  - [ ]* 11.1 Tulis integration test untuk migration script
    - Gunakan `mongodb-memory-server` untuk isolasi
    - Buat beberapa dokumen tanpa field `status`, jalankan migration script, verifikasi semua dokumen di-set ke `'published'`
    - Verifikasi dokumen yang sudah memiliki `status` tidak terpengaruh
    - Tulis di `tests/post-draft.integration.test.js`

- [x] 12. Tulis integration tests end-to-end
  - [ ]* 12.1 Integration test: buat draft → akses via slug publik → verifikasi 404
    - Gunakan `mongodb-memory-server`
    - Buat post dengan `status: 'draft'`, panggil `getPostBySlug` lalu cek kondisi status, verifikasi error 404 dilempar
    - Tulis di `tests/post-draft.integration.test.js`
    - _Requirements: 5.1, 5.4_

  - [ ]* 12.2 Integration test: buat draft → publish → verifikasi muncul di `listPosts('published')`
    - Buat post dengan `status: 'draft'`, panggil `updatePost` dengan `status: 'published'`, panggil `listPosts(undefined, 'published')`, verifikasi post muncul dalam hasil
    - Tulis di `tests/post-draft.integration.test.js`
    - _Requirements: 3.1, 5.2, 5.3_

  - [ ]* 12.3 Tulis property test — Property 7: Publish-Unpublish Round-Trip
    - **Property 7: Publish-Unpublish Round-Trip** — untuk sembarang post, publish lalu unpublish harus menghasilkan `status === 'draft'`; unpublish lalu publish harus menghasilkan `status === 'published'`
    - Gunakan `fc.constantFrom('draft', 'published')` untuk status awal
    - Tag komentar: `// Feature: post-draft, Property 7: Publish-Unpublish Round-Trip`
    - **Validates: Requirements 3.5**
    - Tulis di `tests/post-draft.property.test.js`

- [x] 13. Final checkpoint — Pastikan semua tests lulus
  - Pastikan semua tests lulus, tanyakan kepada user jika ada pertanyaan.

## Notes

- Tasks bertanda `*` bersifat opsional dan dapat dilewati untuk MVP yang lebih cepat
- Setiap task mereferensikan requirement spesifik untuk traceability
- Property tests menggunakan **fast-check** dengan minimum **100 iterasi** per property
- Integration tests menggunakan **mongodb-memory-server** untuk isolasi database
- Urutan implementasi: Data Layer → Server Layer → UI Layer → Migration → Tests
- Semua pesan error menggunakan Bahasa Indonesia, konsisten dengan codebase yang ada
- Action `unpublish` menggunakan form terpisah karena tidak membutuhkan field konten dari form utama
