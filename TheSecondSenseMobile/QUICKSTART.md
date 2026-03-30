# WayFinder Frontend - Quick Start Guide

## Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI

## Quick Start (Windows/Mac/Linux)

### 1. Navigate to Frontend Directory
```bash
cd TheSecondSenseMobile
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Expo Development Server
```bash
npm start
# or
expo start
```

### 4. Run on Your Platform
When Expo server starts, press:
- **`w`** - Run in web browser
- **`i`** - iPhone simulator (macOS only)
- **`a`** - Android emulator or device
- **`q`** - Quit

## Configuration

### Backend URL
File: `app/(tabs)/api.tsx`
```tsx
export const BASE_URL = "http://localhost:8080/api";
```

For different environments:
- **Development (Emulator)**: `http://localhost:8080/api`
- **Development (Physical Device)**: `http://192.168.1.100:8080/api` (replace IP)
- **Production**: Update to production backend URL

### Login Credentials (Demo)
- Phone: 1234567890
- Password: test123

## Project Structure

```
app/
├── (tabs)/                 # Main app screens
│   ├── dashboard.tsx       # Home page
│   ├── login.tsx           # Login screen
│   ├── register.tsx        # Registration
│   ├── api.tsx            # API configuration
│   ├── apiService.ts      # API service methods
│   └── ...
├── contexts/
│   └── AuthContext.tsx     # Authentication state management
├── components/             # Reusable components
├── constants/              # Constants
├── hooks/                  # Custom React hooks
├── tutorial/               # Tutorial system
└── assets/                 # Images and styles
```

## Key Features
- ✅ React Native & Expo setup
- ✅ JWT Authentication
- ✅ Voice biometric integration
- ✅ Transaction management
- ✅ Responsive UI components
- ✅ Dark mode support (via theme system)

## Common Commands

```bash
# Start development server
npm start

# Run on web
npm run web

# Run on Android
npm run android

# Run on iOS (macOS)
npm run ios

# Lint code
npm run lint

# Reset project (clears cache)
npm run reset-project
```

## First Time Setup

1. **Start Backend**
   - Run `mvnw clean spring-boot:run` in WayFinder-backend folder
   - Verify it's running: http://localhost:8080/api/health

2. **Start Frontend**
   - In TheSecondSenseMobile folder: `npm start`
   - Press 'w' for web or connect an emulator

3. **Test Login**
   - Use demo credentials above
   - Dashboard should load with account data

## Troubleshooting

### Cannot Connect to Backend
- Ensure backend is running: http://localhost:8080/api/health
- Check firewall allows port 8080
- For physical device: Use your computer's IP instead of localhost

### Expo Error "Port 19000 already in use"
```bash
# Kill the process using the port or use different port
expo start --port 19001
```

### npm install fails
```bash
# Clear npm cache
npm cache clean --force
# Delete node_modules and lock file
rm -rf node_modules package-lock.json
# Reinstall
npm install
```

### "Unable to resolve module" errors
```bash
# Reset Expo cache
expo start --clear
```

## Development Tips

1. **Hot Reload**: Changes save automatically in development
2. **Debugging**: Use React Native Debugger (separate app)
3. **Console**: Check browser DevTools or Expo console for errors
4. **Auth Context**: Use `useAuth()` hook to access token and user info

## Useful Links
- Expo Docs: https://docs.expo.dev
- React Native: https://reactnative.dev
- JWT Info: https://jwt.io

---
Generated: 2026-02-17
