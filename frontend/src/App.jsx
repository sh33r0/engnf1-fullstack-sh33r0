import { useEffect, useState } from "react";
import "./App.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function request(path, options = {}, token = "") {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
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
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    progress: 0,
    reviewed: 0,
  });
  const [ticketLoading, setTicketLoading] = useState(false);
  const [ticketError, setTicketError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const resetFilters = () => {
    setSearch("");
    setStatus("");
    setCategory("");
    setPriority("");
    setPage(1);
  };

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketEvents, setTicketEvents] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const openTicket = async (id) => {
    setDetailLoading(true);
    setSelectedTicket(null);

    try {
      const d = await request(`/tickets/${id}`, {}, token);
      setSelectedTicket(d.ticket);
      setTicketEvents(d.events || []);
    } catch (err) {
      setTicketError(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !token) return;

    const load = async () => {
      setTicketLoading(true);
      setTicketError("");

      const p = new URLSearchParams({
        page: String(page),
        limit: "10",
      });

      if (search.trim()) p.set("q", search.trim());
      if (status) p.set("status", status);
      if (category) p.set("category", category);
      if (priority) p.set("priority", priority);

      try {
        const d = await request(`/tickets?${p.toString()}`, {}, token);
        setTickets(d.data || []);
        setTotalPages(d.totalPages || 1);
        setStats((s) => ({ ...s, total: d.total || 0 }));
      } catch (err) {
        setTicketError(err.message);
      } finally {
        setTicketLoading(false);
      }
    };

    load();
  }, [user, token, page, search, status, category, priority]);

  useEffect(() => {
    if (!user || !token) return;

    setTicketLoading(true);
    setTicketError("");

    request("/tickets?page=1&limit=100", {}, token)
      .then((d) => {
        const list = d.data || [];

        setTickets(list);
        setStats({
          total: d.total || 0,
          open: list.filter((t) => t.status === "OPEN").length,
          progress: list.filter((t) => t.status === "IN_PROGRESS").length,
          reviewed: list.filter((t) => t.isReviewed).length,
        });
      })
      .catch((err) => setTicketError(err.message))
      .finally(() => setTicketLoading(false));
  }, [user, token]);

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
          body: JSON.stringify(form),
        });

        setMode("login");
        setForm({ name: "", email: form.email, password: "" });
        setMessage("Account created. Sign in to continue.");
      } else {
        const d = await request("/auth/login", {
          method: "POST",
          body: JSON.stringify({
            email: form.email,
            password: form.password,
          }),
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
              Manage support tickets, coordinate resources, and keep your team
              moving.
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
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
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
                onChange={(e) => setForm({ ...form, email: e.target.value })}
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
                onChange={(e) => setForm({ ...form, password: e.target.value })}
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
          <button className="nav-item active">
            ▤ <span>Tickets</span>
          </button>
          <button className="nav-item">
            ▦ <span>Resources</span>
          </button>
          <button className="nav-item">
            ◷ <span>Bookings</span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <span>✦</span>
            <h4>Stay organized.</h4>
            <p>Keep every request moving with TriageSync.</p>
          </div>

          <div className="profile">
            <div className="avatar">{user.name?.[0]?.toUpperCase()}</div>
            <div className="profile-info">
              <strong>{user.name}</strong>
              <small>{user.role}</small>
            </div>
            <button className="logout" onClick={logout}>
              ↗
            </button>
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
            <div className="avatar">{user.name?.[0]?.toUpperCase()}</div>
          </div>
        </header>

        <section className="content">
          <div className="heading">
            <div>
              <span className="eyebrow">OVERVIEW</span>
              <h1>Welcome, {user.name?.split(" ")[0]}.</h1>
              <p>Here's what's happening with your support tickets.</p>
            </div>
            <button className="primary-btn">＋ New ticket</button>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <span>Total tickets</span>
              <h2>{stats.total}</h2>
              <small>All support requests</small>
            </div>
            <div className="stat-card">
              <span>Open tickets</span>
              <h2>{stats.open}</h2>
              <small>Awaiting action</small>
            </div>
            <div className="stat-card">
              <span>In progress</span>
              <h2>{stats.progress}</h2>
              <small>Currently being handled</small>
            </div>
            <div className="stat-card">
              <span>Reviewed</span>
              <h2>{stats.reviewed}</h2>
              <small>Tickets reviewed</small>
            </div>
          </div>

          <div className="ticket-heading">
            <div>
              <h2>Recent tickets</h2>
              <p>Your latest support requests</p>
            </div>
            <span>{stats.total} tickets</span>
          </div>

          <div className="filter-bar">
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search tickets..."
            />

            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>

            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All categories</option>
              <option value="BILLING">Billing</option>
              <option value="LOGIN">Login</option>
              <option value="DELIVERY">Delivery</option>
              <option value="BUG">Bug</option>
              <option value="FEATURE_REQUEST">Feature request</option>
            </select>

            <select
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            <button className="reset-btn" onClick={resetFilters}>
              Reset
            </button>
          </div>

          {ticketLoading ? (
            <div className="empty-state">Loading tickets...</div>
          ) : ticketError ? (
            <div className="alert">{ticketError}</div>
          ) : tickets.length === 0 ? (
            <div className="empty-state">No tickets found.</div>
          ) : (
            <div className="ticket-table-wrap">
              <table className="ticket-table">
                <thead>
                  <tr
                    key={t._id}
                    onClick={() => openTicket(t._id)}
                    className="clickable-row"
                  >
                    <td className="ticket-id">{t.externalId}</td>
                    <td className="ticket-subject">{t.subject}</td>
                    <td>
                      <span className="category-tag">{t.category}</span>
                    </td>
                    <td>
                      <span
                        className={`priority-tag ${t.priority.toLowerCase()}`}
                      >
                        {t.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`status-tag ${t.status.toLowerCase()}`}>
                        {t.status.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t._id}>
                      <td className="ticket-id">{t.externalId}</td>
                      <td className="ticket-subject">{t.subject}</td>
                      <td>
                        <span className="category-tag">{t.category}</span>
                      </td>
                      <td>
                        <span
                          className={`priority-tag ${t.priority.toLowerCase()}`}
                        >
                          {t.priority}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`status-tag ${t.status.toLowerCase()}`}
                        >
                          {t.status.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {detailLoading && (
                <div className="empty-state">Loading ticket details...</div>
              )}

              {selectedTicket && (
                <div className="ticket-detail">
                  <div className="detail-header">
                    <div>
                      <span className="eyebrow">
                        {selectedTicket.externalId}
                      </span>
                      <h2>{selectedTicket.subject}</h2>
                    </div>
                    <button onClick={() => setSelectedTicket(null)}>
                      Close
                    </button>
                  </div>

                  <p>{selectedTicket.body}</p>

                  <div className="detail-info">
                    <div>
                      <span>Category</span>
                      <strong>{selectedTicket.category}</strong>
                    </div>
                    <div>
                      <span>Priority</span>
                      <strong>{selectedTicket.priority}</strong>
                    </div>
                    <div>
                      <span>Status</span>
                      <strong>{selectedTicket.status.replace("_", " ")}</strong>
                    </div>
                    <div>
                      <span>Reviewed</span>
                      <strong>
                        {selectedTicket.isReviewed ? "Yes" : "No"}
                      </strong>
                    </div>
                    <div>
                      <span>Human override</span>
                      <strong>
                        {selectedTicket.isHumanOverride ? "Yes" : "No"}
                      </strong>
                    </div>
                  </div>

                  <h3>Activity history</h3>

                  {ticketEvents.length === 0 ? (
                    <p>No activity recorded yet.</p>
                  ) : (
                    <div className="event-list">
                      {ticketEvents.map((ev, i) => (
                        <div className="event-item" key={ev._id || i}>
                          <strong>{ev.field}</strong>
                          <p>
                            {ev.oldValue || "None"} → {ev.newValue || "None"}
                          </p>
                          <small>{ev.actor}</small>
                          <small>
                            {ev.createdAt
                              ? new Date(ev.createdAt).toLocaleString()
                              : ""}
                          </small>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>

        <footer className="footer">
          TriageSync <span>·</span> Support operations workspace
        </footer>
      </main>
    </div>
  );
}

export default App;
