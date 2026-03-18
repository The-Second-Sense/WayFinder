# WayFinder - Frontend & Backend Connection Guide

## Overview
This guide explains how to run the WayFinder backend and connect it with the frontend React Native application.

## System Requirements
- Java 11+ (JDK)
- Maven 3.6+
- Node.js 18+ (for frontend)
- Expo CLI (for running the mobile app)

## Backend Setup & Running

### Step 1: Navigate to Backend Directory
```bash
cd WayFinder-backend/backend_wayfinder
```

### Step 2: Build the Project
```bash
# Using Maven wrapper (on Windows)
.\mvnw clean package

# Or using Maven directly
mvn clean package

# If you want to skip tests during build (faster)
.\mvnw clean package -DskipTests
```

### Step 3: Run the Backend Server
```bash
# Using Maven
.\mvnw spring-boot:run

# Or run the JAR file directly (after build)
java -jar target/backend_wayfinder-0.0.1-SNAPSHOT.jar
```

The backend will start on `http://localhost:8080/api`

### Step 4: Verify Backend is Running
Open your browser and navigate to:
- **Health Check**: http://localhost:8080/api/health
- **H2 Database Console**: http://localhost:8080/api/h2-console (for development only)

## Frontend Setup & Running

### Step 1: Navigate to Frontend Directory
```bash
cd TheSecondSenseMobile
```

### Step 2: Install Dependencies
```bash
npm install
# or
yarn install
```

### Step 3: Configure Backend URL
The frontend is already configured to use `http://localhost:8080/api` in the file:
- **File**: `app/(tabs)/api.tsx`
- **Variable**: `BASE_URL`

If you need to change the backend URL for different environments (e.g., running on a physical device):
```tsx
export const BASE_URL = "http://192.168.1.100:8080/api"; // Replace with your backend IP
```

### Step 4: Run the Frontend
```bash
# Start Expo development server
npm start
# or
expo start

# Then choose your platform:
# Press 'i' for iOS (macOS only)
# Press 'a' for Android
# Press 'w' for web browser
```

## API Endpoints Integration

The following endpoints are available on the backend and used by the frontend:

### Authentication Endpoints
- **POST** `/api/auth/login` - User login
- **POST** `/api/auth/register` - User registration
- **POST** `/api/auth/voice-reg` - Voice biometric registration
- **POST** `/api/auth/logout` - User logout

### Account/User Endpoints (Adapter)
- **GET** `/api/account` - Get account overview data
- **GET** `/api/transactions` - Get recent transactions

### Voice Command Endpoint
- **POST** `/api/voice/command` - Process voice commands

### Transaction Endpoints
- **POST** `/api/trans/send` - Send money
- **POST** `/api/trans/request` - Request money
- **GET** `/api/trans/history` - Transaction history

### Beneficiary Endpoints
- **GET** `/api/beneficiary` - List beneficiaries
- **POST** `/api/beneficiary` - Add beneficiary

## CORS Configuration

The backend is configured to accept requests from:
- `http://localhost:3000` (web)
- `http://localhost:8081` (native)
- `http://localhost:19006` (Expo web)
- `http://localhost:19000` (Expo native)
- `http://192.168.1.100:3000` (local network web)
- `http://192.168.1.100:8081` (local network native)
- `http://192.168.1.100:19006` (local network Expo web)
- `http://192.168.1.100:19000` (local network Expo native)

To add more origins, edit `src/main/java/com/example/backend_wayfinder/config/SecurityConfig.java`

## JWT Token Handling

- Tokens are obtained from the login endpoint
- Tokens must be included in the `Authorization` header as: `Bearer {token}`
- Frontend automatically includes tokens in all authenticated requests
- Tokens are stored in the React Context (can be upgraded to AsyncStorage for persistence)

## Database

The backend uses **H2 Database** in-memory storage for development. All data is reset when the server restarts.

To persist data, configure a real database (PostgreSQL, MySQL) in `application.properties`:
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/wayfinder
spring.datasource.driver-class-name=org.postgresql.Driver
```

## Troubleshooting

### Backend Issues
1. **Port already in use**: Change the port in `application.properties` (default: 8080)
2. **Java not found**: Install JDK 11+ and add to PATH
3. **Maven not found**: Install Maven or use `./mvnw` wrapper

### Frontend Issues
1. **Cannot connect to backend**: Check backend is running and firewall allows connections
2. **CORS errors**: Add the frontend URL to CORS config in SecurityConfig.java
3. **Blank login page**: Check console for JavaScript errors

### Connection Issues
1. Verify backend is running: `curl http://localhost:8080/api/health`
2. Check frontend BASE_URL matches backend: `app/(tabs)/api.tsx`
3. If using physical device, ensure it can reach the backend IP/port
4. Disable firewall temporarily to test, then reconfigure

## Next Steps

1. Implement proper database persistence
2. Add AsyncStorage for token persistence in frontend
3. Complete service implementations in backend (currently using placeholders)
4. Add comprehensive error handling and logging
5. Implement unit and integration tests
6. Set up environment-specific configurations

## File Locations

```
Frontend:
- Base URL config: app/(tabs)/api.tsx
- Auth Context: app/contexts/AuthContext.tsx
- API Service: app/(tabs)/apiService.ts
- Dashboard: app/(tabs)/dashboard.tsx

Backend:
- Main App: src/main/java/.../BackendWayfinderApplication.java
- Security Config: src/main/java/.../config/SecurityConfig.java
- Adapter Controller: src/main/java/.../controller/FrontendAdapterController.java
- Application Properties: src/main/resources/application.properties
- Controllers: src/main/java/.../controller/
```

## Support

For issues or questions:
1. Check the error logs in the backend console
2. Check the React Native Debugger in the frontend
3. Review the API request/response in network tab (browser DevTools for Expo web)
