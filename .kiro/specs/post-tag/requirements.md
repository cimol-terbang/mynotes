# Requirements Document

## Introduction

Fitur **Post Tag** memungkinkan admin blog untuk menambahkan tag pada setiap postingan sebagai metadata kategorisasi tambahan di luar field `category` yang sudah ada. Tag bersifat fleksibel — admin dapat membuat tag baru langsung saat menulis post, atau memilih dari tag yang sudah pernah digunakan sebelumnya.

Pengunjung publik dapat melihat tag yang melekat pada setiap postingan (baik di listing homepage maupun di halaman detail post), dan dapat mengklik tag untuk memfilter postingan berdasarkan tag tersebut.

Fitur ini dibangun di atas infrastruktur yang sudah ada: model `Post` di MongoDB, `PostService` untuk operasi database, dan halaman admin di `/admin` untuk mengelola postingan.

---

## Glossary

- **Admin**: Pengguna yang telah terautentikasi dan memiliki akses ke halaman `/admin`.
- **Post**: Dokumen postingan blog yang tersimpan di database MongoDB dengan model `Post`.
- **Tag**: Label teks yang dilekatkan pada postingan sebagai metadata kategorisasi. Satu tag dapat melekat pada banyak postingan.
- **Tag_Name**: Nilai teks dari sebuah tag. Boleh mengandung huruf, angka, dan spasi. Disimpan dalam bentuk lowercase yang sudah di-trim.
- **Tag_Slug**: Representasi URL-safe dari `Tag_Name`, digunakan sebagai parameter di URL filter (misalnya `web-development` untuk tag "web development").
- **Post_Tags**: Kumpulan tag yang melekat pada satu postingan, disimpan sebagai array di field `tags` pada model `Post`.
- **PostService**: Class service di `src/lib/server/post.service.js` yang menangani operasi CRUD postingan ke database.
- **Post_Editor**: Halaman edit postingan di `/admin/posts/[id]` dan `/admin/posts/new` yang digunakan admin untuk membuat atau mengubah postingan.
- **Admin_Panel**: Halaman admin di `/admin` yang menampilkan daftar semua postingan milik admin.
- **Public_Feed**: Halaman utama blog (`/`) yang menampilkan daftar postingan kepada pengunjung publik.
- **Post_Detail**: Halaman detail postingan di `/{slug}` yang menampilkan konten lengkap satu postingan.
- **Tag_Filter_Page**: Halaman publik di `/tag/[tag-slug]` yang menampilkan daftar postingan yang memiliki tag tertentu.
- **Tag_Autocomplete**: Komponen input di Post_Editor yang menampilkan saran tag yang sudah ada saat admin mengetik.

---

## Requirements

### Requirement 1: Penyimpanan Tag pada Model Postingan

**User Story:** Sebagai admin, saya ingin setiap postingan dapat memiliki satu atau lebih tag, sehingga saya dapat mengkategorisasi konten secara lebih granular di luar kategori utama.

#### Acceptance Criteria

1. THE Post SHALL memiliki field `tags` berupa array yang berisi nol atau lebih `Tag_Name`.
2. WHEN postingan baru dibuat tanpa menentukan tag, THE PostService SHALL menetapkan nilai `tags` sebagai array kosong secara default.
3. WHEN PostService menyimpan tag ke database, THE PostService SHALL menyimpan setiap `Tag_Name` dalam bentuk lowercase yang sudah di-trim dari spasi di awal dan akhir.
4. WHEN PostService mengambil data postingan dari database, THE PostService SHALL menyertakan field `tags` dalam data yang dikembalikan.
5. THE PostService SHALL menghasilkan `Tag_Slug` dari `Tag_Name` dengan mengganti spasi menjadi tanda hubung dan menghapus karakter selain huruf, angka, dan tanda hubung.

---

### Requirement 2: Menambah dan Mengedit Tag di Post Editor

**User Story:** Sebagai admin, saya ingin dapat menambahkan tag saat membuat atau mengedit postingan, sehingga saya dapat melabeli konten dengan tag yang relevan tanpa harus berpindah halaman.

#### Acceptance Criteria

1. THE Post_Editor SHALL menampilkan komponen input tag yang memungkinkan admin menambahkan satu atau lebih tag pada postingan.
2. WHEN admin mengetik di input tag, THE Tag_Autocomplete SHALL menampilkan saran tag yang sudah pernah digunakan pada postingan lain dan mengandung teks yang diketik.
3. WHEN admin memilih saran dari Tag_Autocomplete, THE Post_Editor SHALL menambahkan tag tersebut ke daftar tag postingan yang sedang diedit.
4. WHEN admin menekan tombol Enter atau koma setelah mengetik nama tag baru, THE Post_Editor SHALL menambahkan tag baru tersebut ke daftar tag postingan.
5. WHEN admin menambahkan tag yang sudah ada dalam daftar tag postingan yang sama, THE Post_Editor SHALL mengabaikan penambahan duplikat tersebut.
6. WHEN admin mengklik tombol hapus pada sebuah tag di daftar, THE Post_Editor SHALL menghapus tag tersebut dari daftar tag postingan yang sedang diedit.
7. WHEN admin menyimpan postingan (baik sebagai draft maupun dipublikasikan), THE PostService SHALL menyimpan daftar tag terkini ke database.
8. WHEN Post_Editor dibuka untuk postingan yang sudah memiliki tag, THE Post_Editor SHALL menampilkan tag-tag yang sudah ada dalam daftar tag.

