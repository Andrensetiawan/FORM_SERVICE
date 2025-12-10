# Diagram UML & Desain Sistem Aplikasi "Form Service"

Dokumen ini berisi kumpulan diagram UML dan desain sistem untuk aplikasi "Form Service". Setiap diagram disajikan dalam format PlantUML, beserta nama file yang disarankan, caption untuk laporan, dan asumsi teknis yang dibuat selama proses desain.

<details>
<summary>1. Use Case Diagram</summary>

### Judul: Use Case Diagram
Diagram ini menggambarkan interaksi antara aktor (pengguna dan sistem eksternal) dengan fungsionalitas utama sistem "Form Service".

**Nama File:** `usecase_form_service.svg`

**Caption:**
Diagram Use Case menunjukkan fungsionalitas utama dari sistem "Form Service" dan bagaimana berbagai jenis pengguna (Aktor) berinteraksi dengannya. Diagram ini membedakan hak akses dan tugas yang dapat dilakukan oleh Customer, Staff, Manager, Owner, dan Admin.

**Asumsi Teknis:**
-   Setiap aktor memiliki batasan fungsionalitas yang jelas sesuai dengan perannya (role).
-   Aktor "Customer" adalah pengguna publik yang tidak perlu login untuk membuat dan melacak laporan.
-   Terdapat hubungan pewarisan (generalization) antar role internal (Staff, Manager, Owner, Admin), di mana role yang lebih tinggi mewarisi kemampuan role di bawahnya.
-   Sistem eksternal seperti Firebase dan Cloudinary dianggap sebagai aktor pendukung.

```plantuml
@startuml
left to right direction

actor Customer as Guest
actor Staff
actor Manager
actor Owner
actor Admin

rectangle "Sistem Form Service" {
  usecase "Membuat Laporan Servis" as UC_CREATE
  usecase "Melacak Status Laporan" as UC_TRACK
  usecase "Mengelola Data Laporan" as UC_MANAGE_FORM
  usecase "Memperbarui Profil" as UC_PROFILE
  usecase "Menyetujui Pendaftaran Staff" as UC_APPROVE
  usecase "Melihat Laporan Kinerja" as UC_VIEW_KPI
  usecase "Mengelola Pengguna (CRUD)" as UC_MANAGE_USERS
  usecase "Mengelola Cabang (CRUD)" as UC_MANAGE_BRANCH
  usecase "Mengonfigurasi Sistem" as UC_CONFIG
}

' Role Hierarchy
Admin --|> Owner
Owner --|> Manager
Manager --|> Staff

' Actor to Use Cases
Guest --> UC_CREATE
Guest --> UC_TRACK

Staff --> UC_MANAGE_FORM
Staff --> UC_PROFILE

Manager --> UC_APPROVE
Manager --> UC_VIEW_KPI

Owner --> UC_MANAGE_USERS
Owner --> UC_MANAGE_BRANCH

Admin --> UC_CONFIG

@enduml
```

</details>

<details>
<summary>2. Class Diagram</summary>

### Judul: Class Diagram
Diagram ini memodelkan struktur statis sistem dengan menunjukkan kelas-kelas utama, atribut, method, dan hubungan antar kelas.

**Nama File:** `class_diagram_form_service.svg`

**Caption:**
Diagram Class ini merepresentasikan model domain dari aplikasi "Form Service". Diagram ini menyoroti entitas-entitas kunci seperti `User`, `ServiceRequest`, dan `Cabang`, beserta atribut, method, dan relasi asosiasi, agregasi, dan komposisi yang menjelaskan bagaimana mereka saling terhubung.

**Asumsi Teknis:**
-   Relasi antara `ServiceRequest` dan `Comment` adalah Komposisi, artinya `Comment` tidak dapat ada tanpa `ServiceRequest`.
-   Relasi antara `User` dan `Role` adalah Agregasi, karena `Role` bisa ada secara independen.
-   Atribut dan method yang ditampilkan adalah yang paling relevan dan bukan daftar lengkap.
-   `ServiceRequest` memiliki asosiasi dengan `User` (teknisi yang menangani) dan `Cabang` (lokasi servis).

