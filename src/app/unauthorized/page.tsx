export default function UnauthorizedPage() {
  return (
    <div className="h-screen flex flex-col justify-center items-center text-center">
      <h1 className="text-3xl font-bold text-red-600">Akses Ditolak 🚫</h1>
      <p className="text-gray-500 mt-3">
        Kamu tidak memiliki izin untuk mengakses halaman ini.
      </p>
    </div>
  );
}
