# Laporan Use Case: Sistem Informasi Servis

Dokumen ini menjelaskan fungsionalitas (Use Case) dari Sistem Informasi Servis berdasarkan peran pengguna (Aktor).

## 1. Tujuan Sistem

Tujuan utama dari sistem ini adalah untuk menyediakan platform digital bagi pelanggan untuk mengajukan permintaan servis, memantau status pengerjaan, serta bagi internal perusahaan (Staff, Manager, Admin, Owner) untuk mengelola alur kerja servis, dari penerimaan hingga selesai.

## 2. Aktor Sistem

Aktor atau pengguna yang berinteraksi dengan sistem ini adalah:

1.  **Customer (Pelanggan)**: Pengguna publik yang tidak perlu login.
2.  **Staff (Teknisi/Staf)**: Karyawan yang menangani pengerjaan servis.
3.  **Manager (Manajer)**: Atasan yang mengawasi Staff dan laporan.
4.  **Admin (Administrator)**: Pengelola utama sistem dan pengguna.
5.  **Owner (Pemilik)**: Pemilik usaha yang memantau performa bisnis.

## 3. Ringkasan Use Case Berdasarkan Aktor

Berikut adalah ringkasan fungsionalitas untuk setiap aktor:

---

### A. Customer

| Nama Use Case | Deskripsi |
| :--- | :--- |
| **Mengajukan Formulir Servis** | Customer dapat mengisi dan mengirimkan formulir permintaan servis baru. |
| **Melacak Status Servis** | Customer dapat mencari dan melihat progres servis berdasarkan nomor telepon atau kode TNS. |
| **Memberikan Komentar/Umpan Balik** | Customer dapat menambahkan komentar atau bertanya pada halaman pelacakan servis. |

---

### B. Staff

| Nama Use Case | Deskripsi |
| :--- | :--- |
| **Login ke Sistem** | Staff harus melakukan login untuk mengakses dasbor mereka. |
| **Menginput Data Servis** | Staff memasukkan data lengkap servis baru ke dalam sistem. |
| **Mengelola Detail Servis** | Staff dapat memperbarui status pengerjaan, menambah catatan teknisi, mengunggah foto, dll. |

---

### C. Manager/Admin

| Nama Use Case | Deskripsi |
| :--- | :--- |
| _(Mencakup semua Use Case Staff)_ | Manager & Admin memiliki semua hak akses yang dimiliki oleh Staff. |
| **Menyetujui Staff Baru** | Manager/Admin dapat menyetujui atau menolak permintaan registrasi akun staff baru. |
| **Mengelola Pengguna & Laporan** | Mengelola semua data pengguna dan melihat laporan operasional. |
| **Mengelola Cabang & Pengaturan**| (Admin) Mengelola data cabang dan pengaturan sistem. |

---

### D. Owner

| Nama Use Case | Deskripsi |
| :--- | :--- |
| **Login ke Sistem** | Owner harus melakukan login untuk mengakses dasbor mereka. |
| **Melihat Laporan Seluruh Cabang** | Owner dapat melihat dasbor dan laporan gabungan dari semua cabang untuk memantau performa bisnis. |

---

## 4. Fungsi Utama Sistem

-   **Customer**: Cek status TNS (Track and Trace Number System) berdasarkan nomor telepon atau `tns_code`.
-   **Staff**: Input data servis.
-   **Manager/Admin**: Approve staff baru.
-   **Owner**: Melihat seluruh laporan cabang.

---

## 5. Detail Use Case

Berikut adalah rincian alur kerja untuk beberapa Use Case utama:

### **UC-01: Customer Melakukan Pencarian TNS**

-   **ID**: UC-01
-   **Nama Use Case**: Customer Melakukan Pencarian TNS
-   **Aktor**: Customer (Publik)
-   **Deskripsi**: Use case ini dimulai ketika customer ingin mengetahui status servis mereka. Customer mengakses halaman utama dan menggunakan fitur pencarian.
-   **Alur Normal**:
    1.  Customer membuka aplikasi/website.
    2.  Sistem menampilkan halaman utama dengan kolom pencarian TNS.
    3.  Customer memasukkan nomor telepon atau kode TNS (`tns_code`) ke dalam kolom pencarian.
    4.  Customer menekan tombol "Cari" atau "Lacak".
    5.  Sistem melakukan validasi pencarian di database.
    6.  Sistem menemukan data servis yang cocok dan menampilkan halaman detail status servis tersebut.