```plantuml
@startuml

title Class Diagram - Sistem Form Service

class User {
  +string uid
  +string email
  +string name
  +string avatarUrl
  +string status ('pending', 'approved')
  --
  +updateProfile()
  +requestApproval()
}

class ServiceRequest {
  +string id
  +string trackingNumber
  +string customerName
  +string customerPhone
  +string deviceType
  +string initialIssue
  +string status
  +datetime createdAt
  +datetime updatedAt
  --
  +addComment(text)
  +updateStatus(newStatus)
  +addPhoto(url)
  +setEstimation(cost, time)
}

class Comment {
  +string id
  +string text
  +string userId
  +datetime createdAt
}

class Photo {
  +string id
  +string url
  +string description
  +datetime uploadedAt
}

class Cabang {
  +string id
  +string name
  +string address
}

class CustomerLog {
  +string id
  +string activity
  +datetime timestamp
}

enum Role {
  ADMIN
  OWNER
  MANAGER
  STAFF
}

' Relationships
User "1" *-- "1" Role : has a
User "1..*" --o "0..1" Cabang : works at

User "1" -- "0..*" ServiceRequest : handles >
User "1" -- "0..*" Comment : writes >

ServiceRequest "1" *-- "0..*" Comment : contains
ServiceRequest "1" *-- "0..*" Photo : has
ServiceRequest "1" *-- "0..*" CustomerLog : logs

@enduml
```

</details>

<details>
<summary>3. Sequence Diagram (4 Skenario)</summary>

#### Skenario 1: Pendaftaran Staff & Persetujuan Manager

**Nama File:** `sequence_staff_registration.svg`

**Caption:**
Diagram Sequence ini mengilustrasikan alur proses saat seorang calon staff mendaftar hingga akunnya disetujui oleh seorang Manager. Proses ini melibatkan interaksi antara pengguna, frontend, backend API, dan database Firestore.

**Asumsi Teknis:**
-   Pendaftaran membuat record user di Firestore dengan status `pending` dan role `staff`.
-   Manager menerima notifikasi atau secara aktif memeriksa daftar pengguna `pending`.
-   API backend memiliki endpoint terpisah untuk registrasi dan persetujuan.

```plantuml
@startuml
title Sequence Diagram - Pendaftaran Staff & Persetujuan Manager

actor "Calon Staff" as User
participant "Frontend (Next.js)" as FE
participant "API (Next.js Route)" as API
database "Firebase Auth" as Auth
database "Firestore" as DB
actor Manager

autonumber

User -> FE : Mengisi & submit form registrasi
FE -> API : POST /api/auth/register (data)
API -> Auth : createUser(email, password)
Auth --> API : { uid }
API -> DB : createDoc('users', uid, {..., role:'staff', status:'pending'})
API --> FE : { success: true }
FE --> User : Tampilkan "Pendaftaran berhasil, menunggu persetujuan"

... Beberapa waktu kemudian ...

Manager -> FE : Buka halaman "Pending Users"
FE -> API : GET /api/users?status=pending
API -> DB : query('users', where('status', '==', 'pending'))
DB --> API : [userPending1, userPending2]
API --> FE : [userPending1, userPending2]
FE --> Manager : Tampilkan daftar pengguna pending

Manager -> FE : Klik tombol "Approve" pada user
FE -> API : POST /api/users/{userId}/approve
API -> DB : updateDoc('users', userId, {status: 'approved'})
DB --> API : { success: true }
API --> FE : { success: true }
FE --> Manager : Tampilkan "User telah disetujui"

@enduml
```

#### Skenario 2: Staff Membuat Form Service Baru

**Nama File:** `sequence_create_service_form.svg`

**Caption:**
Diagram Sequence ini merinci langkah-langkah yang terjadi ketika seorang Staff membuat laporan servis baru, termasuk proses unggah foto bukti ke Cloudinary dan penyimpanan data ke Firestore.

