import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import CreatePoll from "./pages/CreatePoll";
import Vote from "./pages/Vote";
import Results from "./pages/Results";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import "./index.css";

// A simple protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <div className="app-container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/create" 
              element={
                <ProtectedRoute>
                  <CreatePoll />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/poll/:id" 
              element={
                <ProtectedRoute>
                  <Vote />
                </ProtectedRoute>
              } 
            />
            <Route path="/results/:id" element={<Results />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
