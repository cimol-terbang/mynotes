# Requirements Document

## Introduction

Fitur **Insert Picture** memungkinkan admin blog untuk menyisipkan gambar ke dalam konten postingan menggunakan sintaks shortcode khusus di dalam editor Markdown. Gambar dapat berasal dari URL eksternal maupun file yang diunggah ke server. Shortcode tersebut akan diproses oleh renderer Markdown dan ditampilkan sebagai elemen `<img>` yang aman saat postingan dibaca oleh pengunjung.

Fitur ini dibangun di atas infrastruktur yang sudah ada: `MarkdownEditor.svelte` (editor + pratinjau), `renderMarkdown()` di `markdown.js` (pipeline `marked` + `DOMPurify`), dan `PostContent.svelte` (tampilan frontend).

---

## Glossary

- **Admin**: Pengguna yang telah terautentikasi dan memiliki akses ke halaman `/admin`.
- **Editor**: Komponen `MarkdownEditor.svelte` — textarea Markdown dengan pratinjau real-time.
- **Shortcode**: Sintaks teks khusus berbentuk `![alt](url)` (Markdown standar) atau `{{image:url|alt=teks|caption=teks|size=nilai}}` (shortcode kustom) yang ditulis di dalam konten postingan.
- **Image_Shortcode**: Shortcode kustom dengan format `{{image:url|alt=teks|caption=teks|size=nilai}}` yang mendukung parameter opsional.
- **Renderer**: Fungsi `renderMarkdown()` di `src/lib/utils/markdown.js` yang mengonversi Markdown + shortcode menjadi HTML tersanitasi.
- **Image_Uploader**: Komponen UI di dalam Editor yang menangani pemilihan file gambar dan pengiriman ke endpoint upload.
- **Upload_Endpoint**: SvelteKit server route `POST /api/images/upload` yang menerima file gambar dan mengembalikan URL publik.
- **PostContent**: Komponen `PostContent.svelte` yang merender HTML konten postingan di halaman frontend.
- **Pratinjau**: Panel kanan di dalam Editor yang menampilkan hasil render konten secara real-time.
- **Caption**: Teks keterangan opsional yang ditampilkan di bawah gambar.
- **Alt Text**: Teks alternatif pada atribut `alt` elemen `<img>` untuk aksesibilitas dan SEO.

---

## Requirements

### Requirement 1: Sintaks Shortcode Gambar Kustom

**User Story:** Sebagai admin, saya ingin menulis shortcode gambar di dalam editor Markdown, sehingga saya dapat menyisipkan gambar dengan opsi tambahan seperti caption dan ukuran tanpa keluar dari editor.

#### Acceptance Criteria

1. THE Renderer SHALL mendukung sintaks shortcode gambar kustom dengan format `{{image:URL|alt=TEKS|caption=TEKS|size=NILAI}}` di dalam konten postingan.
2. WHEN konten mengandung shortcode `{{image:URL}}`, THE Renderer SHALL mengonversi shortcode tersebut menjadi elemen `<img>` dengan atribut `src` berisi URL dan atribut `alt` berisi string kosong.
3. WHEN konten mengandung shortcode `{{image:URL|alt=TEKS}}`, THE Renderer SHALL mengonversi shortcode tersebut menjadi elemen `<img>` dengan atribut `alt` berisi TEKS yang diberikan.
4. WHEN konten mengandung shortcode `{{image:URL|caption=TEKS}}`, THE Renderer SHALL membungkus elemen `<img>` dalam elemen `<figure>` dan menambahkan elemen `<figcaption>` berisi TEKS caption.
5. WHEN konten mengandung shortcode `{{image:URL|size=small}}`, THE Renderer SHALL menambahkan class CSS `img-small` pada elemen `<img>`.
6. WHEN konten mengandung shortcode `{{image:URL|size=medium}}`, THE Renderer SHALL menambahkan class CSS `img-medium` pada elemen `<img>`.
7. WHEN konten mengandung shortcode `{{image:URL|size=large}}`, THE Renderer SHALL menambahkan class CSS `img-large` pada elemen `<img>`.
8. WHEN konten mengandung shortcode `{{image:URL|size=full}}`, THE Renderer SHALL menambahkan class CSS `img-full` pada elemen `<img>`.
9. WHEN konten mengandung shortcode dengan parameter yang tidak dikenal, THE Renderer SHALL mengabaikan parameter tersebut dan tetap merender gambar dengan parameter yang valid.
10. THE Renderer SHALL mendukung kombinasi semua parameter opsional dalam satu shortcode secara bersamaan.

---

### Requirement 2: Keamanan Rendering Gambar

**User Story:** Sebagai pengelola blog, saya ingin memastikan gambar yang disisipkan tidak membuka celah keamanan XSS, sehingga konten postingan tetap aman bagi pengunjung.

#### Acceptance Criteria

