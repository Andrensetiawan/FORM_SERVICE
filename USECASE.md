# 📋 USE CASE - Service Form Management System

## 🎯 **Overview Aplikasi**
Aplikasi ini adalah sistem manajemen service untuk menangani permintaan service perangkat elektronik dari customer melalui 2 cabang (Alifcyber Solution & Hibatillah). Sistem melibatkan 5 user roles: User (Publik), Staff, Manager, Owner, dan Admin dengan akses & permission yang berbeda-beda.

---

## 👥 **ACTORS (Pengguna)**

### 1. **User (Pelanggan Publik)** 👤
- Tidak perlu login
- Melihat status progress service dengan memasukkan tracking number
- Bisa baca komentar/update dari teknisi
- Lihat foto progress service
- Tidak bisa edit atau input data

### 2. **Staff (Teknisi/Admin Cabang)** 👨‍💼
- Login dengan role "staff"
- Input form service request dari customer
- Upload foto perangkat (awal, proses, akhir)
- Update status service request
- Lihat detail work order (WO)
- Beri komentar & update progress untuk customer
- Melihat daftar service request di cabangnya

### 3. **Manager (Pimpinan Cabang)** 👔
- Login dengan role "manager"
- Monitor & supervise semua service di cabang
- Approve/reject staff baru
- Melihat laporan service dari cabang
- Monitor kinerja teknisi
- Filter data berdasarkan cabang & teknisi
- Generate laporan cabang

### 4. **Owner (Pimpinan Perusahaan)** 👑
- Login dengan role "owner"
- Melihat hasil servisan dari semua cabang
- Monitor perkembangan & performa perusahaan secara keseluruhan
- Lihat dashboard analytics & KPI
- Analisis revenue & customer satisfaction
- Laporan management high-level
- Tidak ada akses full control system

### 5. **Admin (Sistem Administrator)** 🛡️
- Login dengan role "admin"
- Full access control ke seluruh sistem
- Manage user (create, edit, delete, reset password)
- Manage cabang & lokasi
- Manage kategori perangkat & teknisi
- Database management & backup
- System configuration & settings
- Audit logs & security monitoring
- Approve/reject semua staff dari semua cabang
- Delete atau archive data
- System maintenance

---

## 🔐 **USE CASE 1: AUTHENTICATION & AUTHORIZATION**

### **UC1.1: User Public - Tracking Service Request (Tanpa Login)**
**Actor:** User (Pelanggan Publik)  
**Precondition:** User membuka website  
**Main Flow:**
1. User membuka halaman `/track` atau public tracking page
2. User input tracking number (contoh: AS-001)
3. Sistem fetch dokumen dari `service_requests` berdasarkan `track_number`
4. Display progress service:
   - Status saat ini (pending/in_progress/done)
   - Foto awal, proses, akhir
   - Komentar & update dari staff
   - Estimasi waktu selesai (jika ada)
5. User bisa baca komentar dari teknisi
6. User tidak bisa edit atau input data

**Alternative Flow:**
- Tracking number tidak ditemukan → Show "Service request tidak ditemukan"
- User buka halaman `/formservice` → redirect ke form input (tidak perlu login)

---

### **UC1.2: Staff/Manager/Owner/Admin Login**
**Actor:** Staff, Manager, Owner, Admin  
**Precondition:** User belum login  
**Main Flow:**
1. User membuka halaman `/` (login page)
2. User input email & password
3. Sistem validate dengan Firebase Authentication
4. Jika email belum terverifikasi:
   - Toast error: "Email belum diverifikasi"
   - Halaman `/` tampilkan tombol "Cek Status Verifikasi Email" & "Kirim Ulang Email Verifikasi"
5. Jika email terverifikasi:
   - Cek koleksi `users` di Firestore dengan `uid = auth.uid`
   - Ambil data `role` dari dokumen
   - Cek field `approved`:
     - Jika `role === "staff"` dan `approved === false`: 
       - Toast error: "Akun belum disetujui oleh Manager atau Admin"
       - Stay di halaman login
     - Jika `role === "staff"` dan `approved === true`:
       - Redirect ke `/staff`
     - Jika `role === "manager"`:
       - Redirect ke `/management`
     - Jika `role === "owner"`:
       - Redirect ke `/owner-dashboard`
     - Jika `role === "admin"`:
       - Redirect ke `/admin-dashboard`

