# Design Document — Post Tag

## Overview

Fitur Post Tag menambahkan kemampuan kategorisasi granular pada postingan blog melalui sistem tag yang fleksibel. Tag disimpan langsung sebagai array di dalam dokumen `Post` di MongoDB (embedded document pattern), bukan sebagai koleksi terpisah — pendekatan ini konsisten dengan skala aplikasi dan menghindari join yang tidak perlu.

Perubahan bersifat **additive** dan backward-compatible: field `tags` ditambahkan ke model `Post` dengan default array kosong, sehingga postingan lama tetap valid tanpa migrasi data.

Fitur ini terdiri dari empat area perubahan:
1. **Data layer** — field `tags` pada model `Post` + operasi baru di `PostService`
2. **Admin UI** — komponen `TagInput` dengan autocomplete di Post Editor
3. **Public UI** — tampilan tag di `PostCard` dan halaman detail post
4. **Route baru** — `/tag/[tag-slug]` untuk filter postingan berdasarkan tag

---

## Architecture

```mermaid
graph TD
    subgraph Admin
        A[Post Editor /admin/posts/new] -->|tags[]| B[TagInput Component]
        C[Post Editor /admin/posts/id] -->|tags[]| B
        B -->|GET /api/tags| D[/api/tags +server.js]
        D --> E[PostService.getAllTags]
        A -->|POST saveDraft/publish| F[+page.server.js new]
        C -->|POST saveDraft/publish/update| G[+page.server.js id]
        F --> H[PostService.createPost]
        G --> I[PostService.updatePost]
    end

    subgraph Public
        J[Public Feed /] --> K[PostCard Component]
        K -->|tag link| L[/tag/tag-slug]
        M[Post Detail /slug] -->|tag link| L
        L --> N[/tag/tag-slug +page.server.js]
        N --> O[PostService.getPostsByTag]
    end

    subgraph Database
        H --> P[(MongoDB Post)]
        I --> P
        E --> P
        O --> P
    end
```

Tidak ada perubahan arsitektur besar. Semua logika tag dikelola di `PostService` dan dikonsumsi oleh server-side load/action functions. Komponen Svelte hanya menerima data dan merender UI yang sesuai.

---

## Components and Interfaces

### 1. Post Model (`src/lib/server/models/Post.js`)

Tambah field `tags` ke `PostSchema`:

```js
tags: {
  type: [String],
  default: [],
}
```

Index baru untuk query tag yang efisien:

```js
PostSchema.index({ tags: 1, status: 1, updatedAt: -1 });
```

### 2. PostService (`src/lib/server/post.service.js`)

#### `createPost({ title, content, category, status?, tags? })`

```js
// Sebelum
async createPost({ title, content, category, status = 'draft' })

// Sesudah
async createPost({ title, content, category, status = 'draft', tags = [] })
```

- Parameter `tags` opsional, default `[]`.
- Sebelum disimpan, setiap tag di-normalize: `tag.trim().toLowerCase()`.
- Duplikat dihapus setelah normalisasi.

#### `updatePost(id, { title?, content?, category?, status?, tags? })`

```js
// Sebelum
async updatePost(id, { title, content, category, status })

// Sesudah
async updatePost(id, { title, content, category, status, tags })
```

- Jika `tags` diberikan (termasuk array kosong), normalize dan simpan.
- Jika `tags` tidak diberikan (`undefined`), tags tidak berubah (preservasi eksplisit).

#### `listPosts(category?, status?)` — tidak berubah

- Tambah `tags` ke `.select()` agar tersedia di PostCard.

#### `getPostBySlug(slug)` — tidak berubah

- Field `tags` sudah ikut karena tidak ada `.select()` yang membatasi.

#### `getAllTags()` — **baru**

```js
async getAllTags() {
  await connectDb();
  const result = await Post.aggregate([
    { $unwind: '$tags' },
    { $group: { _id: '$tags' } },
    { $sort: { _id: 1 } },
  ]);
  return result.map(r => r._id);
}
```

- Menggunakan MongoDB aggregation untuk efisiensi.
- Mengembalikan array string tag yang sudah dideduplikasi dan diurutkan alfabetis.
- Hanya tag dari postingan yang masih ada (karena tags embedded, otomatis konsisten saat post dihapus).

#### `getPostsByTag(tagSlug)` — **baru**