1. WHEN Renderer memproses shortcode gambar, THE Renderer SHALL menjalankan output HTML melalui DOMPurify sebelum HTML tersebut dikirim ke browser.
2. WHEN atribut `src` pada shortcode mengandung karakter berbahaya seperti `javascript:`, THE Renderer SHALL menghapus atribut `src` tersebut dari elemen `<img>` yang dihasilkan.
3. WHEN atribut `alt` atau `caption` pada shortcode mengandung tag HTML, THE Renderer SHALL mengubah karakter `<`, `>`, dan `"` menjadi HTML entities sebelum dimasukkan ke dalam atribut.
4. THE Renderer SHALL hanya mengizinkan URL gambar dengan protokol `https://` atau `http://` atau path relatif yang dimulai dengan `/`.
5. IF URL pada shortcode tidak memiliki protokol yang diizinkan dan bukan path relatif, THEN THE Renderer SHALL merender elemen `<img>` tanpa atribut `src`.

---

### Requirement 3: Pratinjau Real-Time Shortcode di Editor

**User Story:** Sebagai admin, saya ingin melihat pratinjau gambar secara langsung saat mengetik shortcode di editor, sehingga saya dapat memverifikasi tampilan gambar sebelum menyimpan postingan.

#### Acceptance Criteria

1. WHEN admin mengetik atau mengubah shortcode gambar di textarea Editor, THE Editor SHALL memperbarui panel Pratinjau dalam waktu kurang dari 300ms setelah pengguna berhenti mengetik.
2. WHEN shortcode gambar valid ditulis di Editor, THE Editor SHALL menampilkan gambar yang dirender di panel Pratinjau menggunakan fungsi Renderer yang sama dengan yang digunakan di PostContent.
3. WHEN shortcode gambar mengandung URL yang tidak dapat dimuat, THE Editor SHALL tetap menampilkan elemen `<img>` di Pratinjau dengan atribut `alt` yang sesuai (browser akan menampilkan broken image indicator secara default).
4. THE Editor SHALL menggunakan fungsi `renderMarkdown()` yang sama untuk Pratinjau dan untuk penyimpanan konten, sehingga tampilan Pratinjau konsisten dengan tampilan di PostContent.

---

### Requirement 4: Tombol Sisipkan Gambar via URL

**User Story:** Sebagai admin, saya ingin ada tombol atau kontrol di editor untuk menyisipkan shortcode gambar dari URL, sehingga saya tidak perlu mengingat dan mengetik sintaks shortcode secara manual.

#### Acceptance Criteria

1. THE Editor SHALL menampilkan tombol "Sisipkan Gambar" di atas textarea Markdown.
2. WHEN admin mengklik tombol "Sisipkan Gambar", THE Editor SHALL menampilkan form inline yang memiliki field input untuk URL gambar, Alt Text, Caption, dan pilihan Size.
3. WHEN admin mengisi URL dan mengklik tombol konfirmasi pada form inline, THE Editor SHALL menyisipkan shortcode gambar yang sesuai ke posisi kursor saat ini di textarea.
4. WHEN admin mengklik tombol konfirmasi tanpa mengisi URL, THE Editor SHALL menampilkan pesan validasi "URL gambar tidak boleh kosong" dan tidak menyisipkan shortcode.
5. WHEN admin mengklik tombol batal atau menekan tombol Escape pada form inline, THE Editor SHALL menutup form inline tanpa mengubah konten textarea.
6. WHEN shortcode berhasil disisipkan, THE Editor SHALL menutup form inline dan memindahkan fokus kembali ke textarea.

---

### Requirement 5: Upload Gambar dari File Lokal

**User Story:** Sebagai admin, saya ingin mengunggah file gambar dari komputer saya dan menyisipkannya ke postingan, sehingga saya tidak bergantung pada hosting gambar eksternal.

#### Acceptance Criteria

1. THE Image_Uploader SHALL menampilkan tombol "Unggah Gambar" di samping tombol "Sisipkan Gambar" pada Editor.
2. WHEN admin mengklik tombol "Unggah Gambar", THE Image_Uploader SHALL membuka dialog pemilihan file yang hanya menerima file dengan tipe MIME `image/jpeg`, `image/png`, `image/gif`, dan `image/webp`.
3. WHEN admin memilih file gambar yang valid, THE Image_Uploader SHALL mengirim file tersebut ke Upload_Endpoint menggunakan HTTP POST dengan `Content-Type: multipart/form-data`.
4. WHEN Upload_Endpoint menerima file gambar yang valid, THE Upload_Endpoint SHALL menyimpan file tersebut dan mengembalikan respons JSON dengan field `url` berisi URL publik gambar yang dapat diakses.
5. WHEN Upload_Endpoint berhasil menyimpan file, THE Image_Uploader SHALL secara otomatis menyisipkan shortcode `{{image:URL}}` ke posisi kursor saat ini di textarea Editor.
6. WHEN admin memilih file dengan ukuran lebih dari 5MB, THE Image_Uploader SHALL menampilkan pesan error "Ukuran file maksimal adalah 5MB" dan tidak mengirim file ke Upload_Endpoint.
7. WHEN admin memilih file dengan tipe MIME yang tidak diizinkan, THE Image_Uploader SHALL menampilkan pesan error "Format file tidak didukung. Gunakan JPEG, PNG, GIF, atau WebP" dan tidak mengirim file ke Upload_Endpoint.
8. WHILE proses upload berlangsung, THE Image_Uploader SHALL menampilkan indikator loading dan menonaktifkan tombol "Unggah Gambar" untuk mencegah pengiriman ganda.
9. IF Upload_Endpoint mengembalikan respons error, THEN THE Image_Uploader SHALL menampilkan pesan error yang diterima dari server dan mengaktifkan kembali tombol "Unggah Gambar".

