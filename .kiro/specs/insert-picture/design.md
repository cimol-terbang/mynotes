# Design Document — Insert Picture

## Overview

Fitur **Insert Picture** menambahkan kemampuan menyisipkan gambar ke dalam konten postingan blog melalui dua jalur: (1) shortcode kustom yang ditulis langsung di editor Markdown, dan (2) UI helper berupa form inline dan tombol upload file. Gambar dirender menjadi HTML aman oleh pipeline `renderMarkdown()` yang sudah ada, sehingga tampilan di pratinjau editor dan di halaman frontend selalu konsisten.

Pendekatan desain mengutamakan **minimal perubahan pada infrastruktur yang ada**: `renderMarkdown()` diperluas dengan pre-processor shortcode, `MarkdownEditor.svelte` mendapat toolbar baru, dan satu server route baru ditambahkan untuk upload file. Tidak ada perubahan pada skema database atau model Post.

---

## Architecture

```mermaid
graph TD
    subgraph "Admin Editor (Browser)"
        A[MarkdownEditor.svelte] -->|shortcode text| B[renderMarkdown]
        A --> C[ImageInsertForm.svelte]
        A --> D[ImageUploader.svelte]
        C -->|insert shortcode| A
        D -->|POST multipart/form-data| E[/api/images/upload]
        D -->|insert shortcode| A
    end

    subgraph "Shared Utility"
        B[renderMarkdown] --> F[parseImageShortcodes]
        F -->|expanded HTML| G[marked.parse]
        G -->|raw HTML| H[DOMPurify.sanitize]
        H -->|safe HTML| B
    end

    subgraph "Server"
        E -->|validate + save| I[static/uploads/images/]
        E -->|JSON response| D
    end

    subgraph "Frontend (Visitor)"
        J[PostContent.svelte] -->|content string| B
        B -->|safe HTML| J
    end
```

**Alur data utama:**

1. Admin menulis shortcode `{{image:URL|alt=...|caption=...|size=...}}` di textarea.
2. `renderMarkdown()` memanggil `parseImageShortcodes()` terlebih dahulu untuk mengubah shortcode menjadi HTML `<img>` / `<figure>`, lalu meneruskan hasilnya ke `marked.parse()`, kemudian ke `DOMPurify.sanitize()`.
3. Output HTML aman ditampilkan di panel pratinjau (editor) dan di `PostContent.svelte` (frontend) — keduanya memanggil fungsi yang sama.
4. Untuk upload file, `ImageUploader.svelte` mengirim `multipart/form-data` ke `POST /api/images/upload`, menerima URL, lalu menyisipkan shortcode ke textarea.

---

## Components and Interfaces

### 1. `parseImageShortcodes(content: string): string`

Fungsi baru di `src/lib/utils/markdown.js`. Dipanggil di awal `renderMarkdown()` sebelum `marked.parse()`.

```js
/**
 * Mengubah shortcode {{image:URL|alt=...|caption=...|size=...}}
 * menjadi HTML <img> atau <figure> yang siap diproses marked + DOMPurify.
 *
 * @param {string} content - Konten Markdown mentah
 * @returns {string} - Konten dengan shortcode sudah diganti HTML
 */
export function parseImageShortcodes(content)
```

**Regex pattern:** `/\{\{image:([^|}]+)(\|[^}]*)?\}\}/g`

**Parameter parsing:** Split bagian parameter dengan `|`, lalu setiap parameter di-split dengan `=` (key pertama, value sisanya).

**Parameter yang dikenali:** `alt`, `caption`, `size` (nilai valid: `small`, `medium`, `large`, `full`). Parameter lain diabaikan.

**URL validation:** Hanya izinkan `https://`, `http://`, atau path yang dimulai dengan `/`. URL lain menghasilkan `<img>` tanpa atribut `src`.

**Output HTML:**
- Tanpa caption: `<img src="URL" alt="ALT" class="img-SIZE">`
- Dengan caption: `<figure><img src="URL" alt="ALT" class="img-SIZE"><figcaption>CAPTION</figcaption></figure>`

