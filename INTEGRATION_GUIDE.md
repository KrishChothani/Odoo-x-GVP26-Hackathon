# FleetFlow Frontend-Backend Integration Guide

## 📋 Overview
This document outlines the integration between the FleetFlow frontend (React/TypeScript) and backend (Node.js/Express).

## ✅ Completed Changes

### Backend Updates

1. **User Model Enhancement** ([user.model.js](backend/src/Models/user.model.js))
   - Added dispatcher-specific fields:
     - `licenceNumber`: String (required for dispatchers)
     - `licenceExpiry`: Date (required for dispatchers)
     - `licenceImage`: String (Cloudinary URL for uploaded licence image)

2. **User Controller Updates** ([user.controller.js](backend/src/Controllers/user.controller.js))
   - Enhanced `registerUser` function to handle:
     - Image upload via multer
     - Role validation (converts lowercase to uppercase)
     - Dispatcher field validation
     - Cloudinary image upload
     - File cleanup on errors

3. **Routes Configuration** ([user.routes.js](backend/src/Routes/user.routes.js))
   - Added multer middleware to `/register` endpoint for image uploads
   - Supports multipart/form-data for file uploads

4. **Environment Variables** ([.env](backend/.env))
   - Added `FRONTEND_URL=http://localhost:5173` for email verification links

### Frontend Updates

1. **API Service** ([services/api.ts](frontend/src/services/api.ts))
   - Created comprehensive API service with axios
   - Interfaces for TypeScript type safety
   - Auth endpoints: register, login, logout, refresh token, password reset
   - Automatic error handling with interceptors
   - Cookie/credential support for authentication

2. **SignUp Page** ([pages/SignUpPage.tsx](frontend/src/pages/SignUpPage.tsx))
   - Integrated with backend API
   - Added phone number field
   - Converts role to uppercase before submission
   - Handles image file upload
   - Shows error messages
   - Loading states during API calls
   - Success notification and redirect to login

3. **Login Page** ([pages/LoginPage.tsx](frontend/src/pages/LoginPage.tsx))
   - Integrated with backend API
   - Stores user data and tokens in localStorage
   - Error handling with user-friendly messages
   - Loading states during API calls
   - Password reset functionality

4. **Environment Configuration** ([.env](frontend/.env))
   - Added `VITE_API_BASE_URL=http://localhost:2590/api/v1`

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v16+)
- MongoDB connection
- Cloudinary account (for image uploads)

### Backend Setup

1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Ensure `.env` file has all required variables:
   ```env
   PORT=8080
   MONGODB_URI=your_mongodb_uri
   CORS_ORIGIN=http://localhost:5173
   JWT_SECRET=your_secret
   FRONTEND_URL=http://localhost:5173
   ACCESS_TOKEN_SECRET=your_access_token_secret
   ACCESS_TOKEN_EXPIRY=1d
   REFRESH_TOKEN_SECRET=your_refresh_token_secret
   REFRESH_TOKEN_EXPIRY=10d
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

3. Start backend server:
   ```bash
   npm run dev
   ```
   Server runs on: `http://localhost:2590`

### Frontend Setup

1. Install dependencies (including axios):
   ```bash
   cd frontend
   npm install axios
   ```

2. Ensure `.env` file exists:
   ```env
   VITE_API_BASE_URL=http://localhost:2590/api/v1
   ```

3. Start frontend development server:
   ```bash
   npm run dev
   ```
   Frontend runs on: `http://localhost:5173`

## 🔄 API Endpoints

### Authentication

