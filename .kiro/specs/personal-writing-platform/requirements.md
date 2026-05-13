# Dokumen Requirements

## Pendahuluan

Platform blog/tulisan pribadi yang dibangun dengan SvelteKit, Tailwind CSS, dan MongoDB. Platform ini memungkinkan seorang penulis untuk mempublikasikan tulisan pribadi dalam tiga kategori: esai (*Apa yang aku pikirkan*), puisi (*Apa yang aku rasakan*), dan cerita (*Apa yang aku bayangkan*). Admin dapat membuat dan mengelola postingan melalui antarmuka yang terautentikasi, sementara pengunjung publik dapat membaca tulisan dan meninggalkan komentar tanpa perlu mendaftar akun.

---

## Glosarium

- **Platform**: Aplikasi web personal-writing-platform yang dibangun dengan SvelteKit.
- **Admin**: Pengguna yang memiliki akses terautentikasi untuk membuat, mengedit, dan menghapus postingan.
- **Pengunjung**: Pengguna publik yang mengakses platform tanpa autentikasi.
- **Postingan**: Sebuah tulisan yang diterbitkan oleh Admin, terdiri dari judul, konten Markdown, kategori, dan metadata.
- **Kategori**: Klasifikasi postingan, terdiri dari tiga jenis: *Apa yang aku pikirkan* (esai), *Apa yang aku rasakan* (puisi), dan *Apa yang aku bayangkan* (cerita).
- **Komentar**: Respons teks yang dikirimkan oleh Pengunjung pada sebuah Postingan, disertai nama pengirim.
- **Markdown_Renderer**: Komponen yang mengubah konten Markdown menjadi HTML yang ditampilkan di halaman.
- **Auth_Service**: Layanan yang menangani autentikasi dan sesi Admin.
- **Post_Service**: Layanan yang menangani operasi CRUD untuk Postingan.
- **Comment_Service**: Layanan yang menangani operasi penyimpanan dan pengambilan Komentar.
- **Database**: Instansi MongoDB yang menyimpan data Postingan dan Komentar.
- **Dark_Mode_Toggle**: Komponen UI yang memungkinkan pengguna beralih antara tema terang dan gelap.
- **Slug**: Identifikasi unik berbasis teks dari sebuah Postingan yang digunakan dalam URL.

---

## Requirements

### Requirement 1: Tampilan Halaman Utama

**User Story:** Sebagai Pengunjung, saya ingin melihat daftar tulisan terbaru di halaman utama, sehingga saya dapat menemukan konten yang menarik untuk dibaca.

#### Acceptance Criteria

1. THE Platform SHALL menampilkan daftar Postingan yang telah diterbitkan, diurutkan berdasarkan tanggal terbaru.
2. THE Platform SHALL menampilkan judul, kategori, tanggal terbit, dan cuplikan singkat untuk setiap Postingan dalam daftar.
3. THE Platform SHALL menampilkan navigasi kategori yang memungkinkan Pengunjung memfilter Postingan berdasarkan Kategori.
4. WHEN Pengunjung memilih sebuah Kategori, THE Platform SHALL menampilkan hanya Postingan yang termasuk dalam Kategori tersebut.
5. WHEN tidak ada Postingan yang tersedia dalam suatu Kategori, THE Platform SHALL menampilkan pesan "Belum ada tulisan di kategori ini."
6. THE Platform SHALL menampilkan nama ketiga Kategori secara eksplisit: *Apa yang aku pikirkan*, *Apa yang aku rasakan*, dan *Apa yang aku bayangkan*.

---

### Requirement 2: Halaman Detail Postingan

**User Story:** Sebagai Pengunjung, saya ingin membaca sebuah tulisan secara lengkap, sehingga saya dapat menikmati konten yang ditulis oleh Admin.

#### Acceptance Criteria

1. WHEN Pengunjung mengakses URL sebuah Postingan, THE Platform SHALL menampilkan judul, kategori, tanggal terbit, dan konten lengkap Postingan tersebut.
2. THE Markdown_Renderer SHALL mengubah konten Markdown dari Postingan menjadi HTML yang terformat dengan benar.
3. THE Markdown_Renderer SHALL mendukung elemen Markdown standar termasuk heading, paragraf, tebal, miring, daftar, kutipan, dan blok kode.
4. WHEN Pengunjung mengakses URL Postingan yang tidak ditemukan, THE Platform SHALL menampilkan halaman 404 dengan pesan "Tulisan tidak ditemukan."
5. THE Platform SHALL menampilkan tautan navigasi untuk kembali ke halaman utama atau ke daftar Kategori yang sama.