**Alternative Flow:**
- User belum punya akun → klik "Daftar" → masuk mode register (default register sebagai staff)
- User lupa password → klik "Lupa Password" → masuk mode forgot password

---

### **UC1.3: Register Akun Baru**
**Actor:** Calon Staff  
**Precondition:** User di halaman login, mode register  
**Main Flow:**
1. User input email, password, confirm password
2. Sistem validate:
   - Email format valid
   - Password minimal 6 karakter
   - Password == Confirm Password
3. Firebase create user dengan `createUserWithEmailAndPassword`
4. Simpan dokumen di Firestore collection `users`:
   ```
   {
     uid: "auth.uid",
     email: "user@email.com",
     role: "staff",
     approved: false,
     createdAt: serverTimestamp()
   }
   ```
5. Firebase send verification email ke user
6. Toast: "Pendaftaran berhasil! Silakan verifikasi email Anda"
7. Email verification button active, user bisa:
   - Klik "Cek Status Verifikasi Email" → reload & check
   - Klik "Kirim Ulang Email Verifikasi" → resend (max 1x per 30s)

**Alternative Flow:**
- Email sudah terdaftar → Toast error "Email sudah terdaftar"
- Network error → Toast error "Gagal mendaftar"

---

### **UC1.4: Forgot Password**
**Actor:** User yang lupa password  
**Precondition:** User di halaman login, mode "Lupa Password"  
**Main Flow:**
1. User input email
2. Firebase send password reset email
3. Toast: "Email reset password telah dikirim"
4. User klik link di email → Firebase reset password page
5. User set password baru

---

### **UC1.5: Logout**
**Actor:** Staff, Manager, Owner, Admin  
**Precondition:** User sudah login  
**Main Flow:**
1. User klik tombol logout di navbar (available di semua dashboard)
2. Firebase `signOut(auth)`
3. State di `useAuth` jadi null
4. `ProtectedRoute` detect user === null
5. Redirect ke `/` (login page)

---

## 📝 **USE CASE 2: SERVICE REQUEST FORM (Customer)**

### **UC2.1: Isi Form Service Request**
**Actor:** Customer  
**Precondition:** Customer di halaman `/formservice`  
**Main Flow:**
1. Customer isi form dengan data:
   - **Data Customer:** nama, alamat, no_hp, email
   - **Data Perangkat:** merk, tipe, serial_number, keluhan, spesifikasi_teknis
   - **Jenis Perangkat:** checkbox (Laptop/PC/UPS/Console)
   - **Accessories:** checkbox (Baterai/Adaptor/Tas/Casing/Mouse/Receiver)
   - **Garansi:** radio (Ya/Tidak) + keterangan
   - **Kondisi Saat Masuk:** checkbox (Mati Total/Layar Gelap/Bekas Jatuh/dll)
   - **Cabang:** dropdown (Alifcyber Solution / Hibatillah)
   - **Prioritas Service:** dropdown (1. Reguler / 2. Prioritas / 3. Onsite)
   - **Penerima Service:** text (nama teknisi yang terima)

2. Sistem validate:
   - Semua field required terisi
   - Minimal 1 checkbox untuk setiap section terpilih
   - Cabang wajib dipilih

3. Customer klik "Simpan"
4. Sistem generate tracking number:
   - Format: `{CABANG_CODE}{COUNTER}`
   - Contoh: `AS-001`, `HB-002`
   - Counter increment per cabang di Firestore document `tracking_numbers/{cabang}`

5. Sistem save ke Firestore collection `service_requests`:
   ```
   {
     id: auto-generated docId,
     nama: "Customer Name",
     alamat: "...",
     email: "...",
     track_number: "AS-001",
     status: "pending",
     timestamp: serverTimestamp(),
     ... (semua field form)
   }
   ```

6. Toast success: "✅ Data berhasil disimpan! Nomor Service: AS-001"
7. Form reset ke initial state
8. Customer bisa print form atau screenshot

