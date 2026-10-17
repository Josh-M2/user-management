import { Link } from "react-router-dom";

export default function AuthShell({ eyebrow, title, description, children }) {
  return (
    <main className="auth-layout">
      <aside className="auth-intro" aria-label="About User Management">
        <Link className="brand brand-light" to="/" aria-label="User Management home">
          <span className="brand-mark">U</span>
          <span>User Management</span>
        </Link>

        <div className="auth-intro-copy">
          <span className="intro-kicker">A clearer way to manage access</span>
          <h2>Keep your people and permissions in one place.</h2>
          <p>
            Give each teammate the right access, stay on top of your directory,
            and make account changes with confidence.
          </p>
          <div className="intro-features" aria-label="Workspace features">
            <span>Role-based access</span>
            <span>One team directory</span>
            <span>Secure account actions</span>
          </div>
        </div>

        <p className="intro-footnote">Simple access management for growing teams.</p>
      </aside>

      <section className="auth-form-wrap">
        <div className="auth-card">
          <div className="auth-card-heading">
            <span className="eyebrow">{eyebrow}</span>
            <h1>{title}</h1>
            <p className="muted">{description}</p>
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}
