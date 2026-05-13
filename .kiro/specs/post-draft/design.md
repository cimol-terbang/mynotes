# Design Document — Post Draft

## Overview

Fitur Post Draft menambahkan field `status` (`draft` | `published`) ke model `Post` yang sudah ada, dengan perubahan minimal dan backward-compatible. Pendekatan yang diambil adalah **additive** — tidak ada field yang dihapus atau diubah tipe datanya, hanya menambahkan field baru dengan nilai default yang aman (`draft`).

Strategi migrasi menggunakan MongoDB default value: semua dokumen lama yang tidak memiliki field `status` akan diperlakukan sebagai `published` melalui migrasi satu kali, karena postingan yang sudah ada sebelum fitur ini diasumsikan sudah dipublikasikan.

Perubahan dibagi menjadi tiga lapisan:
1. **Data layer** — schema `Post` + `PostService`
2. **Server layer** — SvelteKit `+page.server.js` di route admin dan publik
3. **UI layer** — komponen Svelte di halaman admin

---

## Architecture

```mermaid
graph TD
    A[Admin Browser] -->|POST ?/saveDraft| B[/admin/posts/new +page.server.js]
    A -->|POST ?/publish| B
    A -->|POST ?/saveDraft| C[/admin/posts/id +page.server.js]
    A -->|POST ?/publish| C
    A -->|POST ?/unpublish| C
    A -->|POST ?/update| C
    B --> D[PostService.createPost]
    C --> E[PostService.updatePost]
    D --> F[(MongoDB Post)]
    E --> F

    G[Public Browser] -->|GET /| H[/ +page.server.js]
    G -->|GET /slug| I[/slug +page.server.js]
    H --> J[PostService.listPosts status:published]
    I --> K[PostService.getPostBySlug + status check]
    J --> F
    K --> F
```

Tidak ada perubahan arsitektur besar. Semua logika status dikelola di `PostService` dan dikonsumsi oleh server-side load/action functions. Komponen Svelte hanya menerima data dan merender UI yang sesuai.

---

## Components and Interfaces

### 1. Post Model (`src/lib/server/models/Post.js`)

Tambah field `status` ke `PostSchema`:

```js
status: {
  type: String,
  enum: ['draft', 'published'],
  default: 'draft',
  required: true,
}
```

Index baru untuk query publik yang efisien:

```js
PostSchema.index({ status: 1, category: 1, updatedAt: -1 });
PostSchema.index({ status: 1, updatedAt: -1 });
```

### 2. PostService (`src/lib/server/post.service.js`)

#### `listPosts(category?, status?)`

```js
// Sebelum
async listPosts(category)

// Sesudah
async listPosts(category, status)
```

- Jika `status` diberikan, tambahkan ke filter query.
- Public feed memanggil `listPosts(category, 'published')`.
- Admin panel memanggil `listPosts()` tanpa filter status (tampilkan semua).
- Sort diubah dari `createdAt: -1` menjadi `updatedAt: -1`.
- Field `status` ditambahkan ke `.select()`.

#### `createPost({ title, content, category, status? })`

```js
// Sebelum
async createPost({ title, content, category })

// Sesudah
async createPost({ title, content, category, status = 'draft' })
```

- Parameter `status` opsional, default `'draft'`.

#### `updatePost(id, { title?, content?, category?, status? })`

```js
// Sebelum
async updatePost(id, { title, content, category })

// Sesudah
async updatePost(id, { title, content, category, status })
```

- Jika `status` diberikan, masukkan ke `$set`.
- Jika tidak diberikan, status tidak berubah (preservasi eksplisit).

### 3. Route: `/admin/posts/new` (`+page.server.js`)

Tambah dua named actions menggantikan satu `default` action:

| Action | Deskripsi |
|--------|-----------|
| `saveDraft` | Buat post dengan `status: 'draft'`, redirect ke `/admin/posts/[id]` |
| `publish` | Buat post dengan `status: 'published'`, redirect ke `/admin?success=published` |

### 4. Route: `/admin/posts/[id]` (`+page.server.js`)

Tambah named actions baru di samping yang sudah ada:

| Action | Deskripsi |
|--------|-----------|
| `update` (diperbarui) | Update konten tanpa mengubah status (preservasi) |
| `saveDraft` | Update konten + set `status: 'draft'` |
| `publish` | Update konten + set `status: 'published'`, redirect ke `/admin` |
| `unpublish` | Set `status: 'draft'`, redirect ke halaman yang sama |
| `delete` (tidak berubah) | Hapus post |

### 5. Route: `/` (`+page.server.js`)

```js
// Sebelum
postService.listPosts(activeCategory ?? undefined)

// Sesudah
postService.listPosts(activeCategory ?? undefined, 'published')
```

### 6. Route: `/[slug]` (`+page.server.js`)

Setelah `getPostBySlug`, tambah pengecekan status:

```js
if (!post || post.status === 'draft') {
  throw error(404, 'Tulisan tidak ditemukan.');
}
```

### 7. UI: `/admin/posts/new` (`+page.svelte`)

Ganti satu tombol "Simpan Tulisan" dengan dua tombol menggunakan `formaction`:

```html
<!-- Tombol Simpan Draft -->
<button type="submit" formaction="?/saveDraft" ...>
  Simpan Draft
</button>

<!-- Tombol Publikasikan -->
<button type="submit" formaction="?/publish" ...>
  Publikasikan
</button>
```

### 8. UI: `/admin/posts/[id]` (`+page.svelte`)

Tombol aksi bersifat kontekstual berdasarkan `data.post.status`:

**Jika status `draft`:**
- Tombol "Simpan Draft" (`formaction="?/saveDraft"`)
- Tombol "Publikasikan" (`formaction="?/publish"`)

**Jika status `published`:**
- Tombol "Perbarui" (`formaction="?/update"`)
- Tombol "Jadikan Draft" (`formaction="?/unpublish"`)

Badge status ditampilkan di header halaman edit.

### 9. UI: `/admin` (`+page.svelte`)

Tambah kolom "Status" di tabel postingan dengan badge visual:

- **Draft**: badge abu-abu/kuning — `bg-yellow-100 text-yellow-800`
- **Published**: badge hijau — `bg-green-100 text-green-800`

Sort berdasarkan `updatedAt` (sudah ditangani di service layer).

---

## Data Models

### Post Schema (setelah perubahan)

```js
{
  title:     String,          // required
  slug:      String,          // required, unique
  content:   String,          // required
  category:  String,          // enum: ['essay', 'poetry', 'story'], required
  excerpt:   String,          // required
  status:    String,          // enum: ['draft', 'published'], default: 'draft', required
  createdAt: Date,            // auto (timestamps)
  updatedAt: Date,            // auto (timestamps)
}
```

### Migration Strategy

Dokumen lama di MongoDB tidak memiliki field `status`. Strategi migrasi:

1. **Mongoose default** — field `status` dengan `default: 'draft'` hanya berlaku untuk dokumen baru. Dokumen lama yang di-query akan mengembalikan `status: undefined`.

2. **One-time migration script** — jalankan sekali sebelum deploy:

```js
// scripts/migrate-post-status.js
await Post.updateMany(
  { status: { $exists: false } },
  { $set: { status: 'published' } }
);
```

Alasan: postingan yang sudah ada sebelum fitur ini diasumsikan sudah dipublikasikan (sudah live di blog). Menetapkan mereka sebagai `draft` akan menyembunyikan konten yang sudah ada dari publik.

3. **Defensive fallback** — di `PostService.listPosts` untuk public feed, filter menggunakan `{ status: 'published' }` sehingga dokumen tanpa field `status` (jika migrasi belum dijalankan) tidak akan muncul di feed publik. Ini adalah perilaku yang aman.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

Sebelum menulis properties final, berikut analisis redundansi:

- **1.3 dan 1.4** (status tersimpan + status dikembalikan) → keduanya adalah bagian dari satu round-trip property, digabung.
- **2.2 dan 2.3** (saveDraft → draft, publish → published) → keduanya tentang status persistence dari action, bisa digabung sebagai "action menentukan status".
- **3.1** (publish mengubah status) → sudah tercakup oleh 2.3, dihapus.
- **5.1 dan 5.4** (draft → 404) → duplikat, digabung.
- **5.2 dan 5.3** (public feed hanya published) → duplikat, digabung.
- **6.1 dan 6.2** (update preservasi status) → bisa digabung menjadi satu property "update tanpa status tidak mengubah status".

Properties final setelah refleksi:

---

### Property 1: Status Round-Trip

*For any* postingan yang dibuat dengan status valid (`draft` atau `published`), mengambil kembali postingan tersebut dari database harus mengembalikan nilai `status` yang sama persis dengan yang disimpan.

**Validates: Requirements 1.1, 1.3, 1.4**

---

### Property 2: Default Status adalah Draft

*For any* kombinasi data postingan yang valid (title, content, category) yang dibuat tanpa menentukan field `status`, `PostService.createPost` harus mengembalikan postingan dengan `status === 'draft'`.

**Validates: Requirements 1.2**

---

### Property 3: Action Menentukan Status

*For any* data postingan yang valid, jika disimpan dengan action `saveDraft` maka status yang tersimpan harus `draft`; jika disimpan dengan action `publish` maka status yang tersimpan harus `published`.

**Validates: Requirements 2.2, 2.3, 3.1**

---

### Property 4: Update Mempreservasi Status

*For any* postingan yang sudah ada dengan status apapun, memanggil `updatePost` dengan perubahan konten (title, content, category) tanpa menyertakan field `status` harus mempertahankan nilai `status` yang lama — tidak mengubahnya.

**Validates: Requirements 6.1, 6.2**

---