```js
async getPostsByTag(tagSlug) {
  await connectDb();
  // Ambil semua published posts yang punya tags, lalu filter di aplikasi
  // berdasarkan slug match — karena slug generation tidak bisa di-reverse di query
  const posts = await Post.find({ status: 'published', tags: { $exists: true, $ne: [] } })
    .select('title slug category excerpt tags status createdAt updatedAt')
    .sort({ updatedAt: -1 })
    .lean();
  return posts
    .filter(p => p.tags.some(tag => generateTagSlug(tag) === tagSlug))
    .map(p => ({ ...p, _id: p._id.toString() }));
}
```

- Filter di aplikasi layer karena slug generation tidak bisa di-reverse secara efisien di MongoDB query.
- Alternatif: simpan `tagSlugs` sebagai field terpisah di array (lihat catatan di Data Models).
- Hanya mengembalikan postingan berstatus `published`.
- Diurutkan berdasarkan `updatedAt` descending.

#### `generateTagSlug(tagName)` — **helper baru** (diekspor)

```js
export function generateTagSlug(tagName) {
  return tagName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}
```

- Pure function, diekspor agar bisa digunakan di komponen Svelte untuk generate link href.
- Digunakan di `PostService` dan di komponen UI.

### 3. API Route: `/api/tags` (`src/routes/api/tags/+server.js`) — **baru**

```js
import { json } from '@sveltejs/kit';
import { postService } from '$lib/server/post.service.js';

export async function GET() {
  const tags = await postService.getAllTags();
  return json(tags);
}
```

- Endpoint publik (tidak perlu auth) karena tag yang sudah ada bukan data sensitif.
- Digunakan oleh `TagInput` untuk autocomplete.

### 4. Komponen `TagInput` (`src/lib/components/TagInput.svelte`) — **baru**

Props:
```js
export let tags = [];          // array tag saat ini (two-way binding via bind:tags)
export let existingTags = [];  // daftar tag yang sudah ada untuk autocomplete
export let name = 'tags';      // nama field untuk form submission
```

Behavior:
- Menampilkan daftar tag yang sudah ditambahkan sebagai "pill" dengan tombol hapus (×).
- Input text untuk mengetik tag baru.
- Saat mengetik, filter `existingTags` yang mengandung teks input (case-insensitive) → tampilkan sebagai dropdown.
- Tekan Enter atau koma → tambahkan tag baru (normalize, deduplikasi).
- Klik saran autocomplete → tambahkan tag tersebut.
- Setiap tag dirender sebagai `<input type="hidden" name="tags" value="...">` untuk form submission.

### 5. Route: `/admin/posts/new` (`+page.server.js`) — diperbarui

```js
// parseFormData ditambah:
const tags = data.getAll('tags').map(t => t.toString().trim()).filter(Boolean);

// createPost dipanggil dengan tags:
await postService.createPost({ title, content, category, status: 'draft', tags });
```

### 6. Route: `/admin/posts/new` (`+page.svelte`) — diperbarui

```svelte
<script>
  import TagInput from '$lib/components/TagInput.svelte';
  // ...
  let tags = [];
  let existingTags = [];
  
  onMount(async () => {
    const res = await fetch('/api/tags');
    existingTags = await res.json();
  });
</script>

<!-- Di dalam form: -->
<TagInput bind:tags {existingTags} />
```

### 7. Route: `/admin/posts/[id]` (`+page.server.js`) — diperbarui

Load function: tambah `getAllTags()` untuk autocomplete.

```js
export async function load({ params }) {
  // ...existing code...
  const [fullPost, existingTags] = await Promise.all([
    postService.getPostBySlug(post.slug),
    postService.getAllTags(),
  ]);
  return {
    post: { ...fullPost, _id: fullPost._id.toString(), ... },
    existingTags,
  };
}
```

Actions: semua actions yang menyimpan konten (saveDraft, publish, update) ditambah parsing tags:

```js
const tags = data.getAll('tags').map(t => t.toString().trim()).filter(Boolean);
// Sertakan tags saat memanggil updatePost
await postService.updatePost(params.id, { title, content, category, status, tags });
```

### 8. Route: `/admin/posts/[id]` (`+page.svelte`) — diperbarui

```svelte
<TagInput bind:tags={currentTags} existingTags={data.existingTags} />
```

- `currentTags` diinisialisasi dari `data.post.tags`.

### 9. Komponen `PostCard` (`src/lib/components/PostCard.svelte`) — diperbarui

Tambah tampilan tag di bawah excerpt:

```svelte
{#if post.tags && post.tags.length > 0}
  <div class="flex flex-wrap gap-1.5 mt-2">
    {#each post.tags as tag}
      <a
        href="/tag/{generateTagSlug(tag)}"
        class="..."
        on:click|stopPropagation
      >
        #{tag}
      </a>
    {/each}
  </div>
{/if}
```

- `on:click|stopPropagation` mencegah klik tag memicu navigasi ke post detail (karena PostCard dibungkus `<a>`).

### 10. Route: `/[slug]` (`+page.svelte`) — diperbarui

Tambah tampilan tag di header artikel:

```svelte
{#if data.post.tags && data.post.tags.length > 0}
  <div class="flex flex-wrap gap-2 mt-4">
    {#each data.post.tags as tag}
      <a href="/tag/{generateTagSlug(tag)}" class="...">
        #{tag}
      </a>
    {/each}
  </div>
{/if}
```

### 11. Route: `/tag/[tag-slug]` — **baru**

**`+page.server.js`:**

```js
import { postService } from '$lib/server/post.service.js';

export async function load({ params }) {
  const tagSlug = params['tag-slug'];
  const posts = await postService.getPostsByTag(tagSlug);
  
  // Derive display name from first matching tag in results
  const displayName = posts.length > 0
    ? posts[0].tags.find(t => generateTagSlug(t) === tagSlug) ?? tagSlug
    : tagSlug.replace(/-/g, ' ');

  return { posts, tagSlug, displayName };
}
```

**`+page.svelte`:**

```svelte
<h1>#{data.displayName}</h1>

{#if data.posts.length === 0}
  <p>Tidak ada postingan ditemukan untuk tag ini.</p>
{:else}
  {#each data.posts as post (post._id)}
    <PostCard {post} />
  {/each}
{/if}
```

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
  tags:      [String],        // default: [], normalized (lowercase, trimmed)
  createdAt: Date,            // auto (timestamps)
  updatedAt: Date,            // auto (timestamps)
}
```

### Tag Normalization

Setiap tag yang masuk ke database melalui proses normalisasi:

```
Input: "  Web Development  "
→ trim: "Web Development"
→ lowercase: "web development"
→ stored: "web development"

Tag_Slug: "web-development"
```

Normalisasi dilakukan di `PostService` sebelum menyimpan, bukan di komponen UI, sehingga konsistensi terjamin terlepas dari cara tag dimasukkan.

### Tag Slug Generation

```
"web development"  → "web-development"
"C++ Programming"  → "c-programming"   (karakter + dihapus)
"node.js"          → "nodejs"          (titik dihapus)
"react & vue"      → "react--vue"      → setelah cleanup: "react-vue"
```

Catatan: slug generation bersifat lossy (tidak bisa di-reverse). Untuk query di database, `getPostsByTag` mengambil semua published posts lalu filter di aplikasi layer. Ini acceptable untuk skala blog personal.

### Index Strategy

```js
// Untuk query tag filter page
PostSchema.index({ tags: 1, status: 1, updatedAt: -1 });