**Asumsi Teknis:**
-   Proses unggah foto terjadi sebelum form utama disimpan. URL foto dari Cloudinary disertakan dalam data yang dikirim ke Firestore.
-   Backend memiliki API terpisah untuk `upload` (mendapatkan signed URL dari Cloudinary) dan `create-form`.
-   Nomor lacak (`trackingNumber`) digenerate di sisi backend saat data disimpan.

```plantuml
@startuml
title Sequence Diagram - Staff Membuat Form Service Baru

actor Staff
participant "Frontend (Next.js)" as FE
participant "API (Serverless Func)" as API
participant "Cloudinary" as Cloud
database "Firestore" as DB

autonumber

Staff -> FE : Mengisi detail form service & memilih foto
FE -> API : POST /api/upload (minta signed URL)
API -> Cloud : generateSignedUploadUrl()
Cloud --> API : { signedUrl, publicId }
API --> FE : { signedUrl, publicId }

FE -> Cloud : Upload file foto ke signedUrl
Cloud --> FE : { success: true }

note right of FE: Frontend kini memiliki URL foto

FE -> API : POST /api/service-requests (data form + photoUrl)
API -> API : generateTrackingNumber()
API -> DB : createDoc('service_requests', {..., trackingNumber, photoUrl})
DB --> API : { id: newDocId }
API --> FE : { success: true, trackingNumber }
FE --> Staff : Tampilkan "Form berhasil dibuat" & Nomor Lacak

@enduml
```

#### Skenario 3: Customer Melacak Status Servis

**Nama File:** `sequence_customer_track_status.svg`

**Caption:**
Diagram Sequence ini menunjukkan alur sederhana saat seorang Customer menggunakan nomor lacak untuk memeriksa status perbaikan perangkatnya melalui antarmuka publik.

**Asumsi Teknis:**
-   Tidak diperlukan autentikasi untuk mengakses endpoint pelacakan.
-   Endpoint API `/api/find-tns` dirancang khusus untuk pencarian publik berdasarkan `trackingNumber`.
-   Aturan keamanan Firestore (`firestore.rules`) mengizinkan pembacaan data `service_requests` secara publik jika query dilakukan melalui nomor lacak yang valid.

```plantuml
@startuml
title Sequence Diagram - Customer Melacak Status Servis

actor Customer
participant "Frontend (Public Page)" as FE
participant "API (Next.js Route)" as API
database "Firestore" as DB

autonumber

Customer -> FE : Masukkan Nomor Lacak & klik "Cari"
FE -> API : GET /api/find-tns?tns={trackingNumber}
API -> DB : query('service_requests', where('trackingNumber', '==', tns))
DB --> API : [serviceRequestData]
API --> FE : serviceRequestData

alt Data Ditemukan
    FE --> Customer : Tampilkan detail & status servis
else Data Tidak Ditemukan
    FE --> Customer : Tampilkan pesan "Nomor tidak ditemukan"
end

@enduml
```

#### Skenario 4: Owner Melihat Laporan Kinerja Staff

**Nama File:** `sequence_owner_view_kpi.svg`

**Caption:**
Diagram Sequence ini menggambarkan proses saat seorang Owner mengakses dashboard untuk melihat laporan Key Performance Indicator (KPI) staff, yang datanya diagregasi dari koleksi di Firestore.

**Asumsi Teknis:**
-   KPI dihitung secara *real-time* di backend saat ada permintaan.
-   Backend API melakukan query kompleks atau agregasi data dari `service_requests` dan `users` untuk menghasilkan statistik.
-   Frontend bertanggung jawab untuk memvisualisasikan data KPI yang diterima (misalnya dalam bentuk tabel atau grafik).

```plantuml
@startuml
title Sequence Diagram - Owner Melihat Laporan Kinerja Staff

actor Owner
participant "Frontend (Dashboard)" as FE
participant "API (Serverless Func)" as API
database "Firestore" as DB

autonumber

Owner -> FE : Buka halaman "Laporan Kinerja"
FE -> API : GET /api/reports/kpi?period=monthly
note right of API: API melakukan agregasi data

API -> DB : Query: hitung jumlah service diselesaikan per staff
DB --> API : Data agregat mentah
API -> API : Proses & format data menjadi struktur KPI
API --> FE : { kpiData: [...] }
FE -> FE : Render data KPI dalam bentuk grafik & tabel
FE --> Owner : Tampilkan dashboard Kinerja Staff

@enduml
```

