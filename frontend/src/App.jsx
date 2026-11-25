import "./App.css";

function App() {
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
            <div className="avatar">U</div>
            <div>
              <strong>Workspace User</strong>
              <small>Member</small>
            </div>
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
            <span className="muted">TriageSync Workspace</span>
            <div className="avatar">U</div>
          </div>
        </header>

        <section className="content">
          <div className="heading">
            <div>
              <span className="eyebrow">OVERVIEW</span>
              <h1>Your support workspace.</h1>
              <p>Manage requests, resources, and bookings in one place.</p>
            </div>

            <button className="primary-btn">＋ New request</button>
          </div>

          <div className="welcome-card">
            <div>
              <span className="eyebrow">WELCOME TO TRIAGESYNC</span>
              <h2>A clearer way to manage support.</h2>
              <p>Your workspace is ready. Start by exploring your tickets and resources.</p>
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
              <span>Explore tickets ↗</span>
            </div>

            <div className="module-card">
              <div className="module-icon">▦</div>
              <h3>Resources</h3>
              <p>Browse rooms, labs, and available equipment.</p>
              <span>Explore resources ↗</span>
            </div>

            <div className="module-card">
              <div className="module-icon">◷</div>
              <h3>Bookings</h3>
              <p>Request resources and manage your reservations.</p>
              <span>Explore bookings ↗</span>
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