### Property 5: Public Feed Hanya Menampilkan Published

*For any* kumpulan postingan dengan berbagai status, memanggil `listPosts` dengan filter `status: 'published'` harus mengembalikan daftar yang tidak mengandung satu pun postingan berstatus `draft`.

**Validates: Requirements 5.2, 5.3**

---

### Property 6: Draft Tidak Dapat Diakses Publik

*For any* postingan berstatus `draft`, mencoba mengaksesnya melalui slug di route publik harus menghasilkan error 404 — sama seperti postingan yang tidak ditemukan.

**Validates: Requirements 5.1, 5.4**

---

### Property 7: Publish-Unpublish Round-Trip

*For any* postingan, mempublikasikannya lalu menjadikannya draft kembali harus menghasilkan postingan dengan `status === 'draft'`; sebaliknya, menjadikan draft lalu mempublikasikan harus menghasilkan `status === 'published'`.

**Validates: Requirements 3.5**

---

## Error Handling

| Skenario | Penanganan |
|----------|-----------|
| `createPost` gagal (DB error) | `fail(500, { error: '...' })`, tidak redirect |
| `updatePost` gagal (DB error) | `fail(500, { error: '...' })`, tidak redirect |
| `updatePost` tidak menemukan post | `error(404, '...')` |
| Akses slug draft oleh publik | `error(404, 'Tulisan tidak ditemukan.')` |
| Status value tidak valid di form | Validasi di server action sebelum memanggil service |
| Migrasi belum dijalankan | Defensive filter di `listPosts` mencegah draft muncul di public feed |

Semua error message menggunakan bahasa Indonesia yang konsisten dengan codebase yang ada.

---

## Testing Strategy

### Dual Testing Approach

Fitur ini menggunakan kombinasi unit test dan property-based test:

- **Unit tests** — untuk skenario spesifik: redirect behavior, UI rendering berdasarkan status, error handling
- **Property-based tests** — untuk memverifikasi invariant yang berlaku di semua input: status persistence, filtering, round-trips

### Property-Based Testing

Library yang digunakan: **[fast-check](https://github.com/dubzzz/fast-check)** (JavaScript/TypeScript, cocok untuk SvelteKit).

Konfigurasi: minimum **100 iterasi** per property test.

Setiap property test diberi tag komentar:
```js
// Feature: post-draft, Property N: <property_text>
```

**Property tests yang akan diimplementasikan:**

| Property | Test | Arbitraries |
|----------|------|-------------|
| P1: Status Round-Trip | Buat post dengan status random valid, ambil kembali, bandingkan | `fc.constantFrom('draft', 'published')` |
| P2: Default Status Draft | Buat post tanpa status, verifikasi `status === 'draft'` | `fc.string()` untuk title/content |
| P3: Action Menentukan Status | Submit form dengan action random, verifikasi status sesuai | `fc.constantFrom('saveDraft', 'publish')` |
| P4: Update Preservasi Status | Update post dengan konten random, verifikasi status tidak berubah | `fc.string()` untuk fields |
| P5: Public Feed Filter | Buat posts dengan status random, filter published, verifikasi tidak ada draft | `fc.array(fc.constantFrom('draft', 'published'))` |
| P6: Draft → 404 | Generate draft post, akses via slug, verifikasi 404 | `fc.string()` untuk slug |
| P7: Publish-Unpublish Round-Trip | Publish lalu unpublish, verifikasi kembali ke draft | `fc.record(...)` untuk post data |

### Unit Tests

- Render `+page.svelte` admin post editor dengan post draft → verifikasi tombol "Simpan Draft" dan "Publikasikan" ada
- Render editor dengan post published → verifikasi tombol "Perbarui" dan "Jadikan Draft" ada
- Render admin panel dengan daftar mixed status → verifikasi badge status muncul di setiap row
- Server action `saveDraft` dengan DB error → verifikasi `fail(500)` dikembalikan
- Server action `publish` sukses → verifikasi redirect ke `/admin`
- Server action `saveDraft` untuk post baru → verifikasi redirect ke `/admin/posts/[id]`

### Integration Tests

- End-to-end: buat draft → edit → publish → verifikasi muncul di public feed
- End-to-end: buat draft → akses via slug publik → verifikasi 404
- Migration script: jalankan pada collection dengan dokumen tanpa `status` → verifikasi semua di-set ke `published`

### Test File Structure

```
src/
  lib/
    server/
      post.service.test.js       # Unit + property tests untuk PostService
  routes/
    admin/
      posts/
        new/
          +page.server.test.js   # Unit tests untuk actions
        [id]/
          +page.server.test.js   # Unit tests untuk actions
    [slug]/
      +page.server.test.js       # Unit tests untuk draft 404
tests/
  post-draft.property.test.js    # Property-based tests (fast-check)
  post-draft.integration.test.js # Integration tests
scripts/
  migrate-post-status.js         # Migration script
```
