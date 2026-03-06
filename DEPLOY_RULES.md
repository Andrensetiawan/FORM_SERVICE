# Cara Deploy Firestore Rules

## Error yang terjadi:
```
Missing or insufficient permissions
```

## Penyebab:
File `firestore.rules` sudah diperbaiki di lokal, tapi belum di-deploy ke Firebase server.

## Solusi - Deploy Manual via Console:

1. **Buka Firebase Console:**
   https://console.firebase.google.com

2. **Pilih Project Anda**

3. **Navigasi ke Firestore Database:**
   - Klik "Firestore Database" di menu kiri
   - Klik tab "Rules" di bagian atas

4. **Copy Rules yang Sudah Diperbaiki:**
   - Buka file `firestore.rules` dari repository ini
   - Copy semua isinya (Ctrl+A, Ctrl+C)

5. **Paste ke Editor di Console:**
   - Paste di editor Firebase Console (mengganti semua rules yang ada)

6. **Publish Rules:**
   - Klik tombol **"Publish"** di kanan atas
   - Tunggu sampai muncul notifikasi sukses

7. **Test Aplikasi:**
   - Refresh halaman aplikasi (Ctrl+F5)
   - Coba kirim komentar customer lagi
   - Seharusnya sudah tidak ada error permission

## Perubahan yang Sudah Dilakukan di firestore.rules:

- ✅ Ubah validasi field dari `body` → `comment`
- ✅ Ubah `comment.size() > 0` → `>= 0` (izinkan comment kosong jika ada media)
- ✅ Ubah limit media dari 6 → 10
- ✅ Memastikan public bisa create customer_log tanpa auth

## Alternatif - Install Firebase CLI (untuk deploy otomatis):

```powershell
npm install -g firebase-tools
firebase login
firebase init firestore
firebase deploy --only firestore:rules
```

Tapi cara manual via console lebih cepat dan tidak perlu setup CLI.