// Index yang sudah ada (dari post-draft)
PostSchema.index({ status: 1, category: 1, updatedAt: -1 });
PostSchema.index({ status: 1, updatedAt: -1 });
```

### Backward Compatibility

Postingan lama yang tidak memiliki field `tags` akan mengembalikan `undefined` dari MongoDB. Semua komponen UI menggunakan guard `post.tags && post.tags.length > 0` untuk menangani ini. `PostService.listPosts` tidak perlu diubah karena Mongoose akan mengembalikan `[]` untuk field array yang tidak ada (berkat schema default).

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

Sebelum menulis properties final, berikut analisis redundansi:

- **1.3 dan 1.4** (normalisasi saat simpan + tags dikembalikan saat ambil) → keduanya bagian dari satu round-trip property. Digabung menjadi "Tag normalization round-trip".
- **2.4 dan 2.5** (tambah tag + deduplikasi) → keduanya tentang state tag list setelah operasi tambah. Bisa digabung: "Adding a tag is idempotent".
- **4.1, 4.2, 4.3 dan 5.1, 5.2, 5.3** (tampilan tag di feed dan detail) → keduanya tentang rendering tag sebagai link dengan href yang benar. Karena keduanya menggunakan fungsi `generateTagSlug` yang sama, property tentang slug generation mencakup keduanya. Digabung menjadi satu property tentang tag link generation.
- **6.1, 6.2, 6.3, 6.7** (filter page: konten, status, urutan, query logic) → semuanya tentang hasil `getPostsByTag`. Digabung menjadi dua properties: satu tentang correctness filter, satu tentang ordering.
- **7.2 dan 7.3** (isolasi saat delete + getAllTags konsisten) → keduanya tentang konsistensi setelah delete. Digabung menjadi satu property "Tag isolation on delete".
- **3.2** (getAllTags deduplikasi + sorted) → sudah cukup spesifik, tetap sebagai satu property.

Properties final setelah refleksi:

---

### Property 1: Tag Normalization Round-Trip

*For any* postingan yang dibuat atau diperbarui dengan daftar tag apapun (termasuk tag dengan mixed case dan whitespace), mengambil kembali postingan tersebut dari database harus mengembalikan tag dalam bentuk lowercase yang sudah di-trim — dan jumlah tag tidak boleh lebih banyak dari input setelah deduplikasi.

**Validates: Requirements 1.3, 1.4, 2.7**

---

### Property 2: Tag Slug Generation Correctness

*For any* tag name string, `generateTagSlug` harus menghasilkan string yang hanya mengandung karakter `[a-z0-9-]`, dan setiap spasi dalam input harus menjadi tanda hubung dalam output.

**Validates: Requirements 1.5**

---

### Property 3: Tag Autocomplete Filtering

*For any* query string dan daftar tag yang ada, hasil filter autocomplete harus hanya mengandung tag yang mengandung query string tersebut sebagai substring (case-insensitive).

**Validates: Requirements 2.2**

---

### Property 4: Tag Addition is Idempotent

*For any* daftar tag dan tag yang sudah ada dalam daftar tersebut, menambahkan tag yang sama lagi harus menghasilkan daftar yang identik — panjang dan isi tidak berubah.

**Validates: Requirements 2.5**

---

### Property 5: Tag Removal Correctness

*For any* daftar tag dengan minimal satu tag, menghapus sebuah tag harus menghasilkan daftar yang tidak mengandung tag tersebut, dan semua tag lain tetap ada.

**Validates: Requirements 2.6**

---

### Property 6: getAllTags Returns Deduplicated Sorted List

*For any* kumpulan postingan dengan tag (termasuk tag yang sama di beberapa postingan), `getAllTags` harus mengembalikan daftar di mana: (1) tidak ada tag yang muncul lebih dari sekali, dan (2) daftar diurutkan secara alfabetis ascending.

**Validates: Requirements 3.1, 3.2**

---

### Property 7: Tag Filter Returns Only Matching Published Posts

*For any* tag slug dan kumpulan postingan dengan berbagai tag dan status, `getPostsByTag` harus mengembalikan daftar di mana: (1) setiap postingan memiliki minimal satu tag yang slug-nya cocok dengan parameter, dan (2) tidak ada postingan berstatus `draft` dalam hasil.

**Validates: Requirements 6.1, 6.2, 6.7**

---

### Property 8: Tag Filter Results are Sorted by updatedAt Descending

*For any* hasil dari `getPostsByTag` yang mengandung lebih dari satu postingan, setiap pasangan postingan berurutan harus memiliki `updatedAt[i] >= updatedAt[i+1]`.

**Validates: Requirements 6.3**

---

### Property 9: Tag Isolation on Delete

*For any* dua postingan yang berbagi minimal satu tag yang sama, menghapus salah satu postingan harus: (1) tidak mengubah tag postingan yang lain, dan (2) `getAllTags` tidak mengembalikan tag yang hanya digunakan oleh postingan yang dihapus.

**Validates: Requirements 7.2, 7.3**

---

## Error Handling

| Skenario | Penanganan |
|----------|-----------|
| `getAllTags` gagal (DB error) | API `/api/tags` mengembalikan `json([], { status: 500 })`, TagInput tetap berfungsi tanpa autocomplete |
| `getPostsByTag` gagal (DB error) | `error(503, 'Layanan sedang tidak tersedia.')` |
| Tag slug tidak cocok dengan tag manapun | `getPostsByTag` mengembalikan `[]`, halaman menampilkan empty state |
| Tag input mengandung karakter tidak valid | Normalisasi di service layer menghapus karakter tidak valid dari slug; tag name tetap disimpan apa adanya setelah trim+lowercase |
| Tags array terlalu panjang | Tidak ada batasan eksplisit di schema; bisa ditambahkan validasi di service jika diperlukan |
| `updatePost` dengan tags kosong `[]` | Tags di-update menjadi array kosong (intentional — admin menghapus semua tag) |
| Postingan lama tanpa field `tags` | Guard `post.tags && post.tags.length > 0` di semua komponen UI mencegah error rendering |

---

## Testing Strategy

### Dual Testing Approach

Fitur ini menggunakan kombinasi unit test dan property-based test:

- **Unit tests** — untuk skenario spesifik: rendering kondisional, empty state, integrasi komponen
- **Property-based tests** — untuk memverifikasi invariant yang berlaku di semua input: normalisasi, slug generation, filtering, ordering

### Property-Based Testing

Library yang digunakan: **[fast-check](https://github.com/dubzzz/fast-check)** (sudah terpasang di `package.json`).

Konfigurasi: minimum **100 iterasi** per property test.

Setiap property test diberi tag komentar:
```js
// Feature: post-tag, Property N: <property_text>
```

**Property tests yang akan diimplementasikan:**

| Property | Test | Arbitraries |
|----------|------|-------------|
| P1: Tag Normalization Round-Trip | Buat post dengan tags random (mixed case, whitespace), ambil kembali, verifikasi normalisasi | `fc.array(fc.string())` untuk tags |
| P2: Tag Slug Generation Correctness | Generate random tag names, verifikasi slug hanya `[a-z0-9-]` dan spasi → `-` | `fc.string()` untuk tag name |
| P3: Tag Autocomplete Filtering | Generate random query dan tag list, verifikasi semua hasil mengandung query | `fc.string()`, `fc.array(fc.string())` |
| P4: Tag Addition is Idempotent | Generate tag list dengan minimal 1 tag, tambahkan tag yang sudah ada, verifikasi tidak berubah | `fc.array(fc.string(), { minLength: 1 })` |
| P5: Tag Removal Correctness | Generate tag list, hapus satu tag, verifikasi tag hilang dan sisanya tetap | `fc.array(fc.string(), { minLength: 1 })` |
| P6: getAllTags Deduplicated Sorted | Buat posts dengan tags random (termasuk duplikat), verifikasi hasil unik dan sorted | `fc.array(fc.array(fc.string()))` |
| P7: Tag Filter Matching + Published Only | Buat posts dengan berbagai tags dan status, filter by slug, verifikasi hasil | `fc.array(fc.record(...))` |
| P8: Tag Filter Sorted by updatedAt | Verifikasi ordering dari hasil getPostsByTag | `fc.array(fc.record(...))` |
| P9: Tag Isolation on Delete | Buat dua posts dengan shared tag, hapus satu, verifikasi isolasi | `fc.record(...)` untuk post data |

### Unit Tests

- Render `PostCard` dengan post yang memiliki tags → verifikasi tag links muncul dengan href yang benar
- Render `PostCard` dengan post tanpa tags → verifikasi tidak ada tag area
- Render `TagInput` → verifikasi input dan pill rendering
- `TagInput`: tambah tag via Enter → verifikasi tag muncul di list
- `TagInput`: tambah tag via koma → verifikasi tag muncul di list
- `TagInput`: hapus tag → verifikasi tag hilang dari list
- `TagInput`: autocomplete filter → verifikasi saran yang muncul sesuai query
- Render `/tag/[tag-slug]` dengan posts → verifikasi heading dan daftar postingan
- Render `/tag/[tag-slug]` tanpa posts → verifikasi empty state message
- `PostService.createPost` tanpa tags → verifikasi `tags === []`
- `PostService.updatePost` tanpa tags parameter → verifikasi tags tidak berubah

### Integration Tests

- End-to-end: buat post dengan tags → verifikasi tags muncul di public feed
- End-to-end: klik tag di PostCard → verifikasi navigasi ke `/tag/[slug]`
- End-to-end: `/tag/[slug]` hanya menampilkan published posts dengan tag tersebut
- End-to-end: hapus post → verifikasi tag tidak muncul di `getAllTags` jika tidak digunakan post lain

### Test File Structure

```
src/
  lib/
    server/
      post.service.test.js          # Unit + property tests untuk PostService (tambah tag methods)
    components/
      TagInput.test.js              # Unit tests untuk TagInput component
      PostCard.test.js              # Unit tests untuk PostCard dengan tags
  routes/
    tag/
      [tag-slug]/
        +page.server.test.js        # Unit tests untuk tag filter page load
    admin/
      posts/
        new/
          +page.server.test.js      # Update: tambah tags parsing
        [id]/
          +page.server.test.js      # Update: tambah tags parsing
tests/
  post-tag.property.test.js         # Property-based tests (fast-check)
  post-tag.integration.test.js      # Integration tests
```