---

### Requirement 3: Mengambil Daftar Tag yang Sudah Ada

**User Story:** Sebagai admin, saya ingin melihat tag yang sudah pernah digunakan sebelumnya saat menambahkan tag, sehingga saya dapat menggunakan kembali tag yang konsisten tanpa harus mengetik ulang.

#### Acceptance Criteria

1. THE PostService SHALL menyediakan operasi untuk mengambil semua tag unik yang digunakan di seluruh postingan yang ada di database.
2. WHEN PostService mengambil daftar tag yang ada, THE PostService SHALL mengembalikan daftar tag yang sudah dideduplikasi dan diurutkan secara alfabetis.
3. WHEN Post_Editor dimuat, THE Post_Editor SHALL memuat daftar tag yang sudah ada untuk digunakan oleh Tag_Autocomplete.

---

### Requirement 4: Tampilan Tag di Listing Postingan (Public Feed)

**User Story:** Sebagai pengunjung, saya ingin melihat tag pada setiap postingan di halaman utama, sehingga saya dapat mengetahui topik postingan secara sekilas dan menemukan konten yang relevan.

#### Acceptance Criteria

1. THE Public_Feed SHALL menampilkan tag-tag yang melekat pada setiap postingan dalam daftar.
2. WHEN Public_Feed menampilkan tag sebuah postingan, THE Public_Feed SHALL menampilkan setiap tag sebagai tautan yang dapat diklik.
3. WHEN pengunjung mengklik sebuah tag di Public_Feed, THE Public_Feed SHALL mengarahkan pengunjung ke Tag_Filter_Page untuk tag tersebut.
4. WHEN sebuah postingan tidak memiliki tag, THE Public_Feed SHALL tidak menampilkan area tag untuk postingan tersebut.

---

### Requirement 5: Tampilan Tag di Halaman Detail Postingan

**User Story:** Sebagai pengunjung, saya ingin melihat tag pada halaman detail postingan, sehingga saya dapat menemukan postingan lain dengan topik yang sama.

#### Acceptance Criteria

1. THE Post_Detail SHALL menampilkan semua tag yang melekat pada postingan tersebut.
2. WHEN Post_Detail menampilkan tag sebuah postingan, THE Post_Detail SHALL menampilkan setiap tag sebagai tautan yang dapat diklik.
3. WHEN pengunjung mengklik sebuah tag di Post_Detail, THE Post_Detail SHALL mengarahkan pengunjung ke Tag_Filter_Page untuk tag tersebut.
4. WHEN sebuah postingan tidak memiliki tag, THE Post_Detail SHALL tidak menampilkan area tag.

---

### Requirement 6: Halaman Filter Berdasarkan Tag

**User Story:** Sebagai pengunjung, saya ingin dapat melihat semua postingan dengan tag tertentu dalam satu halaman, sehingga saya dapat menjelajahi konten berdasarkan topik yang saya minati.

#### Acceptance Criteria

1. THE Tag_Filter_Page SHALL menampilkan daftar postingan yang memiliki tag dengan `Tag_Slug` yang sesuai dengan parameter URL.
2. THE Tag_Filter_Page SHALL hanya menampilkan postingan dengan status `published`.
3. WHEN Tag_Filter_Page menampilkan daftar postingan, THE Tag_Filter_Page SHALL mengurutkan postingan berdasarkan tanggal pembaruan terbaru (`updatedAt`) secara descending.
4. THE Tag_Filter_Page SHALL menampilkan nama tag yang sedang difilter sebagai judul atau heading halaman.
5. IF tidak ada postingan yang memiliki tag tersebut, THEN THE Tag_Filter_Page SHALL menampilkan pesan bahwa tidak ada postingan ditemukan untuk tag tersebut.
6. IF `Tag_Slug` pada URL tidak cocok dengan tag manapun di database, THEN THE Tag_Filter_Page SHALL menampilkan pesan bahwa tidak ada postingan ditemukan.
7. WHEN PostService mengambil postingan untuk Tag_Filter_Page, THE PostService SHALL memfilter postingan berdasarkan kecocokan `Tag_Name` yang menghasilkan `Tag_Slug` yang sama dengan parameter URL.

---

### Requirement 7: Konsistensi Tag saat Postingan Dihapus

**User Story:** Sebagai admin, saya ingin tag tetap konsisten meskipun ada postingan yang dihapus, sehingga tag yang masih digunakan postingan lain tidak terpengaruh.

#### Acceptance Criteria

1. WHEN admin menghapus sebuah postingan, THE PostService SHALL menghapus postingan tersebut beserta seluruh data tag yang melekat padanya.
2. WHEN sebuah postingan dihapus, THE PostService SHALL tidak menghapus tag dari postingan lain yang menggunakan tag yang sama.
3. WHEN PostService mengambil daftar semua tag yang ada, THE PostService SHALL hanya mengembalikan tag yang masih digunakan oleh minimal satu postingan.
