```mermaid
sequenceDiagram
    autonumber
    participant Customer as Pelanggan
    participant Staff
    participant System as Sistem

    Customer->>+Staff: Permintaan tagihan & pembayaran
    Staff->>+System: Mengambil detail service (ID Service)
    System-->>-Staff: Menampilkan detail (item, jasa, total biaya)
    Staff->>Customer: Konfirmasi rincian biaya
    Customer->>Staff: Setuju dengan rincian

    Staff->>+System: Proses & buat Nota Pembayaran
    System-->>-Staff: Nota Pembayaran berhasil dibuat
    Staff->>Customer: Serahkan Nota Pembayaran (cetak/digital)
    
    Customer->>+Staff: Melakukan pembayaran (cash/transfer)
    Staff->>+System: Update status service menjadi "Lunas"
    System-->>-Staff: Konfirmasi status berhasil diupdate
    Staff->>-Customer: Memberikan bukti pembayaran & menyerahkan unit
```

**Penjelasan Aktor:**
- **Pelanggan:** Pemilik unit yang akan melakukan pembayaran.
- **Staff:** Karyawan (kasir/admin) yang melayani proses pembayaran.
- **Sistem:** Aplikasi atau software yang digunakan untuk mengelola data servis dan transaksi.