</details>

<details>
<summary>4. Activity Diagram (2 Alur)</summary>

#### Alur 1: Proses Pembuatan Laporan Servis oleh Staff

**Nama File:** `activity_create_service_flow.svg`

**Caption:**
Diagram Aktivitas ini menjabarkan langkah-langkah sekuensial dan paralel yang dilakukan oleh seorang Staff dari awal hingga akhir saat membuat sebuah laporan servis baru.

**Asumsi Teknis:**
-   Pengisian data dan unggah foto bisa dianggap sebagai aktivitas yang terjadi dalam satu fase.
-   Sistem melakukan validasi data sebelum menyimpannya ke database.
-   Setelah data tersimpan, sistem melakukan dua tindakan secara paralel: membuat log dan menampilkan konfirmasi.

```plantuml
@startuml
title Activity Diagram - Alur Pembuatan Laporan Servis

start
:Staff Login ke Sistem;
:Buka Halaman Form Service Baru;
:Mengisi Informasi Customer & Perangkat;
:Mengunggah Foto Kondisi Awal;

if (Data Valid?) then (ya)
  :Sistem Generate Nomor Lacak;
  fork
    :Simpan Data ke Firestore;
  fork again
    :Simpan Foto ke Cloudinary & Tautkan URL;
  end fork
  :Buat Log Aktivitas;
  :Tampilkan Halaman Sukses dengan Nomor Lacak;
else (tidak)
  :Tampilkan Pesan Error Validasi;
  :Kembali ke Form;
endif

stop

@enduml
```

#### Alur 2: Proses Pembaruan Status Servis

**Nama File:** `activity_update_status_flow.svg`

**Caption:**
Diagram Aktivitas ini menguraikan alur kerja seorang teknisi (Staff) saat memperbarui status sebuah laporan servis, mulai dari pemilihan laporan hingga pencatatan histori perubahan.

**Asumsi Teknis:**
-   Setiap pembaruan status dicatat dalam sebuah log atau sub-koleksi untuk tujuan audit.
-   Terdapat beberapa kemungkinan alur berdasarkan status yang dipilih (misalnya, "Menunggu Sparepart" atau "Selesai").
-   Sistem secara otomatis mengirim notifikasi kepada pelanggan (asumsi fungsionalitas tambahan).

```plantuml
@startuml
title Activity Diagram - Alur Pembaruan Status Servis

start

:Teknisi Login;
:Membuka Daftar Laporan Servis;
:Pilih Laporan yang Akan Diperbarui;
:Mengubah Status Laporan;

switch (Status Baru?)
case ( Dikerjakan )
  :Mencatat Waktu Mulai;
case ( Menunggu Sparepart )
  :Menambahkan Catatan Sparepart yang Dibutuhkan;
case ( Selesai )
  :Menambahkan Catatan Hasil Perbaikan;
  :Mengunggah Foto Hasil Perbaikan;
case ( Diambil )
  :Menutup Laporan Servis;
endswitch

:Simpan Perubahan ke Firestore;
:Catat Perubahan ke Customer Log;
:Kirim Notifikasi ke Customer (Opsional);

stop

@enduml
```

</details>

<details>
<summary>5. State Machine Diagram</summary>

### Judul: State Machine Diagram untuk ServiceRequest
Diagram ini menunjukkan berbagai status (state) yang dapat dimiliki oleh sebuah `ServiceRequest` dan transisi antar status tersebut.

**Nama File:** `statemachine_servicerequest.svg`

**Caption:**
Diagram State Machine ini memvisualisasikan siklus hidup (lifecycle) dari sebuah laporan servis (`ServiceRequest`). Diagram ini memperlihatkan semua kemungkinan status dari "Baru" hingga "Diambil" atau "Dibatalkan", serta aksi (event) yang memicu transisi dari satu status ke status berikutnya.