**Alternative Flow:**
- Validasi gagal → Show error messages di atas form
- Database error → Toast: "Gagal menyimpan data ke Firestore"

---

## 📊 **USE CASE 3: STAFF DASHBOARD**

### **UC3.1: Staff Login & View Dashboard**
**Actor:** Staff  
**Precondition:** Staff sudah login, role == "staff", approved == true  
**Main Flow:**
1. Sistem redirect ke `/staff`
2. Staff Dashboard load dengan:
   - Navbar: Logo, nama cabang, nama user, logout button
   - Title: "Daftar Service Request"
   - Filter section: (opsional, hanya untuk manager/owner)
   - Table dengan kolom:
     | Tanggal Masuk | Tracking | Status | Customer | No HP | Tipe | Teknisi |
     
3. Fetch data dari Firestore `service_requests` dengan `getDocs()`
4. Display list (default 10 entries)
5. Staff bisa klik tracking number → lihat detail di `/staff/tns/{docId}`

---

### **UC3.2: View Service Request Detail**
**Actor:** Staff  
**Precondition:** Staff klik tracking number di tabel  
**Main Flow:**
1. Sistem fetch dokumen dengan `doc(db, "service_requests", docId)`
2. Display detail lengkap:
   - Data customer
   - Data perangkat
   - Jenis perangkat yang dipilih
   - Accessories yang dibawa
   - Kondisi saat masuk
   - Status service
   - Tracking number

3. Staff bisa:
   - Upload foto perangkat saat masuk → `PhotoUpload` component
   - Update status (pending → in_progress → done)
   - Lihat history update
   - Print work order

---

### **UC3.3: Upload Foto Perangkat**
**Actor:** Staff  
**Precondition:** Staff di halaman detail service request  
**Main Flow:**
1. Staff klik button "Upload Foto"
2. `PhotoUpload` component show:
   - Drag & drop area
   - File input untuk select gambar
   - Preview saat file dipilih
3. Staff select gambar (max 5MB, hanya format image)
4. Preview tampil, staff confirm
5. Klik "Upload ke Cloudinary"
6. API `/api/upload` process:
   - Convert file ke base64
   - Upload ke Cloudinary dengan folder structure: `service_form/{folderName}/{docId}/{timestamp}_filename`
   - Return `secure_url` & `public_id`
7. Component callback: `onUploadComplete(url, publicId)`
8. Staff side update dokumen service request dengan foto URL:
   ```
   {
     foto_awal: "https://res.cloudinary.com/...",
     foto_awal_publicId: "...",
     updated_at: serverTimestamp()
   }
   ```
9. Toast: "✅ Upload sukses!"
10. Preview upload success tampil dengan info folder & public ID

---

## 🏢 **USE CASE 5: OWNER DASHBOARD**

### **UC5.1: Owner Login & View Performance Dashboard**
**Actor:** Owner  
**Precondition:** Owner sudah login, role == "owner"  
**Main Flow:**
1. Sistem redirect ke `/owner-dashboard`
2. Owner Dashboard load dengan:
   - Navbar: Logo, monitoring summary, user profile, logout button
   - Title: "Dashboard Perkembangan Perusahaan"
   - Key Metrics Cards:
     - Total service requests (all cabang)
     - Completed services (%)
     - Average completion time
     - Customer satisfaction rate
     - Revenue summary
3. Display dashboard dengan:
   - Service analytics per cabang
   - Staff performance ranking
   - Monthly trends chart
   - Service status breakdown (pie chart)
4. Owner bisa:
   - View laporan dari semua cabang
   - Export report untuk analysis
   - Monitor business growth
   - See KPI & metrics

---

### **UC5.2: Owner View Business Analytics**
**Actor:** Owner  
**Precondition:** Owner di `/owner-dashboard`  
**Main Flow:**
1. Dashboard menampilkan:
   - **Cabang Performance:**
     - Alifcyber Solution: 150 requests, 140 completed, 93% success rate
     - Hibatillah: 120 requests, 100 completed, 83% success rate
   - **Monthly Trends:** Chart service request per bulan
   - **Revenue:** Summary total revenue dari semua service
   - **Customer Satisfaction:** Rating & feedback dari customer
   - **Staff Performance:** Top performers ranking

