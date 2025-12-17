# 👥 USER ROLES & PERMISSIONS SUMMARY

## 📋 **5 User Roles dalam Sistem**

### **1️⃣ USER (Pelanggan Publik)** 👤
- **Akses:** Tanpa login
- **URL:** `/track`, `/formservice`
- **Fitur:**
  - Tracking service dengan nomor tracking (cth: AS-001)
  - Lihat progress foto (awal, proses, akhir)
  - Baca komentar dari teknisi
  - Isi form service request
- **Database Access:** View-only `service_requests` filter by `track_number`
- **Tidak Bisa:** Edit/delete/manage apapun

---

### **2️⃣ STAFF (Teknisi/Admin Cabang)** 👨‍💼
- **Akses:** Login required, role="staff", approved=true
- **URL:** `/staff`, `/staff/tns/{id}`
- **Fitur:**
  - Input form service request dari customer
  - Upload 3 foto (awal, proses, akhir) ke Cloudinary
  - Update status service (pending → in_progress → done)
  - Beri komentar untuk customer
  - Lihat daftar service requests di cabangnya
  - View detail WO (Work Order)
- **Database Access:**
  - Read: `service_requests` cabang sendiri
  - Write: Update `service_requests`, add comments
  - Upload: Photo ke Cloudinary `service_form/{folderName}/{docId}/`
- **Approval Requirement:** Harus di-approve oleh Manager atau Admin sebelum bisa login

---

### **3️⃣ MANAGER (Pimpinan Cabang)** 👔
- **Akses:** Login required, role="manager"
- **URL:** `/management`, `/management/tns/{id}`, `/management/staff`, `/management/pending-users`, `/management/laporan`
- **Fitur:**
  - Monitor & supervise semua service di cabangnya
  - Lihat daftar service requests (filter by cabang & teknisi)
  - Approve/reject staff baru (untuk cabang sendiri)
  - View staff list & detail
  - Generate laporan service cabang
  - Edit/update service request details
  - View & download laporan
- **Database Access:**
  - Read: `service_requests`, `users` (staff) filter by cabang
  - Write: Approve user `approved=true`, update service requests, view logs
- **Monitoring:** Dapat melihat kinerja teknisi

---

### **4️⃣ OWNER (Pimpinan Perusahaan)** 👑
- **Akses:** Login required, role="owner"
- **URL:** `/owner-dashboard`
- **Fitur:**
  - Melihat hasil servisan dari semua cabang
  - Monitor perkembangan & performa perusahaan
  - Dashboard analytics & KPI:
    - Total service requests
    - Success rate %
    - Revenue summary
    - Staff performance ranking
    - Customer satisfaction rate
  - Monthly trends chart
  - Business insights & reporting
  - View service results & documentation
- **Database Access:**
  - Read-only: Semua `service_requests`, `users` (semua cabang)
  - Analytics: Aggregated data dari semua cabang
- **Tidak Bisa:** Approve staff (hanya view), manage system, edit data

---

### **5️⃣ ADMIN (Sistem Administrator)** 🛡️
- **Akses:** Login required, role="admin"
- **URL:** `/admin-dashboard`, `/admin-dashboard/users`, `/admin-dashboard/cabang`, `/admin-dashboard/database`, `/admin-dashboard/logs`, `/admin-dashboard/settings`
- **Fitur:**
  - **User Management:**
    - Create, edit, delete user
    - Reset password, activate/deactivate
    - View login history & activity
    - Assign role (staff/manager/owner)
    - Approve ALL staff (semua cabang)
  
  - **Cabang Management:**
    - Create/edit/delete cabang
    - View cabang statistics
    - Assign manager ke cabang
    - Archive inactive cabang
  
  - **Database Management:**
    - Create manual backup
    - Restore from backup
    - Export data (CSV/Excel)
    - Cleanup archived data
    - Monitor database size
  
  - **System Logs & Audit:**
    - View semua activity logs
    - Filter by user/action/date
    - Download log reports
    - Set retention policy
  
  - **System Settings:**
    - Email configuration
    - Cloudinary API setup
    - Service categories & priorities
    - Password policy & security
    - Cabang list management
    - Role permissions configuration

