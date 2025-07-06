import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { FirebaseProvider } from './contexts/FirebaseContext';
import Login from './pages/auth/LoginPage';
import Register from './pages/auth/RegisterPage';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

function App() {
  return (
    <FirebaseProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-100">
            <Toaster position="top-right" />
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              {/* Add more routes for food management pages here */}
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </FirebaseProvider>
  );
}

export default App;