2. Owner bisa:
   - Lihat detail cabang dengan klik card
   - Download laporan PDF/Excel
   - Set performance targets
   - View historical data

---

### **UC5.3: Owner View Service Results**
**Actor:** Owner  
**Precondition:** Owner di dashboard atau view detail WO  
**Main Flow:**
1. Owner buka tab "Service Results" atau specific WO
2. View hasil servisan:
   - Service history dari semua cabang
   - Detail perangkat yang di-service
   - Kondisi sebelum & sesudah service
   - Foto dokumentasi lengkap
   - Staff yang menangani
   - Completion time
   - Cost estimate vs actual

3. Owner insight:
   - Identify trending issues (sering masalah apa)
   - Staff expertise analysis
   - Device type distribution
   - Service success rate

---

### **UC5.4: Owner Manage High-Level Settings**
**Actor:** Owner  
**Precondition:** Owner di owner dashboard  
**Future Flow:**
1. Owner bisa configure:
   - Service priority levels
   - Pricing/costing structure
   - Branch targets & KPI
   - Service categories
   - System-wide settings

---

## 🛡️ **USE CASE 6: ADMIN DASHBOARD**

### **UC6.1: Admin Login & View System Control Panel**
**Actor:** Admin  
**Precondition:** Admin sudah login, role == "admin"  
**Main Flow:**
1. Sistem redirect ke `/admin-dashboard`
2. Admin Dashboard load dengan:
   - Navbar: Logo, admin menu, system stats, admin profile, logout
   - Title: "System Administration & Control Panel"
   - Menu Options:
     - User Management
     - Cabang Management
     - Database Management
     - System Logs & Audit
     - Backup & Recovery
     - Settings & Configuration

---

### **UC6.2: Admin Manage Users**
**Actor:** Admin  
**Precondition:** Admin klik "User Management"  
**Main Flow:**
1. Display semua users dalam table:
   - Email, Role, Status (active/inactive), Created Date, Actions
2. Admin bisa:
   - **Create User:** Input email, set role, send activation link
   - **Edit User:** Change role, update data, reset password
   - **Delete User:** Remove user dari sistem (soft delete)
   - **Reset Password:** Send reset link ke user email
   - **Activate/Deactivate:** Enable/disable user access
   - **View Activity:** Lihat login history & actions user

3. Contoh actions:
   - Admin create new manager user
   - Admin reset password staff yang lupa
   - Admin deactivate inactive user
   - Admin bulk approve 5 pending staff

---

### **UC6.3: Admin Manage Cabang**
**Actor:** Admin  
**Precondition:** Admin klik "Cabang Management"  
**Main Flow:**
1. Display semua cabang dalam table
2. Admin bisa:
   - **Create Cabang:** Input nama, lokasi, manager assignment
   - **Edit Cabang:** Update info, change manager
   - **View Cabang Stats:** Staff count, service count, revenue
   - **Assign Manager:** Set manager untuk cabang
   - **Archive Cabang:** Inactive old branch

---

### **UC6.4: Admin Database Management**
**Actor:** Admin  
**Precondition:** Admin klik "Database Management"  
**Main Flow:**
1. Admin dapat access:
   - **Backup:** Create database backup secara manual
   - **Restore:** Restore dari backup file
   - **Data Export:** Export all data ke CSV/Excel
   - **Data Cleanup:** Delete old archived data
   - **Data Sync:** Manual sync Firestore

2. Admin bisa:
   - Schedule daily backup (setting)
   - View backup history
   - Download backup files
   - Monitor database size

---

### **UC6.5: Admin View System Logs & Audit**
**Actor:** Admin  
**Precondition:** Admin klik "System Logs"  
**Main Flow:**
1. Display activity logs:
   - User login/logout
   - Data create/update/delete
   - File upload
   - Permission changes
   - System errors

2. Filter logs by:
   - User, Action type, Date range, Resource type
3. Admin bisa:
   - Search specific log
   - Download log report
   - Set log retention policy

---