**Escaping:** Nilai `alt` dan `caption` di-escape (`<` → `&lt;`, `>` → `&gt;`, `"` → `&quot;`) sebelum dimasukkan ke atribut HTML.

---

### 2. `renderMarkdown(content: string): string` (diperbarui)

Di `src/lib/utils/markdown.js`. Pipeline diperbarui:

```
content
  → parseImageShortcodes(content)   // baru: ekspansi shortcode
  → marked.parse(expanded)
  → DOMPurify.sanitize(rawHtml)
  → return safeHtml
```

Tidak ada perubahan pada signature atau perilaku untuk konten Markdown biasa.

---

### 3. `MarkdownEditor.svelte` (diperbarui)

Komponen yang sudah ada diperluas dengan:

- **Toolbar** di atas textarea berisi dua tombol: "Sisipkan Gambar" dan "Unggah Gambar".
- **State** untuk mengontrol visibilitas form inline (`showInsertForm`).
- **Ref ke textarea** untuk mendapatkan posisi kursor dan menyisipkan teks.

**Props baru:** tidak ada — tetap `value`, `name`, `label`.

**Internal state baru:**
```js
let showInsertForm = false;   // kontrol visibilitas ImageInsertForm
let uploading = false;        // status upload sedang berjalan
let uploadError = '';         // pesan error upload
let textareaEl;               // bind:this ke textarea element
```

**Fungsi helper:**
```js
function insertAtCursor(text) {
  const start = textareaEl.selectionStart;
  const end = textareaEl.selectionEnd;
  value = value.slice(0, start) + text + value.slice(end);
  // restore cursor position setelah tick
}
```

---

### 4. `ImageInsertForm.svelte` (baru)

Komponen form inline di `src/lib/components/ImageInsertForm.svelte`.

**Props:**
```ts
export let onInsert: (shortcode: string) => void;
export let onCancel: () => void;
```

**Fields:**
- URL gambar (required)
- Alt text (optional)
- Caption (optional)
- Size: dropdown `default | small | medium | large | full`

**Events:**
- Submit → validasi URL tidak kosong → bangun shortcode → panggil `onInsert(shortcode)`.
- Cancel / Escape → panggil `onCancel()`.