- **Database Access:** FULL ACCESS ke semua collections
- **Full Control:** Semua fitur, semua data

---

## 🔄 **APPROVAL WORKFLOW**

```
New Staff Register
    ↓
email_verified = false → Need email verification
    ↓
email_verified = true, approved = false
    ↓
Manager atau Admin approve → approved = true
    ↓
Staff bisa login ke /staff
```

---

## 🗺️ **ROUTE MAPPING**

| Role | Routes | Status |
|------|--------|--------|
| **User** | `/`, `/formservice`, `/track` | No Auth |
| **Staff** | `/staff`, `/staff/tns/:id`, `/staff/profile/:id` | Protected |
| **Manager** | `/management`, `/management/tns/:id`, `/management/staff`, `/management/pending-users`, `/management/laporan`, `/management/laporan/teknisi/:id` | Protected |
| **Owner** | `/owner-dashboard` | Protected |
| **Admin** | `/admin-dashboard`, `/admin-dashboard/users`, `/admin-dashboard/cabang`, `/admin-dashboard/database`, `/admin-dashboard/logs`, `/admin-dashboard/settings` | Protected |

---

## ⚠️ **UNAUTHORIZED ROUTES**

```typescript
// Jika non-authorized user coba akses protected route:
if (!user) → Redirect to /login
if (role not in allowedRoles) → Redirect to /unauthorized
```

**Example:**
- Staff coba akses `/management` → `/unauthorized`
- User coba akses `/staff` → `/unauthorized`
- Guest coba akses `/owner-dashboard` → `/login`

---

## 📱 **NAVBAR CONFIGURATION**

### **NavbarPublic** (User tanpa login)
- Logo/Home
- Tracking Service
- Daftar Service
- About/Contact

### **NavbarStaff** 
- Logo/Dashboard
- Daftar Service
- Profile
- Logout

### **NavbarManagement** (Manager)
- Logo/Dashboard
- Staff Management
- Pending Users
- Laporan
- Settings
- Logout

### **NavbarOwner** (Owner)
- Logo/Dashboard
- Analytics
- Reports
- Settings
- Logout

### **NavbarAdmin** (Admin)
- Logo/Dashboard
- Users
- Cabang
- Database
- Logs
- Settings
- Logout

---

## 🔐 **SECURITY NOTES**

1. **Email Verification Required:**
   - Semua new staff harus verify email sebelum login
   - Email verification link valid 24 jam

2. **Staff Approval Required:**
   - Staff baru harus approve oleh Manager/Admin
   - Pending staff tidak bisa login

3. **Role-Based Access Control (RBAC):**
   - Setiap route check user role
   - Firestore rules check `role` & `approved` fields
   - API endpoints validate permission

4. **Audit Logging:**
   - Admin dapat view semua activity logs
   - Track create/update/delete/login actions

5. **Password Policy:**
   - Min 6 karakter
   - Admin bisa set custom policy

---

## 📊 **QUICK REFERENCE TABLE**

| Need | Role | Feature | URL |
|------|------|---------|-----|
| Track service | User | Tracking | `/track` |
| Input service | Staff | Form | `/formservice` |
| Monitor service | Manager | Dashboard | `/management` |
| Approve staff | Manager | Pending Users | `/management/pending-users` |
| View business | Owner | Analytics | `/owner-dashboard` |
| Manage system | Admin | Control Panel | `/admin-dashboard` |
| Manage users | Admin | Users | `/admin-dashboard/users` |
| Backup data | Admin | Database | `/admin-dashboard/database` |
| View logs | Admin | Audit | `/admin-dashboard/logs` |