---

### Requirement 3: Sistem Komentar Publik

**User Story:** Sebagai Pengunjung, saya ingin meninggalkan komentar pada sebuah tulisan tanpa perlu membuat akun, sehingga saya dapat berbagi respons saya dengan mudah.

#### Acceptance Criteria

1. THE Platform SHALL menampilkan formulir komentar di bawah setiap Postingan yang diterbitkan.
2. THE Platform SHALL menyediakan kolom isian nama dengan nilai default "Anonym" pada formulir komentar.
3. THE Platform SHALL menyediakan kolom isian teks komentar yang wajib diisi.
4. WHEN Pengunjung mengirimkan formulir komentar dengan kolom komentar yang terisi, THE Comment_Service SHALL menyimpan Komentar beserta nama pengirim dan waktu pengiriman ke Database.
5. WHEN Pengunjung mengirimkan formulir komentar dengan kolom nama yang kosong, THE Comment_Service SHALL menyimpan Komentar dengan nama "Anonym".
6. WHEN Pengunjung mengirimkan formulir komentar dengan kolom komentar yang kosong, THE Platform SHALL menampilkan pesan validasi "Komentar tidak boleh kosong."
7. WHEN sebuah Komentar berhasil disimpan, THE Platform SHALL menampilkan Komentar tersebut dalam daftar komentar tanpa perlu memuat ulang halaman.
8. THE Platform SHALL menampilkan daftar Komentar pada sebuah Postingan, diurutkan berdasarkan waktu pengiriman dari yang terlama ke terbaru.
9. THE Platform SHALL menampilkan nama pengirim dan waktu pengiriman untuk setiap Komentar.

---

### Requirement 4: Autentikasi Admin

**User Story:** Sebagai Admin, saya ingin masuk ke platform dengan kredensial yang aman, sehingga hanya saya yang dapat mengelola konten tulisan.

#### Acceptance Criteria

1. THE Platform SHALL menyediakan halaman login yang hanya dapat diakses melalui URL khusus admin.
2. WHEN Admin memasukkan kombinasi nama pengguna dan kata sandi yang valid, THE Auth_Service SHALL membuat sesi terautentikasi dan mengarahkan Admin ke dasbor admin.
3. WHEN Admin memasukkan kombinasi nama pengguna atau kata sandi yang tidak valid, THE Auth_Service SHALL menampilkan pesan "Nama pengguna atau kata sandi salah." tanpa mengungkapkan informasi mana yang salah.
4. THE Auth_Service SHALL menyimpan kata sandi Admin dalam bentuk hash menggunakan algoritma bcrypt dengan salt rounds minimal 10.
5. WHILE Admin memiliki sesi aktif, THE Platform SHALL mempertahankan status login selama maksimal 24 jam.
6. WHEN sesi Admin berakhir atau Admin keluar, THE Auth_Service SHALL menghapus sesi dan mengarahkan Admin ke halaman login.
7. WHEN Pengunjung yang tidak terautentikasi mencoba mengakses halaman admin, THE Platform SHALL mengarahkan Pengunjung ke halaman login.

---

### Requirement 5: Manajemen Postingan oleh Admin

**User Story:** Sebagai Admin, saya ingin membuat, mengedit, dan menghapus postingan, sehingga saya dapat mengelola konten platform sepenuhnya.

#### Acceptance Criteria

1. WHILE Admin memiliki sesi aktif, THE Platform SHALL menampilkan dasbor admin yang berisi daftar semua Postingan beserta status dan tanggal terbitnya.
2. WHILE Admin memiliki sesi aktif, THE Post_Service SHALL memungkinkan Admin membuat Postingan baru dengan mengisi judul, konten Markdown, dan Kategori.
3. WHEN Admin membuat Postingan baru, THE Post_Service SHALL secara otomatis menghasilkan Slug unik berbasis judul Postingan.
4. WHEN Admin membuat Postingan baru dengan judul yang menghasilkan Slug yang sudah ada, THE Post_Service SHALL menambahkan sufiks numerik pada Slug untuk memastikan keunikannya.
5. WHILE Admin memiliki sesi aktif, THE Post_Service SHALL memungkinkan Admin mengedit judul, konten Markdown, dan Kategori dari Postingan yang sudah ada.
6. WHILE Admin memiliki sesi aktif, THE Post_Service SHALL memungkinkan Admin menghapus sebuah Postingan beserta seluruh Komentar yang terkait.
7. WHEN Admin menghapus sebuah Postingan, THE Platform SHALL menampilkan dialog konfirmasi sebelum penghapusan dilakukan.
8. THE Platform SHALL menyediakan pratinjau Markdown secara langsung saat Admin menulis atau mengedit konten Postingan.
9. WHEN Admin menyimpan Postingan, THE Post_Service SHALL menyimpan data Postingan ke Database dan menampilkan pesan konfirmasi "Postingan berhasil disimpan."
10. WHEN penyimpanan Postingan gagal karena kesalahan Database, THE Post_Service SHALL menampilkan pesan "Gagal menyimpan postingan. Silakan coba lagi."

