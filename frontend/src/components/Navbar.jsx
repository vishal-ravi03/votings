import { useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="icon">🗳️</span>
          <span>VoteSystem</span>
        </Link>
        <div className="navbar-links" style={{ alignItems: "center" }}>
          <Link
            to="/"
            className={`nav-link ${isActive("/") ? "active" : ""}`}
          >
            Polls
          </Link>
          
          {user ? (
            <>
              {user.role === "admin" && (
                <Link
                  to="/admin"
                  className={`nav-link ${isActive("/admin") ? "active" : ""}`}
                  style={{ color: "var(--accent-start)" }}
                >
                  Admin
                </Link>
              )}
              <Link
                to="/create"
                className="nav-link nav-link-cta"
              >
                + Create Poll
              </Link>
              <span className="nav-link" style={{ marginLeft: "10px", padding: 0, color: "var(--text-muted)", cursor: "default", borderLeft: "1px solid var(--border-glass)", paddingLeft: "15px" }}>
                {user.username}
              </span>
              <button onClick={handleLogout} className="nav-link" style={{ padding: "8px 10px", color: "var(--danger)" }}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="nav-link nav-link-cta">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