---

### Requirement 6: Upload Endpoint Server

**User Story:** Sebagai sistem, saya membutuhkan endpoint server yang aman untuk menerima dan menyimpan file gambar yang diunggah admin, sehingga gambar dapat diakses secara publik melalui URL.

#### Acceptance Criteria

1. THE Upload_Endpoint SHALL hanya dapat diakses oleh pengguna yang telah terautentikasi sebagai Admin, dan mengembalikan respons HTTP 401 untuk permintaan tanpa sesi yang valid.
2. WHEN Upload_Endpoint menerima file gambar valid, THE Upload_Endpoint SHALL menyimpan file dengan nama unik yang dihasilkan dari kombinasi timestamp dan string acak untuk menghindari konflik nama file.
3. THE Upload_Endpoint SHALL menyimpan file gambar di direktori `static/uploads/images/` agar dapat diakses sebagai aset statis SvelteKit.
4. WHEN Upload_Endpoint berhasil menyimpan file, THE Upload_Endpoint SHALL mengembalikan respons HTTP 200 dengan body JSON `{"url": "/uploads/images/NAMA_FILE"}`.
5. WHEN Upload_Endpoint menerima file dengan ukuran lebih dari 5MB, THE Upload_Endpoint SHALL mengembalikan respons HTTP 400 dengan body JSON `{"error": "Ukuran file melebihi batas maksimal 5MB"}`.
6. WHEN Upload_Endpoint menerima file dengan tipe MIME selain `image/jpeg`, `image/png`, `image/gif`, atau `image/webp`, THE Upload_Endpoint SHALL mengembalikan respons HTTP 400 dengan body JSON `{"error": "Tipe file tidak didukung"}`.
7. IF terjadi kesalahan saat menyimpan file ke sistem file, THEN THE Upload_Endpoint SHALL mengembalikan respons HTTP 500 dengan body JSON `{"error": "Gagal menyimpan file"}` dan mencatat detail error ke server log.

---

### Requirement 7: Tampilan Gambar di Frontend

**User Story:** Sebagai pengunjung blog, saya ingin melihat gambar yang disisipkan admin ditampilkan dengan benar di halaman postingan, sehingga konten postingan dapat dinikmati secara visual.

#### Acceptance Criteria

1. WHEN PostContent merender konten postingan yang mengandung shortcode gambar, THE PostContent SHALL menampilkan elemen `<img>` yang dihasilkan Renderer di dalam area konten postingan.
2. WHEN PostContent menampilkan gambar dengan shortcode yang memiliki caption, THE PostContent SHALL merender elemen `<figure>` dengan `<figcaption>` yang terlihat di bawah gambar.
3. THE PostContent SHALL menerapkan class CSS `img-small`, `img-medium`, `img-large`, dan `img-full` yang mendefinisikan lebar gambar masing-masing sebesar 25%, 50%, 75%, dan 100% dari lebar kontainer konten.
4. WHEN gambar dengan URL yang tidak dapat dimuat ditampilkan di PostContent, THE PostContent SHALL menampilkan atribut `alt` sebagai teks pengganti sesuai perilaku standar browser.
5. THE PostContent SHALL menampilkan gambar yang responsif sehingga lebar gambar tidak melebihi lebar kontainer pada semua ukuran layar.

---

### Requirement 8: Konsistensi Round-Trip Shortcode

**User Story:** Sebagai sistem, saya ingin memastikan shortcode yang ditulis admin selalu menghasilkan output yang sama dan konsisten antara pratinjau editor dan tampilan frontend, sehingga tidak ada perbedaan tampilan yang mengejutkan.

#### Acceptance Criteria

1. FOR ALL shortcode gambar valid yang ditulis di Editor, THE Renderer SHALL menghasilkan output HTML yang identik baik saat dipanggil dari Editor (pratinjau) maupun dari PostContent (frontend).
2. THE Renderer SHALL bersifat deterministik: untuk input shortcode yang sama, THE Renderer SHALL selalu menghasilkan output HTML yang sama tanpa bergantung pada state eksternal.
3. WHEN konten postingan yang tersimpan di database diambil dan dirender ulang, THE Renderer SHALL menghasilkan HTML yang secara fungsional setara dengan HTML yang dihasilkan saat pratinjau di Editor.
