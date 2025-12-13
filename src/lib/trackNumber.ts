// ✅ src/lib/trackNumber.ts
import { db } from "./firebaseConfig";
import { doc, runTransaction, increment } from "firebase/firestore";

// Fungsi generate nomor tracking menggunakan atomic counter
export const generateTrackNumber = async (): Promise<string> => {
  const prefix = "TNS";
  const counterRef = doc(db, "counters", "service_request_counter");

  try {
    const newTrackingNumber = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);

      if (!counterDoc.exists()) {
        // Ini seharusnya tidak terjadi jika setup manual di Firebase Console berhasil.
        // Melempar error adalah tindakan yang tepat agar masalah setup bisa diketahui.
        throw new Error("Dokumen counter 'service_request_counter' tidak ditemukan di collection 'counters'!");
      }

      // Nomor baru adalah angka yang ada di counter + 1
      const newNumber = counterDoc.data().current_number + 1;

      // Perintahkan transaksi untuk menaikkan (increment) angka di database sebesar 1.
      // Ini akan dieksekusi saat transaksi berhasil di-commit.
      transaction.update(counterRef, { current_number: increment(1) });

      // Kembalikan nomor baru untuk digunakan pada TNS
      return newNumber;
    });

    // Format nomor lacak dengan padding nol, misal: TNS-00034
    return `${prefix}-${String(newTrackingNumber).padStart(5, "0")}`;

  } catch (error) {
    console.error("FATAL: Gagal membuat nomor lacak karena transaksi atomik gagal.", error);
    // Lempar error lagi agar bisa ditangani oleh fungsi yang memanggil (UI/form)
    // dan menampilkan pesan error yang sesuai kepada pengguna.
    throw new Error("Tidak dapat membuat nomor lacak. Silakan coba lagi.");
  }
};