**Asumsi Teknis:**
-   Sebuah `ServiceRequest` selalu dimulai dari status `Baru`.
-   Transisi antar status dipicu oleh aksi yang dilakukan oleh Staff atau sistem.
-   Ada status akhir yaitu `Diambil` dan `Dibatalkan`. Dari status ini tidak ada transisi keluar.

```plantuml
@startuml
title State Machine Diagram - ServiceRequest Lifecycle

[*] --> Baru : Dibuat

Baru --> Dikerjakan : teknisiMulaiKerjakan()
Dikerjakan --> MenungguSparepart : butuhSparepart()
MenungguSparepart --> Dikerjakan : sparepartTiba()
Dikerjakan --> Selesai : selesaiDiperbaiki()
Selesai --> Diambil : customerAmbilBarang()

Baru --> Dibatalkan : dibatalkan()
Dikerjakan --> Dibatalkan : dibatalkan()
MenungguSparepart --> Dibatalkan : dibatalkan()
Selesai --> Dibatalkan : dibatalkan()

Diambil --> [*]
Dibatalkan --> [*]

@enduml
```

</details>

<details>
<summary>6. Component Diagram</summary>

### Judul: Component Diagram
Diagram ini memecah sistem menjadi komponen-komponen logis utama dan menunjukkan dependensi di antara mereka.

**Nama File:** `component_diagram_form_service.svg`

**Caption:**
Diagram Komponen ini menyajikan arsitektur modular dari aplikasi "Form Service". Diagram ini mengidentifikasi komponen-komponen utama seperti Antarmuka Pengguna (UI), Logika Aplikasi (Hooks & Libs), dan API Backend, serta interaksinya dengan layanan eksternal seperti Firebase dan Cloudinary.

**Asumsi Teknis:**
-   Struktur komponen didasarkan pada direktori proyek Next.js (`/src/app`, `/src/components`, `/src/lib`).
-   Komponen `API Routes` bertindak sebagai fasad (facade) yang menyembunyikan kompleksitas interaksi dengan layanan backend.
-   `UI Components` adalah komponen React yang dapat digunakan kembali, terpisah dari logika halaman.

```plantuml
@startuml
title Component Diagram - Sistem Form Service

package "Browser Client" {
  [Frontend App (Next.js)] as FE_App
  [UI Components] as UI
  [State Management & Hooks] as Hooks
}

package "Backend Services" {
  [API Routes (Next.js)] as API
  
  database "Firestore" as DB
  artifact "Firebase Auth" as Auth
  artifact "Cloudinary Storage" as Cloud
}

' Dependencies
FE_App --> UI
FE_App --> Hooks
FE_App -right-> API : (HTTP/S)

Hooks ..> API : calls
API ..> Auth : uses
API ..> DB : reads/writes
API ..> Cloud : uploads

@enduml
```

</details>

<details>
<summary>7. Deployment Diagram</summary>

### Judul: Deployment Diagram
Diagram ini menunjukkan arsitektur fisik dan logis dari penempatan (deployment) sistem.

**Nama File:** `deployment_diagram_form_service.svg`

**Caption:**
Diagram Deployment ini mengilustrasikan bagaimana komponen perangkat lunak aplikasi "Form Service" dipetakan ke infrastruktur perangkat keras dan layanan cloud. Ini menunjukkan bahwa pengguna berinteraksi dengan aplikasi Next.js yang di-hosting di Vercel, yang kemudian berkomunikasi dengan layanan backend dari Firebase dan Cloudinary.

**Asumsi Teknis:**
-   Aplikasi di-hosting di Vercel, yang menyediakan lingkungan serverless, web server, dan CDN secara terintegrasi.
-   Firebase (Firestore, Auth, Functions) dan Cloudinary adalah layanan PaaS (Platform as a Service) yang dikelola secara terpisah.
-   `Cloud Functions` adalah asumsi untuk tugas-tugas backend yang lebih berat atau terjadwal, meskipun API Routes Next.js mungkin sudah cukup.

