@startuml
title Aktivitas Sistem Form Service - Alur Lengkap

|Customer|
start
:Mengunjungi Website;
:Mengisi & Submit Form Service;
|Sistem|
:Memvalidasi data form;
if (Data valid?) then (Ya)
  :Menyimpan Service Request baru;
  :Membuat Nomor Pelacakan unik (TNS);
  :Menampilkan TNS ke Customer;
else (Tidak)
  :Menampilkan error validasi;
  stop
endif
|Customer|
:Menerima & menyimpan TNS;
end

...Sementara itu...

|Sistem|
:Menambahkan Request ke daftar tugas Staff;

|Staff|
start
:Login ke sistem;
:Melihat daftar tugas;
:Memilih & membuka Service Request;
repeat
  :Melakukan pengerjaan (diagnosa/perbaikan);
  :Memperbarui status pengerjaan;
  :Menambah foto atau komentar;
  |Sistem|
  :Menyimpan perubahan ke database;
  :Mencatat aktivitas ke dalam log;
repeat while (Belum Selesai)
:Menandai status "Selesai";
|Sistem|
:Menyimpan status akhir;
end

|Customer|
start
:Mengunjungi halaman pelacakan;
:Memasukkan TNS;
|Sistem|
:Mencari TNS di database;
:Menampilkan detail & histori status;
|Customer|
:Melihat progres pengerjaan;
end

|Manager / Owner|
start
:Login ke sistem;
:Melihat Dashboard utama;
fork
  :Membuka halaman "Pending Users";
  if (Ada pendaftar baru?) then (Ya)
    :Review detail pendaftar;
    :Approve / Reject pendaftaran;
    |Sistem|
    :Mengubah status user di database;
  endif
fork again
  :Membuka halaman "Laporan";
  :Memilih jenis laporan (misal: Kinerja Teknisi);
  |Sistem|
  :Mengambil & mengagregasi data;
  :Menampilkan laporan dalam bentuk tabel/grafik;
end fork
end

|Admin|
start
:Login ke sistem;
:Membuka halaman "Admin";
fork
  :Mengelola data Pengguna (CRUD);
  |Sistem|
  :Menyimpan perubahan pada data pengguna;
fork again
  :Mengelola data Cabang (CRUD);
  |Sistem|
  :Menyimpan perubahan pada data cabang;
fork again
  :Melihat Log Aktivitas Sistem;
  |Sistem|
  :Menampilkan seluruh log dari database;
end fork
end

@enduml