### **UC6.6: Admin System Settings**
**Actor:** Admin  
**Precondition:** Admin klik "Settings"  
**Main Flow:**
1. Admin configure:
   - **Email Settings:** Email server, template, notification rules
   - **Storage Settings:** Cloudinary API config, quota limits
   - **System Config:** Service categories, priority levels, statuses
   - **Security:** Password policy, 2FA, session timeout
   - **Cabang List:** Available cabang options
   - **User Roles:** Define role permissions
   - **API Keys:** Manage external API configurations

2. Admin bisa:
   - Save configuration changes
   - Reset to default settings
   - Test email settings
   - Validate API connections

---

## 🔒 **USE CASE 7: PROTECTED ROUTE & ACCESS CONTROL**

### **UC7.1: Access Control untuk Non-Login User**
**Actor:** Semua user  
**Precondition:** User tidak login atau tidak authorized  
**Main Flow:**
1. User try akses protected page (contoh: `/staff`, `/management`, `/owner-dashboard`, `/admin-dashboard`)
2. `ProtectedRoute` component check:
   ```
   if (!user) → redirect ke `/`
   if (!allowedRoles.includes(role)) → redirect ke `/unauthorized`
   ```
3. User directed ke appropriate page atau error page `/unauthorized`

---

### **UC7.2: Role-Based Navigation**
**Actor:** Staff, Manager, Owner, Admin  
**Precondition:** User sudah login  
**Main Flow:**
1. Navbar di-render berdasarkan role:
   - **Staff**: NavbarStaff (Home, Service List, Profile, Logout)
   - **Manager**: NavbarManagement (Dashboard, Staff, Pending Users, Laporan, Logout)
   - **Owner**: NavbarOwner (Dashboard, Analytics, Reports, Logout)
   - **Admin**: NavbarAdmin (Dashboard, Users, Cabang, Database, Logs, Settings, Logout)
2. User navigate sesuai role mereka
3. Unauthorized access → redirect `/unauthorized`

---

## 📊 **USE CASE 4: MANAGER DASHBOARD** (Existing - No Change)

### **UC4.1: Manager Login & View Management Dashboard**
**Actor:** Manager  
**Precondition:** Manager sudah login, role == "manager"  
**Main Flow:**
1. Sistem redirect ke `/management`
2. Management Dashboard load dengan:
   - Navbar: Logo, button staff list, laporan, pending users, logout
   - Title: "Dashboard Management"
   - Filter section: 
     - Dropdown Cabang (auto-generate dari unique `item.cabang`)
     - Dropdown Teknisi (auto-generate dari unique `item.teknisi`)
     - Input Show Entries (default 10)
     - Button Download CSV (placeholder)
   
3. Fetch semua data dari `service_requests`
4. Display dalam table dengan smart filtering

---

### **UC4.2: Filter Data by Cabang & Teknisi**
**Actor:** Manager  
**Precondition:** Manager di management dashboard  
**Main Flow:**
1. Manager select filter:
   - Cabang: "Alifcyber Solution"
   - Teknisi: "Budi"
2. Sistem filter data:
   ```
   filtered = data.filter(item => 
     item.cabang === "Alifcyber Solution" && 
     item.teknisi === "Budi"
   )
   ```
3. Table re-render dengan hasil filter
4. Manager adjust filter → real-time update

---

### **UC4.3: View Laporan (Pending Users)**
**Actor:** Manager  
**Precondition:** Manager klik "Pending Users" di sidebar  
**Main Flow:**
1. Sistem fetch dari Firestore `users` dengan `where("approved", "==", false)`
2. Display daftar staff yang menunggu approval:
   - Email
   - Status
   - Action: Approve/Reject button
3. Manager klik "Approve":
   - Update dokumen `users/{uid}` → set `approved = true`
   - Toast: "Staff berhasil diapprove"
   - User hilang dari daftar pending
   - Staff sekarang bisa login

---

### **UC4.4: View Staff List**
**Actor:** Manager  
**Precondition:** Manager klik "Staff" di sidebar  
**Main Flow:**
1. Fetch semua user dengan `role == "staff"` dari `users` collection
2. Display dalam table:
   - Email
   - Status (Approved/Pending)
   - Action buttons (View Detail/Deactivate)
3. Manager bisa klik detail untuk lihat profile staff

---

