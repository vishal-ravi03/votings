import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";
import { AuthContext } from "../context/AuthContext";

export default function Login() {
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

    setLoading(true);
    try {
      const res = await API.post("/auth/login", { username, password });
      login(res.data);
      navigate("/");
    } catch (err) {
      showToast(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "40px auto" }}>
      <div className="page-header" style={{ padding: "20px 0" }}>
        <h1>Welcome Back</h1>
        <p>Login to cast your vote or create polls.</p>
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
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <p style={{ textAlign: "center", marginTop: "20px", color: "var(--text-secondary)" }}>
        Don't have an account? <Link to="/register" style={{ color: "var(--accent-start)" }}>Register here</Link>
      </p>

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
