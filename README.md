# React Frontend - Inventory Management System

This is the React version of the Inventory Management System frontend, built with Vite, React Router, and React Icons.

## Features

- ✅ Modern React with Hooks
- ✅ React Router for navigation
- ✅ React Icons (including copyright icon)
- ✅ Context API for authentication
- ✅ Axios for API calls
- ✅ Responsive design
- ✅ Toast notifications
- ✅ Modal dialogs
- ✅ Protected routes

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The React app will run on **http://localhost:5173** and proxy API requests to **http://localhost:3000**

### 3. Build for Production

```bash
npm run build
```

This creates an optimized build in the `dist` folder.

## Project Structure

```
frontend-react/
├── src/
│   ├── components/       # Reusable components
│   │   ├── Layout.jsx    # Main layout with navbar and footer
│   │   ├── Modal.jsx     # Modal dialog component
│   │   └── Toast.jsx     # Toast notification component
│   ├── pages/            # Page components
│   │   ├── Login.jsx     # Login/Register page
│   │   ├── Dashboard.jsx # Dashboard with stats
│   │   ├── Items.jsx     # Items management
│   │   ├── Categories.jsx # Categories management
│   │   └── Transactions.jsx # Transaction history
│   ├── context/          # React Context
│   │   └── AuthContext.jsx # Authentication context
│   ├── services/         # API services
│   │   └── api.js        # Axios instance and API calls
│   ├── styles/           # CSS files
│   │   └── App.css       # Main styles
│   ├── App.jsx           # Main app component with routing
│   └── main.jsx          # Entry point
├── public/               # Static assets
├── index.html            # HTML template
├── vite.config.js        # Vite configuration
└── package.json          # Dependencies
```

## API Configuration

The Vite dev server is configured to proxy API requests:

- Frontend: `http://localhost:5173`
- API Proxy: `/api` → `http://localhost:3000/api`

This is configured in `vite.config.js`.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Technologies Used

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client
- **React Icons** - Icon library (including LiaCopyright)
- **Context API** - State management

## Features Implemented

### Authentication
- Login and register forms
- JWT token management
- Protected routes
- Auto-redirect on unauthorized access

### Dashboard
- Statistics cards
- Low stock alerts
- Recent transactions
- Auto-refresh every 30 seconds

### Items Management
- CRUD operations
- Search and filter
- Low stock indicators
- Category assignment

### Categories Management
- Admin-only access
- CRUD operations
- Simple table view

### Transactions
- Create stock in/out transactions
- Filter by type and date
- Transaction history
- Real-time stock updates

## Differences from Vanilla JS Version

1. **Component-based architecture** - Reusable React components
2. **React Router** - Client-side routing instead of separate HTML files
3. **React Icons** - Using `<LiaCopyright />` component for copyright symbol
4. **Context API** - Centralized authentication state
5. **Hooks** - useState, useEffect, useContext for state management
6. **Single Page Application** - No page reloads on navigation

## Running Both Versions

You can run both the vanilla JS and React versions simultaneously:

- **Vanilla JS**: Served by Express on port 3000
- **React**: Vite dev server on port 5173

Both connect to the same backend API on port 3000.

## Production Deployment

To deploy the React version:

1. Build the React app:
   ```bash
   cd frontend-react
   npm run build
   ```

2. The `dist` folder contains the production build

3. Update backend to serve the React build (see main README)

## Notes

- The React version uses the same backend API
- All features from the vanilla JS version are implemented
- The copyright icon now uses React Icons as requested
- Styling matches the original design

## Support

For issues or questions, refer to the main project README.
# INVENTORY-FRONTEND
