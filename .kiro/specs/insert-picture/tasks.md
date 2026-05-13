# Tasks — Insert Picture

## Task List

- [ ] 1. Implementasi `parseImageShortcodes` dan perbarui `renderMarkdown`
  - [x] 1.1 Tulis fungsi `parseImageShortcodes(content)` di `src/lib/utils/markdown.js` yang mem-parse regex `{{image:URL|...}}` dan menghasilkan HTML `<img>` atau `<figure>`
  - [x] 1.2 Implementasi parsing parameter opsional: `alt`, `caption`, `size` (small/medium/large/full); parameter tidak dikenal diabaikan
  - [x] 1.3 Implementasi validasi URL: hanya izinkan `https://`, `http://`, atau path relatif `/`; URL lain menghasilkan `<img>` tanpa atribut `src`
  - [x] 1.4 Implementasi escaping karakter HTML (`<`, `>`, `"`) pada nilai `alt` dan `caption` sebelum dimasukkan ke atribut
  - [x] 1.5 Perbarui fungsi `renderMarkdown()` untuk memanggil `parseImageShortcodes()` sebelum `marked.parse()`
  - [x] 1.6 Pastikan konten Markdown tanpa shortcode tetap diproses identik seperti sebelumnya (backward compatibility)

- [x] 2. Tulis unit tests dan property-based tests untuk `parseImageShortcodes`
  - [x] 2.1 Tulis unit tests untuk kasus-kasus spesifik: shortcode minimal, semua parameter, URL berbahaya, parameter tidak dikenal
  - [x] 2.2 Tulis property test untuk Property 1: shortcode dasar menghasilkan `<img>` dengan `src` dan `alt` yang benar (min. 100 iterasi)
  - [x] 2.3 Tulis property test untuk Property 2: shortcode dengan caption menghasilkan `<figure>/<figcaption>` (min. 100 iterasi)
  - [x] 2.4 Tulis property test untuk Property 3: parameter size menghasilkan class CSS yang sesuai (min. 100 iterasi)
  - [x] 2.5 Tulis property test untuk Property 4: kombinasi semua parameter menghasilkan output lengkap (min. 100 iterasi)
  - [x] 2.6 Tulis property test untuk Property 5: karakter HTML dalam alt/caption di-escape dengan benar (min. 100 iterasi)
  - [x] 2.7 Tulis property test untuk Property 6: URL dengan protokol tidak diizinkan menghasilkan `<img>` tanpa `src` (min. 100 iterasi)
  - [x] 2.8 Tulis property test untuk Property 7: `renderMarkdown()` bersifat deterministik untuk input yang sama (min. 100 iterasi)
  - [x] 2.9 Jalankan semua tests dan pastikan lulus

- [x] 3. Tambahkan CSS class untuk ukuran gambar
  - [x] 3.1 Tambahkan class `.img-small` (25%), `.img-medium` (50%), `.img-large` (75%), `.img-full` (100%) ke `src/app.css`
  - [x] 3.2 Tambahkan style responsif: `img { max-width: 100%; height: auto; }` dan style untuk `figure`/`figcaption`

- [x] 4. Buat komponen `ImageInsertForm.svelte`
  - [x] 4.1 Buat file `src/lib/components/ImageInsertForm.svelte` dengan fields: URL (required), Alt Text, Caption, Size (dropdown)
  - [x] 4.2 Implementasi validasi: tampilkan pesan "URL gambar tidak boleh kosong" jika URL kosong saat submit
  - [x] 4.3 Implementasi fungsi `buildShortcode(url, alt, caption, size)` yang membangun string shortcode dari parameter
  - [x] 4.4 Implementasi prop `onInsert(shortcode)` yang dipanggil saat form di-submit dengan shortcode yang valid
  - [x] 4.5 Implementasi prop `onCancel()` yang dipanggil saat tombol batal diklik atau tombol Escape ditekan
  - [x] 4.6 Pastikan form menutup dan fokus kembali ke textarea setelah shortcode berhasil disisipkan