### **UC4.5: View Laporan Detail WO (Work Order)**
**Actor:** Manager  
**Precondition:** Manager klik tracking number WO  
**Main Flow:**
1. Redirect ke `/management/tns/{docId}`
2. Fetch dokumen service request
3. Display:
   - Data customer lengkap
   - Status timeline (pending → in_progress → done)
   - Foto-foto perangkat
   - History update dengan timestamp
   - Staff yang handle
   - Detail teknis service
4. Manager bisa:
   - Add internal notes
   - Update status
   - Assign ke teknisi berbeda
   - Print report

---

## 👑 **USE CASE 5: OWNER DASHBOARD**

### **UC5.1: Owner Login & View All Data**
**Actor:** Owner  
**Precondition:** Owner sudah login, role == "owner"  
**Main Flow:**
1. Sistem redirect ke `/management`
2. Owner Dashboard = Management Dashboard + extra features:
   - View semua data dari SEMUA cabang
   - Download CSV semua data
   - View laporan analytics (TBD)
3. Owner have FULL ACCESS ke:
   - Approve/Reject semua staff
   - View semua WO dari semua cabang
   - Delete/Archive data
   - Manage cabang & teknisi

---

### **UC5.2: Owner Approve New Staff**
**Actor:** Owner  
**Precondition:** Owner klik "Pending Users"  
**Main Flow:**
1. Sama seperti Manager (UC4.3)
2. Update dokumen user → `approved = true`
3. Staff bisa login sekarang

---

### **UC5.3: Owner View Analytics**
**Actor:** Owner  
**Precondition:** Owner di `/management` atau dedicated analytics page  
**Future Features:**
- Total service requests per cabang
- Avg service duration
- Staff performance ranking
- Customer satisfaction metrics
- Monthly trends chart

---

## 🔒 **USE CASE 6: PROTECTED ROUTE & ACCESS CONTROL**

### **UC6.1: Access Control untuk Non-Login User**
**Actor:** Semua user  
**Precondition:** User tidak login atau tidak authorized  
**Main Flow:**
1. User try akses protected page (contoh: `/staff`)
2. `ProtectedRoute` component check:
   ```
   if (!user) → redirect ke `/`
   if (!allowedRoles.includes(role)) → redirect ke `/unauthorized`
   ```
3. User directed ke appropriate page atau error page

---

### **UC6.2: Role-Based Navigation**
**Actor:** Staff, Manager, Owner  
**Precondition:** User sudah login  
**Main Flow:**
1. Navbar di-render berdasarkan role:
   - **Staff**: NavbarStaff (Home, Service List, Profile, Logout)
   - **Manager**: NavbarManagement (Dashboard, Staff, Pending Users, Laporan, Logout)
   - **Owner**: NavbarManagement (same sebagai Manager)
2. User navigate sesuai role mereka
3. Unauthorized access → redirect `/unauthorized`

---

## 📸 **USE CASE 7: PHOTO MANAGEMENT (CLOUDINARY)**

### **UC7.1: Upload Multiple Photos untuk Single WO**
**Actor:** Staff  
**Precondition:** Staff di halaman detail WO  
**Main Flow:**
1. WO page punya multiple PhotoUpload component:
   - `<PhotoUpload folderName="foto_awal" docId="{woId}" label="📸 Upload Foto Awal" />`
   - `<PhotoUpload folderName="foto_proses" docId="{woId}" label="📸 Upload Foto Proses" />`
   - `<PhotoUpload folderName="foto_akhir" docId="{woId}" label="📸 Upload Foto Akhir" />`

2. Staff upload foto untuk setiap tahap
3. Masing-masing foto:
   - Upload ke folder: `service_form/foto_awal/{woId}/{timestamp}_filename`
   - Return URL & public_id
   - Saved ke Firestore: `{foto_awal: url, foto_awal_publicId: publicId}`

4. Timeline foto service bisa dilihat customer & manager

---

### **UC7.2: Manage Photo Gallery**
**Actor:** Manager, Owner  
**Precondition:** View WO detail  
**Future Features:**
- Delete foto (via Cloudinary API)
- Re-upload foto
- Organize foto dalam gallery view
- Download foto as ZIP

---

## 🔄 **USE CASE 8: SERVICE STATUS WORKFLOW**

