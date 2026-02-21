# FleetFlow - Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1️⃣ Install Dependencies

Open your terminal in the project folder and run:

```bash
npm install
```

This will install all required packages including React, TypeScript, Tailwind CSS, and shadcn/ui components.

### 2️⃣ Start the Development Server

```bash
npm run dev
```

Your app will be available at: **http://localhost:5173**

### 3️⃣ Explore the Application

- **Landing Page**: `http://localhost:5173/` - Beautiful landing page with registration dialogs
- **Login Page**: `http://localhost:5173/login` - Secure authentication with role selection

## 📱 What You Get

### ✅ Complete Project Setup
- ✓ React 18 with TypeScript
- ✓ Vite for fast development
- ✓ Tailwind CSS for styling
- ✓ Routing with React Router

### ✅ shadcn/ui Components
All components are in `src/components/ui/`:
- ✓ Button (multiple variants & sizes)
- ✓ Input (with focus states)
- ✓ Label (accessible forms)
- ✓ Dialog (modal for sign-up)

### ✅ Pages
- ✓ **Landing Page** with:
  - Hero section
  - Features showcase
  - Multiple CTAs
  - Registration dialogs
  - Footer

- ✓ **Login Page** with:
  - Role selection (Manager/Dispatcher)
  - Email & password fields
  - Forgot password functionality
  - Remember me option
  - Google OAuth UI (ready for integration)

## 🎨 Key Features

### Role-Based Access Control (RBAC)
The login page supports two user roles:
- **Manager**: Full access to all features
- **Dispatcher**: Operations-focused access

### Professional UI/UX
- Responsive design (mobile-first)
- Dark mode support (ready to implement)
- Accessible components
- Smooth animations
- Modern design patterns

## 📂 Important Files

```
src/
├── components/ui/        ← shadcn/ui components here
├── pages/
│   ├── LandingPage.tsx  ← Main landing page
│   └── LoginPage.tsx    ← Authentication page
├── lib/utils.ts         ← Utility functions
└── App.tsx              ← Routes configuration
```

## 🔧 Customization

### Change Colors
Edit `src/index.css` - modify the CSS variables under `:root`

### Add New Pages
1. Create file in `src/pages/`
2. Add route in `src/App.tsx`

### Add New Components
Visit [ui.shadcn.com](https://ui.shadcn.com) and copy components to `src/components/ui/`

## 🆘 Need Help?

Check the full [README.md](./README.md) for:
- Detailed documentation
- Troubleshooting guide
- Next steps
- API integration tips

## 📦 Build for Production

When ready to deploy:

```bash
npm run build
```

Output will be in the `dist/` folder.

---

**You're all set!** Run `npm run dev` to see your FleetFlow application in action. 🎉