#### Register User
- **POST** `/api/v1/users/register`
- **Content-Type**: `multipart/form-data`
- **Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "passwordHash": "securepassword",
    "role": "DISPATCHER",
    "licenceNumber": "DL123456789",
    "licenceExpiry": "2026-12-31",
    "licenceImage": <File>
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "User registered successfully. Please verify your email.",
    "data": { /* user object */ }
  }
  ```

#### Login User
- **POST** `/api/v1/users/login`
- **Content-Type**: `application/json`
- **Body**:
  ```json
  {
    "email": "john@example.com",
    "passwordHash": "securepassword"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Logged in successfully as DISPATCHER",
    "data": {
      "user": { /* user object */ },
      "accessToken": "...",
      "refreshToken": "..."
    }
  }
  ```

#### Logout User
- **POST** `/api/v1/users/logout`
- **Auth**: Required (JWT)

#### Password Reset
- **POST** `/api/v1/users/send-reset-password-link`
- **Body**: `{ "email": "user@example.com" }`

## 🎯 User Roles

- **MANAGER**: Full access to all features, can manage other users
- **DISPATCHER**: Operational access, requires licence information

## 📝 Field Mappings

### Frontend → Backend
- `password` → `passwordHash`
- `role` (lowercase) → `role` (UPPERCASE)

### Required Fields by Role

**All Users:**
- name
- email
- phone
- password

**Dispatchers Only:**
- licenceNumber
- licenceExpiry
- licenceImage (uploaded file)

## 🔐 Authentication Flow

1. User signs up → Backend creates user → Email verification sent
2. User logs in → Backend validates credentials → Returns tokens
3. Tokens stored in:
   - Cookies (httpOnly, secure)
   - localStorage (frontend)
4. Protected routes use JWT authentication

## 🧪 Testing the Integration

### Test User Registration (Dispatcher)
1. Go to http://localhost:5173/signup
2. Select "Dispatcher" role
3. Fill in all fields including phone number
4. Upload a licence image
5. Submit form
6. Check for success message and redirect

### Test User Registration (Manager)
1. Go to http://localhost:5173/signup
2. Select "Manager" role
3. Fill in name, email, phone, password (no licence fields needed)
4. Submit form
5. Check for success message and redirect

### Test Login
1. Go to http://localhost:5173/login
2. Enter registered email and password
3. Submit form
4. Check localStorage for user data and token
5. Should redirect to dashboard

### Test Password Reset
1. Click "Forgot password?" on login page
2. Enter email address
3. Check for success message

## 🐛 Common Issues & Solutions

### CORS Errors
- Ensure backend CORS_ORIGIN matches frontend URL
- Check that credentials: true is set in both frontend and backend

### File Upload Errors
- Verify Cloudinary credentials in .env
- Check file size limits in multer config
- Ensure Content-Type is multipart/form-data

### Authentication Errors
- Verify JWT secrets are set in .env
- Check token expiry times
- Ensure cookies are being sent with credentials: true

### Database Connection Issues
- Verify MongoDB URI is correct
- Check network connectivity
- Ensure IP is whitelisted in MongoDB Atlas

## 📦 Dependencies to Install

### Frontend
```bash
npm install axios
```

### Backend
All dependencies are already in package.json:
- multer (file uploads)
- cloudinary (image storage)
- bcryptjs (password hashing)
- jsonwebtoken (authentication)
- mongoose (database)

## 🔄 Next Steps

1. **Install axios** in frontend
2. **Start both servers** (backend on 2590, frontend on 5173)
3. **Test registration flow** with both roles
4. **Test login flow**
5. **Create dashboard page** for post-login experience
6. **Add token refresh logic** for expired tokens
7. **Implement logout functionality**
8. **Add protected route guards** in frontend routing

## 📚 Additional Features to Implement

- Email verification flow
- Token refresh on expiration
- Profile update functionality
- Dashboard pages for Manager and Dispatcher
- Vehicle management (for managers)
- Route assignment (for dispatchers)
- Real-time fleet tracking
- Analytics and reporting

## 🔗 Important Files

### Backend
- `src/Models/user.model.js` - User schema
- `src/Controllers/user.controller.js` - Auth logic
- `src/Routes/user.routes.js` - API routes
- `src/Middlewares/auth.middleware.js` - JWT verification
- `src/Middlewares/multer.middleware.js` - File upload handling
- `src/Utils/Cloudinary.js` - Image upload utility

### Frontend
- `src/services/api.ts` - API client
- `src/pages/LoginPage.tsx` - Login UI
- `src/pages/SignUpPage.tsx` - Registration UI
- `.env` - Environment variables

## 📞 Support
For issues or questions, check the error messages in:
- Browser console (frontend errors)
- Terminal/console (backend errors)
- Network tab (API request/response details)