```plantuml
@startuml
title Deployment Diagram - Sistem Form Service

node "Perangkat Pengguna" as UserDevice {
  artifact "Web Browser" as Browser
}

node "Vercel Platform" as Vercel {
  node "CDN (Edge Network)" as CDN
  node "Serverless Functions" as Serverless {
    artifact "Next.js Application" as NextApp
  }
}

package "Google Cloud Platform" {
    node "Firebase Services" as Firebase {
        database "Firestore Database" as Firestore
        artifact "Firebase Authentication" as FirebaseAuth
        artifact "Cloud Functions" as CloudFunc
    }
}

node "Cloudinary Platform" {
    database "Image/Video Storage" as Cloudinary
}


Browser -up-> CDN : HTTPS
CDN -> Serverless : serves
NextApp --> FirebaseAuth : auth API
NextApp --> Firestore : data API
NextApp --> Cloudinary : storage API
NextApp --> CloudFunc : (optional)

@enduml
```

</details>

<details>
<summary>8. Package Diagram</summary>

### Judul: Package Diagram
Diagram ini mengelompokkan kelas atau file ke dalam package dan menunjukkan dependensi antar package tersebut.

**Nama File:** `package_diagram_form_service.svg`

**Caption:**
Diagram Package ini menunjukkan organisasi kode sumber proyek "Form Service" berdasarkan struktur direktori. Ini menggambarkan bagaimana `pages` (dalam `app`), `components`, `hooks`, dan `lib` saling bergantung untuk membentuk aplikasi yang kohesif.

**Asumsi Teknis:**
-   Struktur package mencerminkan struktur folder dalam proyek Next.js.
-   `app` berisi halaman-halaman dan routing.
-   `components` berisi komponen UI yang sifatnya presentasional.
-   `hooks` berisi logika stateful yang dapat digunakan kembali.
-   `lib` berisi logika bisnis inti, konfigurasi, dan utilitas.

```plantuml
@startuml
title Package Diagram - Struktur Kode Proyek

package "src" {
    package "app" {
      folder "Pages/Routes"
    }
    package "components" {
      folder "UI Primitives"
    }
    package "hooks" {
      folder "useAuth"
    }
    package "lib" {
      folder "firebase"
      folder "cloudinary"
      folder "roles"
    }
}

' Dependencies
app ..> components : uses
app ..> hooks : uses
components ..> hooks : uses
hooks ..> lib : uses
app ..> lib : uses

@enduml
```

</details>

<details>
<summary>9. Entity Relationship Diagram (ERD)</summary>

### Judul: Entity Relationship Diagram (ERD)
Diagram ini menggambarkan model data logis dan hubungan antar entitas dalam database (Firestore).

**Nama File:** `erd_form_service.svg`

**Caption:**
Entity Relationship Diagram (ERD) ini mendefinisikan skema database untuk aplikasi "Form Service" yang diimplementasikan di Firestore. Diagram ini menunjukkan entitas utama seperti `users` dan `service_requests`, atribut-atributnya dengan tipe data, serta hubungan kunci primer (PK) dan kunci asing (FK) yang membentuk relasi antar data.

**Asumsi Teknis:**
-   Model ini adalah representasi logis; implementasi di NoSQL (Firestore) akan menggunakan koleksi dan sub-koleksi.
-   `PK` menandakan ID unik dokumen.
-   `FK` menandakan ID dokumen dari koleksi lain yang disimpan sebagai referensi.
-   Tipe data disederhanakan (misalnya `string`, `datetime`).

