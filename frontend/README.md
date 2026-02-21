# FleetFlow: Modular Fleet & Logistics Management System

> Replace inefficient manual logbooks with a centralized, rule-based digital hub that optimizes the lifecycle of a delivery fleet, monitors driver safety, and tracks financial performance.

## 🚀 Features

- **Landing Page**: Professional landing page with call-to-action and registration
- **Authentication System**: Secure login with Role-Based Access Control (RBAC)
  - Manager role (Full access)
  - Dispatcher role (Operations access)
- **Modern UI**: Built with shadcn/ui and Tailwind CSS
- **Responsive Design**: Mobile-first approach
- **Type-Safe**: Built with TypeScript

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** or **yarn** - Comes with Node.js

## 🛠️ Installation & Setup

### Step 1: Install Dependencies

Open a terminal in the project directory and run:

```bash
npm install
```

Or if you prefer yarn:

```bash
yarn install
```

This will install all required dependencies including:
- React & React Router
- TypeScript
- Tailwind CSS
- Radix UI components
- Lucide React icons
- And all other dependencies specified in package.json

### Step 2: Start Development Server

```bash
npm run dev
```

Or with yarn:

```bash
yarn dev
```

The application will start on `http://localhost:5173` (default Vite port).

### Step 3: Build for Production

When ready to deploy:

```bash
npm run build
```

This creates an optimized production build in the `dist` folder.

### Step 4: Preview Production Build

To preview the production build locally:

```bash
npm run preview
```

## 📁 Project Structure

```
fleetflow/
├── public/                 # Static assets
├── src/
│   ├── components/
│   │   └── ui/            # shadcn/ui components
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       └── dialog.tsx
│   ├── lib/
│   │   └── utils.ts       # Utility functions
│   ├── pages/
│   │   ├── LandingPage.tsx
│   │   └── LoginPage.tsx
│   ├── App.tsx            # Main app component
│   ├── main.tsx           # Entry point
│   └── index.css          # Global styles
├── index.html
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── vite.config.ts
└── components.json        # shadcn/ui config
```

## 🎨 Technology Stack

- **Frontend Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React
- **Routing**: React Router v6

## 🔧 Configuration

### Tailwind CSS Setup

Tailwind CSS is already configured in `tailwind.config.js`. It uses CSS variables for theming, making it easy to customize colors.

### TypeScript Configuration

TypeScript is configured with strict mode enabled in `tsconfig.json` for better type safety.

### Path Aliases

The project uses `@/` as an alias for the `src/` directory:

```typescript
import { Button } from '@/components/ui/button';
```

This is configured in:
- `tsconfig.json` (for TypeScript)
- `vite.config.ts` (for Vite)

## 📄 Components Overview

### shadcn/ui Components (`src/components/ui/`)

All components are located in `src/components/ui/` as per shadcn/ui conventions:

1. **Button** (`button.tsx`)
   - Multiple variants: default, destructive, outline, secondary, ghost, link
   - Multiple sizes: default, sm, lg, icon
   - Built with Radix UI Slot

2. **Input** (`input.tsx`)
   - Styled text input with focus states
   - Support for different input types

3. **Label** (`label.tsx`)
   - Accessible form labels
   - Styled consistently with the design system

4. **Dialog** (`dialog.tsx`)
   - Modal dialog component
   - Used for sign-up and registration forms
   - Built with Radix UI Dialog primitives

### Why `/components/ui` folder?

The `/components/ui` folder is crucial for shadcn/ui projects because:

1. **Convention**: It's the standard location where shadcn/ui components are installed
2. **Separation**: Keeps UI primitives separate from feature components
3. **Maintainability**: Makes it easy to update or add new shadcn/ui components
4. **Import Clarity**: Clear distinction between UI components and business logic

## 🎯 Usage

### Landing Page

The landing page (`/`) includes:
- Hero section with compelling copy
- Feature showcase
- Multiple CTAs for registration
- Sign-in navigation

### Login Page

The login page (`/login`) includes:
- Role selection (Manager/Dispatcher)
- Email and password fields
- "Forgot Password" functionality
- "Remember me" option
- Google OAuth integration (UI ready)
- Link back to registration

### Adding New Components

To add more shadcn/ui components:

1. Visit [ui.shadcn.com](https://ui.shadcn.com)
2. Browse the component library
3. Copy the component code
4. Create a new file in `src/components/ui/`
5. Paste the component code
6. Import and use in your pages

Example:
```typescript
import { Card } from '@/components/ui/card';
```

## 🚧 Next Steps

To complete the FleetFlow application, consider:

1. **Backend Integration**
   - Set up authentication API
   - Implement role-based permissions
   - Connect to database

2. **Dashboard Pages**
   - Manager dashboard
   - Dispatcher dashboard
   - Fleet overview
   - Driver management
   - Analytics and reporting

3. **Additional Features**
   - Real-time GPS tracking
   - Vehicle maintenance scheduling
   - Route optimization
   - Financial reporting
   - Driver safety monitoring

4. **Testing**
   - Unit tests with Vitest
   - Integration tests
   - E2E tests with Playwright

## 🎨 Customization

### Changing Colors

Colors are defined using CSS variables in `src/index.css`. To change the theme:

1. Open `src/index.css`
2. Modify the HSL values under `:root` for light mode
3. Modify the HSL values under `.dark` for dark mode

### Adding Dark Mode Toggle

The styling supports dark mode out of the box. To add a toggle:

1. Create a theme provider using Context API
2. Toggle the `dark` class on the `<html>` element
3. Add a toggle button in the navigation

## 📦 Dependencies

### Core Dependencies
- `react` - UI library
- `react-dom` - React DOM rendering
- `react-router-dom` - Routing
- `@radix-ui/react-dialog` - Dialog component
- `@radix-ui/react-icons` - Icon set
- `@radix-ui/react-slot` - Component composition
- `class-variance-authority` - Variant management
- `clsx` - Conditional classNames
- `tailwind-merge` - Merge Tailwind classes
- `lucide-react` - Icon library

### Dev Dependencies
- `typescript` - Type safety
- `vite` - Build tool
- `@vitejs/plugin-react` - React plugin for Vite
- `tailwindcss` - CSS framework
- `autoprefixer` - CSS post-processor
- `postcss` - CSS transformer

## 🐛 Troubleshooting

### Port already in use
If port 5173 is already in use, Vite will automatically use the next available port. Check the terminal output for the actual URL.

### Module not found errors
Ensure all dependencies are installed:
```bash
npm install
```

### TypeScript errors
Make sure your editor supports TypeScript and has the necessary extensions installed.

### Tailwind classes not working
Verify that:
1. `tailwind.config.js` is properly configured
2. `index.css` imports Tailwind directives
3. The dev server is running

## 📝 License

This project is private and proprietary.

## 👥 Support

For questions or support, contact the development team.

---

Built with ❤️ for efficient fleet management