### **UC8.1: Service Status Progression**
**Actor:** Staff, Manager  
**Precondition:** Service request di dalam sistem  
**Main Flow:**
1. **Status Awal: PENDING**
   - Service request baru, menunggu di-process
   - Display di dashboard

2. **Status: IN_PROGRESS**
   - Staff mulai handle service
   - Update status via dropdown
   - Foto proses bisa di-upload
   - Teknisi name recorded

3. **Status: DONE**
   - Service selesai
   - Foto akhir di-upload
   - Estimate cost, completion notes added
   - Customer could be notified (TBD)

4. **Status: CANCELLED** (optional)
   - Service dibatalkan
   - Add reason

**Database Update:**
```
service_request.status = "done"
service_request.updated_at = serverTimestamp()
service_request.completed_by = staff_uid
```

---

## 📧 **USE CASE 9: NOTIFICATION & TRACKING (TBD)**

### **UC9.1: Customer Tracking via Track Number**
**Future Feature:**
1. Customer bisa input track number di public page
2. Sistem show service status tanpa login
3. Update notification via WhatsApp/Email

---

### **UC9.2: Internal Notification**
**Future Feature:**
- Manager notified saat ada pending user
- Owner notified saat ada urgent service
- Staff notified saat ada assigned WO

---

## 🗂️ **DATABASE STRUCTURE**

### **Collection: `users`**
```json
{
  "uid": "auth_uid",
  "email": "user@email.com",
  "role": "staff|manager|owner|admin",
  "approved": true|false,
  "cabang": "Alifcyber Solution", // untuk staff & manager (optional)
  "createdAt": timestamp,
  "updatedAt": timestamp,
  "lastLogin": timestamp,
  "status": "active|inactive"
}
```

### **Collection: `service_requests`**
```json
{
  "id": "docId",
  "nama": "Customer Name",
  "alamat": "Address",
  "no_hp": "0812345678",
  "email": "customer@email.com",
  "merk": "HP",
  "tipe": "Samsung A50",
  "serial_number": "SN123",
  "keluhan": "Layar tidak menyala",
  "spesifikasi_teknis": "OS: Android 10",
  "jenis_perangkat": ["Laptop"],
  "keterangan_perangkat": "Asus ROG",
  "accessories": ["Adaptor", "Mouse"],
  "garansi": true,
  "kondisi": ["Layar Gelap", "Bekas Jatuh"],
  "cabang": "Alifcyber Solution",
  "prioritas_service": "1. Reguler",
  "penerima_service": "Budi",
  "track_number": "AS-001",
  "status": "pending|in_progress|done|cancelled",
  "foto_awal": "https://res.cloudinary.com/...",
  "foto_proses": "https://res.cloudinary.com/...",
  "foto_akhir": "https://res.cloudinary.com/...",
  "timestamp": timestamp,
  "updated_at": timestamp,
  "completed_by": "staff_uid",
  "comments": [
    {
      "uid": "staff_uid",
      "name": "Teknisi Name",
      "message": "Proses perbaikan dimulai...",
      "timestamp": timestamp
    }
  ]
}
```

### **Collection: `tracking_numbers`**
```json
{
  "cabang": "Alifcyber Solution",
  "counter": 1,
  "lastUsed": timestamp
}
```

### **Collection: `cabang`** (untuk admin management)
```json
{
  "id": "cabang_id",
  "nama": "Alifcyber Solution",
  "lokasi": "Jakarta",
  "manager_uid": "manager_uid",
  "staff_count": 5,
  "service_count": 150,
  "createdAt": timestamp,
  "status": "active|inactive"
}
```

### **Collection: `activity_logs`** (untuk admin audit)
```json
{
  "id": "log_id",
  "user_uid": "user_uid",
  "action": "create|update|delete|login",
  "resource_type": "service_request|user|cabang",
  "resource_id": "doc_id",
  "details": "...",
  "timestamp": timestamp,
  "ip_address": "..."
}
```

---

## 📊 **PERMISSION MATRIX - USER ROLES**