- [x] 5. Perbarui `MarkdownEditor.svelte` dengan toolbar dan integrasi komponen baru
  - [x] 5.1 Tambahkan `bind:this={textareaEl}` pada elemen textarea untuk mendapatkan referensi DOM
  - [x] 5.2 Implementasi fungsi `insertAtCursor(text)` yang menyisipkan teks di posisi kursor saat ini di textarea
  - [x] 5.3 Tambahkan toolbar di atas textarea dengan tombol "Sisipkan Gambar" dan "Unggah Gambar"
  - [x] 5.4 Integrasikan `ImageInsertForm.svelte` — tampilkan saat tombol "Sisipkan Gambar" diklik, sembunyikan setelah insert/cancel
  - [x] 5.5 Tambahkan state `uploading` dan `uploadError` untuk mengelola status upload
  - [x] 5.6 Pastikan pratinjau real-time tetap berfungsi dengan shortcode gambar (sudah otomatis karena `renderMarkdown` diperbarui)

- [x] 6. Buat Upload Endpoint `POST /api/images/upload`
  - [x] 6.1 Buat file `src/routes/api/images/upload/+server.js` dengan handler `POST`
  - [x] 6.2 Implementasi validasi autentikasi: periksa sesi via `authService.validateSession()`, kembalikan HTTP 401 jika tidak valid
  - [x] 6.3 Implementasi parsing `multipart/form-data` menggunakan `request.formData()` untuk mengambil field `file`
  - [x] 6.4 Implementasi validasi tipe MIME: tolak file selain `image/jpeg`, `image/png`, `image/gif`, `image/webp` dengan HTTP 400
  - [x] 6.5 Implementasi validasi ukuran file: tolak file >5MB dengan HTTP 400
  - [x] 6.6 Implementasi pembuatan nama file unik: `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.EXT`
  - [x] 6.7 Implementasi penyimpanan file ke `static/uploads/images/` menggunakan `fs.writeFile`, buat direktori jika belum ada
  - [x] 6.8 Kembalikan HTTP 200 dengan JSON `{"url": "/uploads/images/NAMA_FILE"}` saat berhasil
  - [x] 6.9 Implementasi error handling: kembalikan HTTP 500 dengan JSON `{"error": "Gagal menyimpan file"}` dan log error saat gagal menulis file

- [x] 7. Integrasikan upload di `MarkdownEditor.svelte`
  - [x] 7.1 Tambahkan handler untuk tombol "Unggah Gambar": buka `<input type="file">` tersembunyi yang hanya menerima `image/jpeg,image/png,image/gif,image/webp`
  - [x] 7.2 Implementasi validasi sisi klien: periksa ukuran file (>5MB) dan tipe MIME sebelum mengirim ke server
  - [x] 7.3 Implementasi pengiriman file ke `/api/images/upload` menggunakan `fetch` dengan `FormData`
  - [x] 7.4 Tampilkan indikator loading dan nonaktifkan tombol "Unggah Gambar" selama proses upload berlangsung
  - [x] 7.5 Saat upload berhasil, sisipkan shortcode `{{image:URL}}` ke posisi kursor menggunakan `insertAtCursor()`
  - [x] 7.6 Saat upload gagal, tampilkan pesan error dari respons server dan aktifkan kembali tombol

- [x] 8. Tulis tests untuk Upload Endpoint
  - [x] 8.1 Tulis unit test: request tanpa sesi valid → HTTP 401
  - [x] 8.2 Tulis unit test: file dengan tipe MIME tidak valid → HTTP 400
  - [x] 8.3 Tulis unit test: file dengan ukuran >5MB → HTTP 400
  - [x] 8.4 Tulis unit test: file valid → HTTP 200 dengan JSON `{"url": "..."}` dan nama file unik
  - [x] 8.5 Tulis property test untuk Property 8: setiap upload file valid menghasilkan URL unik (mock filesystem, min. 100 iterasi)
  - [x] 8.6 Tulis property test untuk Property 9: tipe MIME tidak valid selalu menghasilkan HTTP 400 (min. 100 iterasi)
  - [x] 8.7 Jalankan semua tests dan pastikan lulus

- [x] 9. Verifikasi tampilan di PostContent dan end-to-end
  - [x] 9.1 Verifikasi bahwa `PostContent.svelte` merender shortcode gambar dengan benar (sudah otomatis karena menggunakan `renderMarkdown`)
  - [x] 9.2 Verifikasi class CSS `img-small`, `img-medium`, `img-large`, `img-full` diterapkan dengan benar di halaman frontend
  - [x] 9.3 Verifikasi gambar responsif tidak overflow kontainer pada layar kecil
  - [x] 9.4 Jalankan `npm test` untuk memastikan semua tests lulus
