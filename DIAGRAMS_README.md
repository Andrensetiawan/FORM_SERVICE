# Panduan Penggunaan Diagram UML untuk Laporan

Dokumen ini memberikan panduan singkat tentang cara menyertakan file gambar diagram (`.svg` atau `.png`) yang telah dibuat ke dalam dokumen laporan Anda, seperti skripsi atau tugas akhir, menggunakan LaTeX atau Microsoft Word.

## Daftar File Diagram

Berikut adalah daftar nama file yang disarankan untuk setiap diagram yang telah dibuat. Anda dapat men-generate gambar dari kode PlantUML (misalnya melalui situs `plantuml.com` atau ekstensi di VS Code) dan menyimpannya dengan nama-nama ini.

1.  `usecase_form_service.svg`
2.  `class_diagram_form_service.svg`
3.  `sequence_staff_registration.svg`
4.  `sequence_create_service_form.svg`
5.  `sequence_customer_track_status.svg`
6.  `sequence_owner_view_kpi.svg`
7.  `activity_create_service_flow.svg`
8.  `activity_update_status_flow.svg`
9.  `statemachine_servicerequest.svg`
10. `component_diagram_form_service.svg`
11. `deployment_diagram_form_service.svg`
12. `package_diagram_form_service.svg`
13. `erd_form_service.svg`
14. `dfd_level_0_context.svg`
15. `dfd_level_1_detail.svg`

## Cara Menggunakan di LaTeX

Untuk memasukkan gambar ke dalam dokumen LaTeX, Anda bisa menggunakan package `graphicx`. Pastikan file gambar berada dalam direktori proyek LaTeX Anda, atau dalam sub-direktori (misalnya, `images/`).

1.  **Tambahkan package `graphicx`** di bagian preamble (sebelum `\begin{document}`) dokumen `.tex` Anda:
    ```latex
    \usepackage{graphicx}
    % Opsional: untuk mengatur path ke folder gambar
    \graphicspath{ {./images/} }
    ```

2.  **Gunakan perintah `\includegraphics`** di dalam `figure` environment untuk menyisipkan gambar, lengkap dengan caption dan label.
    ```latex
    \begin{figure}[h!]
        \centering
        \includegraphics[width=0.8\textwidth]{usecase_form_service}
        \caption{Diagram Use Case Sistem Form Service.}
        \label{fig:usecase}
    \end{figure}
    ```
    -   Ganti `width=0.8\textwidth` untuk menyesuaikan ukuran gambar.
    -   Ganti `usecase_form_service` dengan nama file gambar yang sesuai (tanpa ekstensi).
    -   Ganti isi `\caption{...}` dengan deskripsi yang Anda inginkan.
    -   Gunakan `\ref{fig:usecase}` di dalam teks untuk merujuk ke gambar ini.

## Cara Menggunakan di Microsoft Word

Menambahkan gambar di Microsoft Word lebih sederhana.

1.  **Letakkan kursor** di tempat Anda ingin menyisipkan gambar.
2.  Buka tab **"Insert"** pada menu ribbon di bagian atas.
3.  Klik **"Pictures"** -> **"This Device..."**.
4.  **Pilih file gambar** (misalnya, `usecase_form_service.svg`) dari komputer Anda dan klik **"Insert"**.
5.  **Atur Ukuran dan Posisi:** Klik pada gambar untuk menampilkan handle pengubah ukuran. Seret sudutnya untuk mengubah ukuran secara proporsional. Gunakan opsi "Layout Options" yang muncul di samping gambar untuk mengatur text wrapping (misalnya, "In Line with Text" atau "Top and Bottom").
6.  **Tambahkan Caption:** Klik kanan pada gambar, lalu pilih **"Insert Caption..."**. Tulis caption Anda di dialog box yang muncul, lalu klik "OK". Word akan secara otomatis menomori caption Anda.

## Menggunakan Kode PlantUML

Jika Anda ingin memodifikasi diagram, Anda bisa menyalin blok kode PlantUML dari file `SISTEM_UML.md` dan menempelkannya ke editor online seperti [PlantUML Web Server](http://www.plantuml.com/plantuml) atau menggunakan ekstensi PlantUML di editor kode seperti Visual Studio Code untuk meng-generate ulang file gambarnya.

```