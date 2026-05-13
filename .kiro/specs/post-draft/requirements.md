# Requirements Document

## Introduction

Fitur **Post Draft** memungkinkan admin blog untuk menyimpan postingan sebagai draft (belum dipublikasikan) sebelum memutuskan untuk mempublikasikannya ke publik. Admin dapat membuat, mengedit, dan mengelola draft kapan saja tanpa khawatir konten yang belum selesai terlihat oleh pengunjung. Draft hanya dapat diakses oleh admin yang terautentikasi, sedangkan pengunjung publik hanya dapat melihat postingan yang sudah dipublikasikan.

Fitur ini dibangun di atas infrastruktur yang sudah ada: model `Post` di MongoDB, `PostService` untuk operasi database, dan halaman admin di `/admin` untuk mengelola postingan.

---

## Glossary

- **Admin**: Pengguna yang telah terautentikasi dan memiliki akses ke halaman `/admin`.
- **Post**: Dokumen postingan blog yang tersimpan di database MongoDB dengan model `Post`.
- **Draft**: Postingan dengan status `draft` yang belum dipublikasikan dan tidak dapat diakses oleh pengunjung publik.
- **Published_Post**: Postingan dengan status `published` yang dapat diakses oleh pengunjung publik melalui URL `/{slug}`.
- **Post_Status**: Nilai enum pada field `status` di model `Post`, dengan nilai yang valid: `draft` atau `published`.
- **PostService**: Class service di `src/lib/server/post.service.js` yang menangani operasi CRUD postingan ke database.
- **Admin_Panel**: Halaman admin di `/admin` yang menampilkan daftar semua postingan milik admin.
- **Post_Editor**: Halaman edit postingan di `/admin/posts/[id]` dan `/admin/posts/new` yang digunakan admin untuk membuat atau mengubah postingan.
- **Public_Feed**: Halaman utama blog (`/`) dan halaman kategori yang menampilkan daftar postingan kepada pengunjung publik.

---

## Requirements

### Requirement 1: Status Draft pada Model Postingan

**User Story:** Sebagai admin, saya ingin setiap postingan memiliki status (draft atau published), sehingga saya dapat membedakan postingan yang sudah siap dipublikasikan dari yang masih dalam proses penulisan.

#### Acceptance Criteria

1. THE Post SHALL memiliki field `status` dengan nilai yang valid hanya `draft` atau `published`.
2. WHEN postingan baru dibuat tanpa menentukan status, THE PostService SHALL menetapkan nilai `status` sebagai `draft` secara default.
3. THE PostService SHALL menyimpan nilai `status` ke database bersama dengan field postingan lainnya.
4. WHEN PostService mengambil data postingan dari database, THE PostService SHALL menyertakan field `status` dalam data yang dikembalikan.

---

### Requirement 2: Menyimpan Postingan sebagai Draft

**User Story:** Sebagai admin, saya ingin dapat menyimpan postingan yang sedang saya tulis sebagai draft, sehingga saya dapat melanjutkan penulisan di lain waktu tanpa mempublikasikannya terlebih dahulu.

#### Acceptance Criteria

1. THE Post_Editor SHALL menampilkan dua tombol aksi: "Simpan Draft" dan "Publikasikan".
2. WHEN admin mengklik tombol "Simpan Draft", THE Post_Editor SHALL menyimpan postingan dengan `status` bernilai `draft` ke database.
3. WHEN admin mengklik tombol "Publikasikan", THE Post_Editor SHALL menyimpan postingan dengan `status` bernilai `published` ke database.
4. WHEN admin menyimpan postingan baru sebagai draft, THE Post_Editor SHALL mengarahkan admin ke halaman edit postingan tersebut (`/admin/posts/[id]`) setelah penyimpanan berhasil.
5. WHEN admin menyimpan perubahan pada draft yang sudah ada, THE Post_Editor SHALL tetap berada di halaman yang sama dan menampilkan konfirmasi bahwa draft berhasil disimpan.
6. IF terjadi kesalahan saat menyimpan draft ke database, THEN THE Post_Editor SHALL menampilkan pesan error dan tidak mengarahkan admin ke halaman lain.

---

### Requirement 3: Mempublikasikan Postingan