---

### Requirement 6: Penyimpanan dan Pengambilan Data

**User Story:** Sebagai Admin, saya ingin data postingan dan komentar tersimpan dengan andal, sehingga konten platform tidak hilang.

#### Acceptance Criteria

1. THE Post_Service SHALL menyimpan setiap Postingan dengan atribut: id unik, judul, slug, konten Markdown, kategori, tanggal dibuat, dan tanggal diperbarui.
2. THE Comment_Service SHALL menyimpan setiap Komentar dengan atribut: id unik, id Postingan terkait, nama pengirim, teks komentar, dan waktu pengiriman.
3. WHEN Post_Service mengambil daftar Postingan, THE Database SHALL mengembalikan hasil dalam waktu kurang dari 500ms untuk koleksi hingga 1.000 Postingan.
4. WHEN Comment_Service mengambil Komentar untuk sebuah Postingan, THE Database SHALL mengembalikan hasil dalam waktu kurang dari 300ms untuk hingga 500 Komentar per Postingan.
5. IF koneksi ke Database gagal, THEN THE Platform SHALL menampilkan pesan "Layanan sedang tidak tersedia. Silakan coba lagi nanti." kepada Pengunjung.
6. IF koneksi ke Database gagal saat Admin menyimpan data, THEN THE Post_Service SHALL menampilkan pesan kesalahan spesifik kepada Admin tanpa kehilangan data yang sedang diedit.

---

### Requirement 7: Antarmuka Responsif dan Dark Mode

**User Story:** Sebagai Pengunjung, saya ingin platform dapat diakses dengan nyaman di berbagai perangkat dan mendukung mode gelap, sehingga pengalaman membaca saya optimal.

#### Acceptance Criteria

1. THE Platform SHALL menampilkan tata letak yang responsif dan dapat digunakan pada lebar layar minimal 320px hingga 2560px.
2. THE Platform SHALL menyediakan Dark_Mode_Toggle yang dapat diakses di semua halaman.
3. WHEN Pengunjung mengaktifkan Dark_Mode_Toggle, THE Platform SHALL beralih ke tema gelap dan menyimpan preferensi tersebut di penyimpanan lokal browser.
4. WHEN Pengunjung mengunjungi Platform kembali, THE Platform SHALL memuat tema sesuai preferensi yang tersimpan di penyimpanan lokal browser.
5. WHEN tidak ada preferensi tersimpan, THE Platform SHALL menggunakan preferensi tema sistem operasi Pengunjung sebagai default.
6. THE Platform SHALL menerapkan desain minimalis dengan tipografi yang mudah dibaca, spasi yang cukup, dan kontras warna yang memenuhi standar WCAG 2.1 level AA.
7. THE Platform SHALL menampilkan antarmuka navigasi yang dapat digunakan pada perangkat layar sentuh.

---

### Requirement 8: Keamanan Platform

**User Story:** Sebagai Admin, saya ingin platform terlindungi dari serangan umum, sehingga konten dan data pengguna tetap aman.

#### Acceptance Criteria

1. THE Platform SHALL membersihkan semua input Komentar dari Pengunjung untuk mencegah serangan Cross-Site Scripting (XSS) sebelum disimpan ke Database.
2. THE Platform SHALL membersihkan konten HTML yang dihasilkan oleh Markdown_Renderer untuk mencegah eksekusi skrip berbahaya.
3. THE Auth_Service SHALL menggunakan token sesi yang aman dengan atribut HttpOnly dan SameSite=Strict pada cookie.
4. THE Platform SHALL membatasi pengiriman formulir komentar maksimal 10 kali per menit per alamat IP untuk mencegah spam.
5. IF jumlah pengiriman komentar dari satu alamat IP melebihi 10 kali dalam satu menit, THEN THE Platform SHALL menolak pengiriman dan menampilkan pesan "Terlalu banyak permintaan. Silakan tunggu sebentar."
6. THE Post_Service SHALL memvalidasi bahwa semua operasi tulis pada Postingan hanya dapat dilakukan oleh Admin yang memiliki sesi aktif yang valid.
```