```plantuml
@startuml
title Entity Relationship Diagram (ERD) - Skema Firestore

!define ENTITY class
!define ATTRIBUTE newpage

ENTITY users {
  {PK} id : string
  --
  email : string
  name : string
  role : string
  avatar_url : string
  {FK} cabang_id : string
}

ENTITY cabangs {
  {PK} id : string
  --
  name : string
  address : string
}

ENTITY service_requests {
  {PK} id : string
  --
  tracking_number : string
  customer_name : string
  status : string
  created_at : datetime
  {FK} assigned_to_uid : string
}

ENTITY comments {
  {PK} id : string
  --
  text : string
  created_at : datetime
  {FK} user_id : string
  {FK} request_id : string
}

' Relationships
users ||--o{ service_requests : "handles" 
users ||--o{ comments : "writes" 
users }o--|| cabangs : "works at" 
service_requests ||--|{ comments : "contains" 

@enduml
```

</details>

<details>
<summary>10. Data Flow Diagram (DFD)</summary>

#### Level 0: Context Diagram

**Nama File:** `dfd_level_0_context.svg`

**Caption:**
Data Flow Diagram (DFD) Level 0 atau Diagram Konteks ini memberikan pandangan tingkat tinggi tentang sistem "Form Service". Ini menunjukkan sistem sebagai satu proses tunggal dan menyoroti aliran data utama antara sistem dengan entitas eksternal (pengguna).

**Asumsi Teknis:**
-   Semua interaksi dengan layanan pihak ketiga (Firebase, Cloudinary) diabstraksikan di dalam proses utama.
-   Aliran data yang ditampilkan adalah yang paling krusial.

```plantuml
@startuml
title DFD Level 0 - Diagram Konteks

actor Customer
actor Staff
actor Manager
actor Admin
rectangle "Sistem Form Service" as System

Customer --> System : Data Laporan Baru
System --> Customer : Status Laporan

Staff --> System : Data Update Laporan
System --> Staff : Daftar Tugas

Manager --> System : Perintah Persetujuan
System --> Manager : Data Laporan Kinerja

Admin --> System : Perintah Konfigurasi
System --> Admin : Log Sistem

@enduml
```

#### Level 1: Detailed DFD

**Nama File:** `dfd_level_1_detail.svg`

**Caption:**
Data Flow Diagram (DFD) Level 1 ini memecah "Sistem Form Service" dari diagram konteks menjadi beberapa sub-proses utama. Ini memberikan gambaran yang lebih rinci tentang bagaimana data mengalir di antara sub-proses, penyimpanan data (data store), dan entitas eksternal.

**Asumsi Teknis:**
-   Sistem dipecah menjadi empat proses utama yang logis.
-   Data Stores (`D1`, `D2`, `D3`) merepresentasikan koleksi utama di Firestore.
-   Aliran data menunjukkan interaksi logis, bukan pemanggilan fungsi teknis.

```plantuml
@startuml
title DFD Level 1

actor Customer
actor Staff
actor Manager
actor Admin

rectangle {
    circle "1.0\nManajemen\nPengguna" as P1
    circle "2.0\nManajemen\nLaporan Servis" as P2
    circle "3.0\nPelaporan &\nAnalitik" as P3
    circle "4.0\nPortal\nPelanggan" as P4
    
    database "D1: Users" as DS_Users
    database "D2: Service Requests" as DS_Requests
    database "D3: Logs" as DS_Logs
}


' Flows
Customer -> P4 : Nomor Lacak
P4 -> DS_Requests : Query Status
DS_Requests -> P4 : Info Status
P4 -> Customer : Tampilan Status

Customer -> P4 : Data Laporan Baru
P4 -> P2 : Laporan Baru
P2 -> DS_Requests : Simpan Laporan

Staff -> P2 : Update Data Servis
P2 -> DS_Requests : Simpan Update
P2 -> DS_Logs : Catat Aktivitas

Manager -> P1 : Perintah Persetujuan
P1 -> DS_Users : Update Status User

Admin -> P1 : Data User Baru/Update
P1 -> DS_Users : Simpan User

Manager -> P3 : Permintaan Laporan KPI
P3 -> DS_Requests : Baca Data Servis
DS_Requests -> P3 : Data Mentah
P3 -> Manager : Laporan KPI

' Data Store Interactions
P1 <--> DS_Users
P2 <--> DS_Requests
P2 <--> DS_Logs
P3 <--> DS_Requests

@enduml
```
</details>