import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import AuthShell from "../components/AuthShell";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signInError) throw signInError;
      navigate("/admindashboard", { replace: true });
    } catch (signInError) {
      setError(signInError.message || "Could not sign in. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell eyebrow="Welcome back" title="Sign in to your workspace" description="Your team directory is just a sign in away.">
      <form onSubmit={handleSubmit} className="stack">
        <label>Email address
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="you@company.com" required />
        </label>
        <label>Password
          <span className="password-field">
            <input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" placeholder="Enter your password" required />
            <button type="button" className="password-toggle" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>
              {showPassword ? "Hide" : "Show"}
            </button>
          </span>
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit" className="primary-button" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
      </form>
      <p className="footer-note">New to the workspace? <Link to="/signup">Create an account</Link></p>
    </AuthShell>
  );
}