**Shortcode builder:**
```js
function buildShortcode(url, alt, caption, size) {
  let sc = `{{image:${url}`;
  if (alt)     sc += `|alt=${alt}`;
  if (caption) sc += `|caption=${caption}`;
  if (size && size !== 'default') sc += `|size=${size}`;
  sc += '}}';
  return sc;
}
```

---

### 5. `POST /api/images/upload` (baru)

Route baru di `src/routes/api/images/upload/+server.js`.

**Auth:** Dilindungi oleh `hooks.server.js` — route `/api/images/upload` ditambahkan ke `PROTECTED_ROUTES` regex, atau divalidasi secara eksplisit di dalam handler.

**Request:** `multipart/form-data` dengan field `file`.

**Validasi:**
- Tipe MIME: hanya `image/jpeg`, `image/png`, `image/gif`, `image/webp`.
- Ukuran: maksimal 5MB (5 × 1024 × 1024 bytes).

**Nama file unik:** `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.EXT`

**Direktori penyimpanan:** `static/uploads/images/` (dibuat otomatis jika belum ada).

**Response sukses (HTTP 200):**
```json
{ "url": "/uploads/images/NAMA_FILE" }
```

**Response error:**
```json
{ "error": "pesan error" }
```

---

### 6. `PostContent.svelte` — CSS size classes (diperbarui)

Tambahkan style untuk class gambar di `src/app.css` atau sebagai scoped style di `PostContent.svelte`:

```css
.img-small  { width: 25%; }
.img-medium { width: 50%; }
.img-large  { width: 75%; }
.img-full   { width: 100%; }

/* Responsif: gambar tidak melebihi lebar kontainer */
img { max-width: 100%; height: auto; }
figure { margin: 1rem 0; }
figcaption { font-size: 0.875rem; color: #6b7280; text-align: center; margin-top: 0.25rem; }
```

---

## Data Models

Tidak ada perubahan pada skema database. Model `Post` tetap menyimpan konten sebagai string Markdown mentah yang mengandung shortcode. Shortcode diproses saat render, bukan saat penyimpanan.

**File yang disimpan di filesystem:**

```
static/
  uploads/
    images/
      {timestamp}-{random}.jpg
      {timestamp}-{random}.png
      ...
```

File gambar yang diupload tidak ditrack di database — URL-nya langsung disematkan dalam shortcode di konten postingan.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Fitur ini melibatkan fungsi transformasi teks (`parseImageShortcodes`) dan validasi input (URL, tipe file, ukuran file) yang merupakan pure functions dengan input/output yang jelas. Property-based testing sangat sesuai untuk memverifikasi kebenaran parser shortcode dan pipeline keamanan.

---

### Property 1: Shortcode dasar menghasilkan elemen img dengan atribut yang benar

*For any* URL yang valid dan alt text yang diberikan, shortcode `{{image:URL|alt=ALT}}` yang diproses oleh `parseImageShortcodes` SHALL menghasilkan string HTML yang mengandung elemen `<img>` dengan atribut `src` berisi URL tersebut dan atribut `alt` berisi ALT tersebut.

**Validates: Requirements 1.2, 1.3**

---

### Property 2: Shortcode dengan caption menghasilkan struktur figure/figcaption

*For any* URL yang valid dan caption text yang diberikan, shortcode `{{image:URL|caption=CAPTION}}` yang diproses oleh `parseImageShortcodes` SHALL menghasilkan string HTML yang mengandung elemen `<figure>` dengan `<figcaption>` berisi teks caption tersebut.

**Validates: Requirements 1.4, 7.2**

---

### Property 3: Parameter size menghasilkan class CSS yang sesuai

*For any* URL yang valid dan nilai size dari himpunan `{small, medium, large, full}`, shortcode `{{image:URL|size=SIZE}}` yang diproses oleh `parseImageShortcodes` SHALL menghasilkan elemen `<img>` dengan class CSS `img-SIZE` yang sesuai.

**Validates: Requirements 1.5, 1.6, 1.7, 1.8, 7.3**

---

### Property 4: Kombinasi semua parameter menghasilkan output yang lengkap

*For any* kombinasi URL valid, alt text, caption, dan size yang valid, shortcode dengan semua parameter tersebut yang diproses oleh `parseImageShortcodes` SHALL menghasilkan HTML yang mengandung semua atribut dan elemen yang sesuai secara bersamaan (atribut `alt`, class CSS size, elemen `<figure>` dan `<figcaption>`).

**Validates: Requirements 1.10**

---

### Property 5: Karakter HTML dalam alt dan caption di-escape dengan benar

*For any* string yang mengandung karakter `<`, `>`, atau `"` yang digunakan sebagai nilai `alt` atau `caption` dalam shortcode, `parseImageShortcodes` SHALL menghasilkan HTML di mana karakter tersebut direpresentasikan sebagai HTML entities (`&lt;`, `&gt;`, `&quot;`) sehingga tidak dapat diinterpretasikan sebagai markup HTML.

**Validates: Requirements 2.3**

---

### Property 6: URL dengan protokol tidak diizinkan tidak menghasilkan atribut src

*For any* URL yang tidak dimulai dengan `https://`, `http://`, atau `/`, shortcode yang mengandung URL tersebut yang diproses oleh `parseImageShortcodes` SHALL menghasilkan elemen `<img>` tanpa atribut `src`, sehingga mencegah eksekusi protokol berbahaya seperti `javascript:`.

**Validates: Requirements 2.4, 2.5**

---

### Property 7: Renderer bersifat deterministik

*For any* string konten yang mengandung shortcode gambar, memanggil `renderMarkdown(content)` dua kali dengan input yang sama SHALL selalu menghasilkan output HTML yang identik, tanpa bergantung pada state eksternal atau waktu eksekusi.

**Validates: Requirements 8.1, 8.2, 8.3, 3.4**

---

### Property 8: Upload file valid menghasilkan URL unik dalam respons

*For any* file gambar yang valid (tipe MIME diizinkan, ukuran ≤ 5MB), setiap panggilan ke Upload_Endpoint SHALL menghasilkan respons JSON dengan field `url` yang berisi path unik berbentuk `/uploads/images/NAMA_FILE`, dan tidak ada dua upload yang menghasilkan URL yang sama.

**Validates: Requirements 6.2, 6.4**

---

### Property 9: Validasi tipe MIME pada upload endpoint

*For any* tipe MIME yang bukan `image/jpeg`, `image/png`, `image/gif`, atau `image/webp`, Upload_Endpoint SHALL mengembalikan respons HTTP 400 dengan body JSON yang mengandung field `error`.

**Validates: Requirements 6.6, 5.7**

---

## Error Handling

| Skenario | Komponen | Penanganan |
|---|---|---|
| URL kosong pada form insert | `ImageInsertForm.svelte` | Tampilkan pesan validasi inline, jangan sisipkan shortcode |
| File >5MB dipilih | `ImageUploader.svelte` | Tampilkan error sebelum upload, jangan kirim ke server |
| Tipe MIME tidak valid | `ImageUploader.svelte` | Tampilkan error sebelum upload, jangan kirim ke server |
| Server mengembalikan error 400/500 | `ImageUploader.svelte` | Tampilkan pesan error dari respons server, aktifkan kembali tombol |
| URL dengan protokol berbahaya di shortcode | `parseImageShortcodes` | Hasilkan `<img>` tanpa `src`, DOMPurify sebagai lapisan kedua |
| Tag HTML dalam alt/caption | `parseImageShortcodes` | Escape ke HTML entities sebelum dimasukkan ke atribut |
| Gagal menulis file ke disk | Upload endpoint | Log error, kembalikan HTTP 500 dengan pesan generik |
| Direktori upload belum ada | Upload endpoint | Buat direktori secara otomatis dengan `fs.mkdir(..., { recursive: true })` |

---

## Testing Strategy

### Unit Tests (Vitest)

Fokus pada fungsi `parseImageShortcodes` dan validasi di upload endpoint:

- Shortcode minimal `{{image:URL}}` → menghasilkan `<img>` dengan src dan alt kosong.
- Shortcode dengan semua parameter → menghasilkan `<figure>` lengkap.
- URL dengan `javascript:` → `<img>` tanpa `src`.
- Alt/caption dengan karakter HTML → di-escape dengan benar.
- Parameter tidak dikenal → diabaikan, gambar tetap dirender.
- Konten tanpa shortcode → tidak berubah (backward compatibility).

### Property-Based Tests (fast-check — sudah tersedia di devDependencies)

Library: **fast-check** (sudah ada di `package.json`).

Setiap property test dikonfigurasi dengan minimum **100 iterasi**.

Tag format: `// Feature: insert-picture, Property N: <deskripsi>`

- **Property 1** — Generate URL valid acak + alt text acak → verifikasi atribut `src` dan `alt` pada output.
- **Property 2** — Generate URL valid acak + caption acak → verifikasi struktur `<figure>/<figcaption>`.
- **Property 3** — Generate URL valid acak + size acak dari `{small, medium, large, full}` → verifikasi class CSS.
- **Property 4** — Generate kombinasi acak semua parameter → verifikasi semua atribut dan elemen hadir.
- **Property 5** — Generate string dengan karakter HTML acak sebagai alt/caption → verifikasi di-escape.
- **Property 6** — Generate URL dengan protokol acak yang tidak valid → verifikasi tidak ada atribut `src`.
- **Property 7** — Generate konten acak dengan shortcode → panggil `renderMarkdown()` dua kali → verifikasi output identik.
- **Property 8** — Mock filesystem, generate file metadata valid acak → verifikasi URL unik di setiap respons.
- **Property 9** — Generate tipe MIME acak yang tidak valid → verifikasi HTTP 400.

### Integration Tests

- Upload file nyata ke endpoint → verifikasi file tersimpan di `static/uploads/images/` dan URL dapat diakses.
- Request ke upload endpoint tanpa sesi → verifikasi HTTP 401/redirect.

### Manual / E2E Tests

- Pratinjau real-time di editor memperbarui dalam <300ms setelah mengetik.
- Broken image URL menampilkan alt text di browser.
- Gambar responsif tidak overflow kontainer pada layar kecil.