**User Story:** Sebagai admin, saya ingin dapat mempublikasikan draft yang sudah selesai dengan satu klik, sehingga postingan langsung dapat diakses oleh pengunjung publik.

#### Acceptance Criteria

1. WHEN admin mengklik tombol "Publikasikan" pada Post_Editor, THE PostService SHALL mengubah `status` postingan menjadi `published` dan menyimpan perubahan ke database.
2. WHEN postingan berhasil dipublikasikan, THE Post_Editor SHALL mengarahkan admin ke halaman Admin_Panel dengan pesan konfirmasi bahwa postingan berhasil dipublikasikan.
3. WHEN admin membuka Post_Editor untuk postingan yang sudah berstatus `published`, THE Post_Editor SHALL menampilkan tombol "Perbarui" sebagai pengganti tombol "Publikasikan" untuk menyimpan perubahan tanpa mengubah status.
4. WHEN admin membuka Post_Editor untuk postingan yang sudah berstatus `published`, THE Post_Editor SHALL menampilkan tombol "Jadikan Draft" untuk mengubah postingan kembali menjadi draft.
5. WHEN admin mengklik tombol "Jadikan Draft" pada postingan yang berstatus `published`, THE PostService SHALL mengubah `status` postingan menjadi `draft` dan postingan tersebut tidak lagi dapat diakses oleh pengunjung publik.

---

### Requirement 4: Daftar Postingan di Admin Panel

**User Story:** Sebagai admin, saya ingin melihat status setiap postingan di daftar Admin Panel, sehingga saya dapat dengan mudah membedakan mana yang sudah dipublikasikan dan mana yang masih draft.

#### Acceptance Criteria

1. THE Admin_Panel SHALL menampilkan indikator status (misalnya label "Draft" atau "Dipublikasikan") untuk setiap postingan dalam daftar.
2. THE Admin_Panel SHALL menampilkan postingan dengan status `draft` dan `published` dalam satu daftar yang sama.
3. WHEN Admin_Panel menampilkan daftar postingan, THE Admin_Panel SHALL mengurutkan postingan berdasarkan tanggal pembaruan terbaru (`updatedAt`) secara descending.
4. THE Admin_Panel SHALL menampilkan indikator status draft dengan tampilan visual yang berbeda dari status published agar mudah dibedakan secara sekilas.

---

### Requirement 5: Postingan Draft Tidak Terlihat oleh Pengunjung Publik

**User Story:** Sebagai pengelola blog, saya ingin memastikan postingan yang masih berstatus draft tidak dapat diakses oleh pengunjung publik, sehingga konten yang belum selesai tidak terekspos.

#### Acceptance Criteria

1. WHEN pengunjung publik mengakses URL `/{slug}` dari postingan berstatus `draft`, THE Post SHALL mengembalikan respons HTTP 404.
2. THE Public_Feed SHALL hanya menampilkan postingan dengan status `published` dalam daftar postingan di halaman utama dan halaman kategori.
3. WHEN PostService mengambil daftar postingan untuk Public_Feed, THE PostService SHALL memfilter dan hanya mengembalikan postingan dengan `status` bernilai `published`.
4. IF pengunjung publik mencoba mengakses URL postingan draft secara langsung, THEN THE Post SHALL menampilkan halaman 404 yang sama seperti postingan yang tidak ditemukan.

---

### Requirement 6: Persistensi Status Draft saat Edit

**User Story:** Sebagai admin, saya ingin status postingan tidak berubah secara tidak sengaja saat saya mengedit konten, sehingga draft tidak tiba-tiba terpublikasikan hanya karena saya menyimpan perubahan.

#### Acceptance Criteria

1. WHEN admin menyimpan perubahan pada postingan berstatus `draft` menggunakan tombol "Simpan Draft", THE PostService SHALL mempertahankan nilai `status` sebagai `draft` dan tidak mengubahnya menjadi `published`.
2. WHEN admin menyimpan perubahan pada postingan berstatus `published` menggunakan tombol "Perbarui", THE PostService SHALL mempertahankan nilai `status` sebagai `published` dan tidak mengubahnya menjadi `draft`.
3. THE Post_Editor SHALL menampilkan status postingan saat ini secara jelas di halaman edit sehingga admin selalu mengetahui status postingan yang sedang diedit.
