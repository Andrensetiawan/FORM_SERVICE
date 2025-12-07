# 🛠️ Service Form Management System

Sistem manajemen service untuk menangani permintaan service perangkat elektronik dari 2 cabang dengan 5 user roles yang berbeda.

## 🎯 Fitur Utama

- ✅ **Multi-Role Access Control** - 5 user roles dengan permission berbeda (User, Staff, Manager, Owner, Admin)
- ✅ **Service Request Management** - Form lengkap untuk input service request
- ✅ **Photo Upload via Cloudinary** - Upload foto dengan organized folder structure
- ✅ **Real-time Tracking** - Customer bisa track service request dengan tracking number
- ✅ **Dashboard & Analytics** - Dashboard untuk setiap role
- ✅ **Staff Management & Approval** - Manager & Admin dapat manage staff
- ✅ **Business Analytics** - Owner dapat melihat KPI & perkembangan perusahaan
- ✅ **Audit Logging** - Admin dapat monitoring semua activity

## 🏗️ Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript
- **Styling:** Tailwind CSS v4, Framer Motion
- **Backend:** Firebase (Auth, Firestore, Storage)
- **Image Upload:** Cloudinary
- **UI Components:** Lucide React, React Hot Toast

## 📋 Project Structure

```
src/
├── app/
│   ├── api/upload/              # Cloudinary upload API route
│   ├── components/              # Reusable components
│   │   ├── PhotoUpload.tsx      # Photo upload component
│   │   ├── navbars/             # Navigation bars per role
│   │   ├── forms/               # Form components
│   ├── forms/                   # Service request form page
│   ├── formservice/             # Public form service page
│   ├── management/              # Manager dashboard
│   ├── staff/                   # Staff dashboard
│   ├── owner/                   # Owner dashboard (future)
│   ├── admin/                   # Admin dashboard (future)
│   ├── unauthorized/            # 403 error page
│   └── page.tsx                 # Login page
├── hooks/
│   └── useAuth.ts              # Authentication hook
├── lib/
│   ├── firebaseConfig.ts       # Firebase configuration
│   ├── logActivity.ts          # Activity logging
│   └── trackNumber.ts          # Tracking number generator
```

## 👥 User Roles

| Role | Access | Main Features |
|------|--------|---------------|
| **User** | Public (no login) | Track service, submit form |
| **Staff** | Login required | Input service, upload photos, update status |
| **Manager** | Login required | Monitor service, approve staff, view reports |
| **Owner** | Login required | View business analytics, KPI monitoring |
| **Admin** | Login required | Full system control, user management |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Firebase account
- Cloudinary account

### Installation

1. **Clone repository**
```bash
git clone https://github.com/Andrensetiawan/FORM_SERVICE.git
cd service_form
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
Create `.env.local` file:
```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

4. **Run development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📚 Documentation

- **[USECASE.md](./USECASE.md)** - Complete use cases & workflows
- **[ROLES_SUMMARY.md](./ROLES_SUMMARY.md)** - Quick reference for user roles & permissions

## 📊 Database Collections

- `users` - User authentication & roles
- `service_requests` - Service request data
- `tracking_numbers` - Tracking number counter per cabang
- `cabang` - Branch/cabang data
- `activity_logs` - Audit logs (future)

## 🔐 Authentication & Security

- Firebase Authentication (Email/Password)
- Email verification required
- Role-based access control (RBAC)
- Admin approval for staff accounts
- Activity logging for audit trail

## 🌐 Deployment

### Firebase Hosting
```bash
npm run build
firebase deploy
```

### Vercel
```bash
# Push to main branch and Vercel will auto-deploy
git push origin main
```

## 📝 Development Notes

### Adding New Features

1. Create components in `src/app/components/`
2. Use `useAuth()` hook for authentication context
3. Protect routes with `ProtectedRoute` component
4. Follow Firestore naming conventions for collections

### Extending User Roles

1. Update `role` field in `users` collection
2. Create new navbar component in `src/app/components/navbars/`
3. Create dashboard page in `src/app/[role]-dashboard/`
4. Update `ProtectedRoute` component for role validation

## 🐛 Troubleshooting

### Firebase Connection Error
- Verify `.env.local` has correct Firebase credentials
- Check Firebase project is active

### Email Verification Not Working
- Check spam folder
- Verify Firebase Email Authentication is enabled
- Check email sender address in Firebase Console

### Cloudinary Upload Failed
- Verify Cloudinary API credentials in `.env.local`
- Check file size (max 5MB)
- Ensure file is valid image format

## 📞 Support

For issues or questions, contact the development team.

## 📄 License

This project is proprietary software.

---

**Last Updated:** November 2025  
**Version:** 1.0.0