| Feature | User | Staff | Manager | Owner | Admin |
|---------|------|-------|---------|-------|-------|
| **Public Tracking** (tanpa login) | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Form Service Input** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **View Own Service Requests** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Upload Photo Cloudinary** | ❌ | ✅ | ✅ | ❌ | ❌ |
| **Comment & Update Progress** | ❌ | ✅ | ✅ | ❌ | ❌ |
| **View Cabang Data** | ❌ | ✅ (Own) | ✅ (Own) | ✅ (All) | ✅ (All) |
| **Monitor All Service** | ❌ | ❌ | ✅ (Own Cabang) | ✅ (All Cabang) | ✅ (All) |
| **Approve Pending Staff** | ❌ | ❌ | ✅ (Own Cabang) | ❌ | ✅ (All) |
| **Manage Staff** | ❌ | ❌ | ✅ (View) | ❌ | ✅ (Create/Edit/Delete) |
| **View Analytics & KPI** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Business Report** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **System Admin Panel** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Manage Users** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Manage Cabang** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Database Backup/Restore** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **System Logs & Audit** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **System Settings** | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 🔐 **DEFAULT ROUTES BY ROLE**

| Role | Login Redirect | Dashboard URL |
|------|---|---|
| User (Publik) | N/A (Tanpa login) | `/track` (public tracking) |
| Staff | ✅ Login required | `/staff` |
| Manager | ✅ Login required | `/management` |
| Owner | ✅ Login required | `/owner-dashboard` |
| Admin | ✅ Login required | `/admin-dashboard` |

---

### **Scenario 1: Happy Path - Customer Service Request**
1. Customer datang ke cabang
2. Staff memberikan form / customer isi sendiri di kiosk
3. Customer input semua data & upload foto perangkat
4. System auto-generate tracking number: `AS-001`
5. Staff print & give track number ke customer
6. Customer pergi, staff update status → IN_PROGRESS
7. Teknisi kerjakan repair
8. Staff upload foto progress
9. Service selesai, staff update status → DONE
10. Staff upload foto final
11. Manager lihat laporan, approve completion
12. Archive atau delete WO

---

### **Scenario 2: Manager Monitoring**
1. Manager login
2. Check pending users → approve new staff
3. Go to management dashboard
4. Filter by cabang: "Alifcyber Solution"
5. See 25 service requests
6. Sort by status → find 3 urgent service
7. Klik salah satu WO
8. Check foto & notes
9. Re-assign ke staff berbeda
10. Add internal note
11. Download laporan monthly

---

### **Scenario 3: Owner Executive Report**
1. Owner login
2. View management dashboard (all cabang)
3. See total 125 service requests
4. 95 done, 20 in_progress, 10 pending
5. Check analytics:
   - Alifcyber: 70 requests (65 done)
   - Hibatillah: 55 requests (30 done)
6. Approve pending staff from both branches
7. Export CSV untuk reporting
8. Make decision based on performance

---

## 📝 **KEBUTUHAN FITUR TAMBAHAN (FUTURE)**

- [ ] Email notification ke customer
- [ ] WhatsApp integration untuk tracking
- [ ] Analytics dashboard dengan charts
- [ ] Estimated completion time
- [ ] Cost estimation & invoice
- [ ] Customer feedback/rating system
- [ ] SMS reminder
- [ ] Offline mode
- [ ] Mobile app

---

## ✅ **KESIMPULAN**

Aplikasi ini adalah sistem management service yang comprehensive dengan:
- ✅ **5 User Roles dengan Permission berbeda:**
  - User: Public tracking tanpa login
  - Staff: Input service & upload foto
  - Manager: Monitor & approve staff cabang
  - Owner: Melihat hasil servisan & perkembangan perusahaan
  - Admin: Full access control sistem
- ✅ Multi-tenant (2 cabang: Alifcyber Solution & Hibatillah)
- ✅ Service request workflow (pending → in_progress → done)
- ✅ Photo management via Cloudinary dengan organized folder structure
- ✅ Access control & security per role
- ✅ Dashboard & reporting untuk setiap role
- ✅ Staff management & approval system by Manager & Admin
- ✅ Business analytics & KPI monitoring untuk Owner
- ✅ System administration & database management untuk Admin
- ✅ Email verification & password reset
- ✅ Tracking number system per cabang
