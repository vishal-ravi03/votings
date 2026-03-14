import { useEffect, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";
import { AuthContext } from "../context/AuthContext";

export default function AdminDashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/");
      return;
    }

    API.get("/users")
      .then((res) => {
        setUsers(res.data);
      })
      .catch((err) => {
        setError("Failed to load users");
      })
      .finally(() => setLoading(false));
  }, [user, navigate]);

  if (!user || user.role !== "admin") return null;

  return (
    <div className="admin-dashboard">
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Manage members and view access levels.</p>
      </div>

      {loading ? (
        <div className="spinner-container">
          <div className="spinner" />
        </div>
      ) : error ? (
        <div className="empty-state">
          <div className="icon">❌</div>
          <h3>{error}</h3>
        </div>
      ) : (
        <div className="glass-card" style={{ cursor: "default" }}>
          <h2>Members ({users.length})</h2>
          <div style={{ marginTop: "20px", display: "grid", gap: "15px" }}>
            {users.map((u) => (
              <div
                key={u.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "15px",
                  background: "var(--bg-glass)",
                  border: "1px solid var(--border-glass)",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                <div>
                  <h4 style={{ margin: "0 0 5px 0" }}>{u.username}</h4>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    Joined: {u.created_at ? new Date(u.created_at).toLocaleDateString() : "Unknown"}
                  </span>
                </div>
                <div>
                  <span
                    className="badge"
                    style={{
                      background: u.role === "admin" ? "rgba(99, 102, 241, 0.2)" : "var(--bg-glass)",
                      borderColor: u.role === "admin" ? "var(--accent-start)" : "var(--border-glass)",
                      color: u.role === "admin" ? "var(--accent-start)" : "var(--text-secondary)",
                    }}
                  >
                    {u.role.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
