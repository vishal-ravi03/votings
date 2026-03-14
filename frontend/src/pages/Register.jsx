import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";
import { AuthContext } from "../context/AuthContext";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const showToast = (msg, type = "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) return showToast("All fields are required");
    if (password.length < 6) return showToast("Password must be at least 6 characters");

    setLoading(true);
    try {
      const res = await API.post("/auth/register", { username, password });
      // Auto login after registration
      login({ id: res.data.id, username, role: res.data.role });
      navigate("/");
    } catch (err) {
      showToast(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "40px auto" }}>
      <div className="page-header" style={{ padding: "20px 0" }}>
        <h1>Create Account</h1>
        <p>Join to start voting and creating polls.</p>
      </div>

      <div className="glass-card" style={{ marginBottom: "20px", padding: "15px", background: "rgba(99, 102, 241, 0.1)", border: "1px solid var(--accent-start)" }}>
        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          💡 <strong>Tip:</strong> Include "admin" in your username to get Admin privileges for testing!
        </p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card" style={{ cursor: "default" }}>
        <div className="form-group">
          <label>Username</label>
          <input
            className="form-input"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input
            className="form-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>
      </form>

      <p style={{ textAlign: "center", marginTop: "20px", color: "var(--text-secondary)" }}>
        Already have an account? <Link to="/login" style={{ color: "var(--accent-start)" }}>Login here</Link>
      </p>

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
