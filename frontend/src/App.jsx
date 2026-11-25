import { useEffect, useState } from "react";
import "./App.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function request(path, options = {}, token = "") {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error?.message || "Something went wrong");
  }

  return data;
}

function App() {
  const [token, setToken] = useState(localStorage.getItem("ts_token") || "");
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) return;

    request("/auth/me", {}, token)
      .then(d => setUser(d.user))
      .catch(() => {
        localStorage.removeItem("ts_token");
        setToken("");
        setUser(null);
      });
  }, [token]);

  function changeMode(next) {
    setMode(next);
    setError("");
    setMessage("");
    setForm({ name: "", email: "", password: "" });
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (mode === "register") {
        await request("/auth/register", {
          method: "POST",
          body: JSON.stringify(form)
        });

        setMode("login");
        setForm({ name: "", email: form.email, password: "" });
        setMessage("Account created. Sign in to continue.");
      } else {
        const d = await request("/auth/login", {
          method: "POST",
          body: JSON.stringify({
            email: form.email,
            password: form.password
          })
        });

        localStorage.setItem("ts_token", d.token);
        setToken(d.token);
        setUser(d.user);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("ts_token");
    setToken("");
    setUser(null);
    setMode("login");
    setForm({ name: "", email: "", password: "" });
  }

  if (!user) {
    return (
      <div className="auth-page">
        <div className="auth-art">
          <div className="brand">
            <span className="brand-icon">✳</span>
            TriageSync
          </div>

          <div className="auth-copy">
            <span className="eyebrow">SUPPORT OPERATIONS, SIMPLIFIED</span>
            <h1>Every issue deserves the right attention.</h1>
            <p>
              Manage support tickets, coordinate resources, and keep your
              team moving.
            </p>
            <div className="art-shape shape-one" />
            <div className="art-shape shape-two" />
          </div>

          <span className="auth-foot">
            A clearer way to work through every request.
          </span>
        </div>

        <div className="auth-panel">
          <form className="auth-form" onSubmit={submit}>
            <span className="eyebrow">WELCOME TO TRIAGESYNC</span>

            <h2>
              {mode === "login"
                ? "Sign in to your workspace"
                : "Create your account"}
            </h2>

            <p className="muted">
              {mode === "login"
                ? "Enter your details to continue."
                : "Join your team's support workspace."}
            </p>

            {mode === "register" && (
              <label>
                Full name
                <input
                  required
                  minLength={2}
                  maxLength={50}
                  value={form.name}
                  onChange={e =>
                    setForm({ ...form, name: e.target.value })
                  }
                  placeholder="Your name"
                />
              </label>
            )}

            <label>
              Email address
              <input
                required
                type="email"
                value={form.email}
                onChange={e =>
                  setForm({ ...form, email: e.target.value })
                }
                placeholder="you@example.com"
              />
            </label>

            <label>
              Password
              <input
                required
                type="password"
                minLength={mode === "register" ? 8 : undefined}
                maxLength={64}
                value={form.password}
                onChange={e =>
                  setForm({ ...form, password: e.target.value })
                }
                placeholder="Enter your password"
              />
            </label>

            {mode === "register" && (
              <p className="password-hint">
                Use 8–64 characters with uppercase, lowercase, and a number.
              </p>
            )}

            {error && <div className="alert">{error}</div>}
            {message && <div className="notice">{message}</div>}

            <button className="primary-btn full" disabled={loading}>
              {loading
                ? "Please wait..."
                : mode === "login"
                  ? "Sign in"
                  : "Create account"}
            </button>

            <p className="switch-auth">
              {mode === "login"
                ? "New to TriageSync?"
                : "Already have an account?"}

              <button
                type="button"
                onClick={() =>
                  changeMode(mode === "login" ? "register" : "login")
                }
              >
                {mode === "login" ? "Create account" : "Sign in"}
              </button>
            </p>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">✳</span>
          TriageSync
        </div>

        <p className="nav-label">WORKSPACE</p>

        <nav className="nav">
          <button className="nav-item active">▤ <span>Tickets</span></button>
          <button className="nav-item">▦ <span>Resources</span></button>
          <button className="nav-item">◷ <span>Bookings</span></button>
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <span>✦</span>
            <h4>Stay organized.</h4>
            <p>Keep every request moving with TriageSync.</p>
          </div>

          <div className="profile">
            <div className="avatar">
              {user.name?.[0]?.toUpperCase()}
            </div>
            <div className="profile-info">
              <strong>{user.name}</strong>
              <small>{user.role}</small>
            </div>
            <button className="logout" onClick={logout}>↗</button>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <span className="muted">Workspace / </span>
            <strong>Overview</strong>
          </div>

          <div className="top-right">
            <span className="muted">{user.email}</span>
            <div className="avatar">
              {user.name?.[0]?.toUpperCase()}
            </div>
          </div>
        </header>

        <section className="content">
          <div className="heading">
            <div>
              <span className="eyebrow">OVERVIEW</span>
              <h1>Welcome, {user.name?.split(" ")[0]}.</h1>
              <p>Your TriageSync workspace is ready.</p>
            </div>
          </div>

          <div className="welcome-card">
            <div>
              <span className="eyebrow">SIGNED IN SUCCESSFULLY</span>
              <h2>Your support workspace.</h2>
              <p>
                You're signed in as {user.role}. Your workspace is ready
                for ticket and resource management.
              </p>
            </div>
            <div className="welcome-art">✳</div>
          </div>

          <div className="section-title">
            <h2>Workspace modules</h2>
            <span>YOUR TOOLS</span>
          </div>

          <div className="module-grid">
            <div className="module-card">
              <div className="module-icon">▤</div>
              <h3>Tickets</h3>
              <p>Track, categorize, and manage support requests.</p>
            </div>

            <div className="module-card">
              <div className="module-icon">▦</div>
              <h3>Resources</h3>
              <p>Browse rooms, labs, and available equipment.</p>
            </div>

            <div className="module-card">
              <div className="module-icon">◷</div>
              <h3>Bookings</h3>
              <p>Request resources and manage reservations.</p>
            </div>
          </div>
        </section>

        <footer className="footer">
          TriageSync <span>·</span> Support operations workspace
        </footer>
      </main>
    </div>
  );
}

export default App;