-   **Alur Alternatif (Data Tidak Ditemukan)**:
    5a. Sistem tidak menemukan data servis yang cocok.
    6a. Sistem menampilkan pesan "Data tidak ditemukan. Mohon periksa kembali nomor yang Anda masukkan."

### **UC-02: Staff Menginput Data Servis**

-   **ID**: UC-02
-   **Nama Use Case**: Staff Menginput Data Servis
-   **Aktor**: Staff
-   **Deskripsi**: Use case ini dimulai ketika ada permintaan servis baru yang perlu dimasukkan ke dalam sistem.
-   **Alur Normal**:
    1.  Staff melakukan login ke sistem.
    2.  Staff mengakses menu "Input Data Servis" atau "Formulir Servis Baru".
    3.  Sistem menampilkan formulir input data servis yang berisi kolom: data customer (nama, kontak), informasi perangkat (model, keluhan), dll.
    4.  Staff mengisi semua informasi yang diperlukan pada formulir.
    5.  Staff menekan tombol "Simpan" atau "Submit".
    6.  Sistem memvalidasi data. Jika valid, sistem menyimpan data servis baru dan menghasilkan TNS Code unik.
    7.  Sistem menampilkan notifikasi "Data berhasil disimpan" beserta TNS Code yang bisa diberikan ke customer.

### **UC-03: Admin Menyetujui Staff Baru**

-   **ID**: UC-03
-   **Nama Use Case**: Admin Menyetujui Staff Baru
-   **Aktor**: Admin (atau Manager)
-   **Deskripsi**: Use case ini dimulai ketika ada seorang calon staff yang telah mendaftar dan menunggu persetujuan untuk bisa mengakses sistem.
-   **Alur Normal**:
    1.  Admin melakukan login ke sistem.
    2.  Admin mengakses menu "Manajemen Pengguna" -> "Pengguna Tertunda" (Pending Users).
    3.  Sistem menampilkan daftar calon staff yang menunggu persetujuan.
    4.  Admin memilih salah satu nama dari daftar untuk melihat detailnya.
    5.  Admin menekan tombol "Setujui" (Approve).
    6.  Sistem mengubah status pengguna tersebut dari "tertunda" menjadi "aktif" dan memberikan peran "Staff".
    7.  Sistem menampilkan notifikasi "Pengguna berhasil disetujui".
-   **Alur Alternatif (Penolakan)**:
    5a. Admin menekan tombol "Tolak" (Reject).
    6a. Sistem menghapus data pengguna tersebut atau memberinya status "ditolak".
    7a. Sistem menampilkan notifikasi "Pengguna telah ditolak".

### **UC-04: Owner Melihat Laporan Servis**

-   **ID**: UC-04
-   **Nama Use Case**: Owner Melihat Laporan Servis
-   **Aktor**: Owner
-   **Deskripsi**: Use case ini dimulai ketika Owner ingin memantau kinerja bisnis dari semua cabang.
-   **Alur Normal**:
    1.  Owner melakukan login ke sistem.
    2.  Sistem secara otomatis mengarahkan Owner ke halaman Dasbor utama.
    3.  Dasbor menampilkan ringkasan statistik dari seluruh cabang, seperti:
        -   Jumlah servis masuk (harian, bulanan).
        -   Total pendapatan.
        -   Perbandingan kinerja antar cabang.
        -   Status servis yang sedang berjalan (misal: % selesai, % tertunda).
    4.  Owner dapat menggunakan filter (misalnya, rentang tanggal atau pilih cabang tertentu) untuk melihat data yang lebih spesifik.
    5.  Sistem memperbarui tampilan laporan sesuai dengan filter yang dipilih Owner.