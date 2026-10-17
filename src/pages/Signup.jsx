import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import AuthShell from "../components/AuthShell";

export default function SignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({ email: email.trim(), password });
      if (signUpError) throw signUpError;
      if (data.session) {
        navigate("/admindashboard", { replace: true });
      } else {
        setMessage("Check your email to confirm your account, then return here to sign in.");
      }
    } catch (signUpError) {
      setError(signUpError.message || "Could not create your account. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell eyebrow="Join the workspace" title="Create your account" description="Start with a staff profile. An admin can grant you more access later.">
      <form onSubmit={handleSubmit} className="stack">
        <label>Email address
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="you@company.com" required />
        </label>
        <label>Password
          <span className="password-field">
            <input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={6} placeholder="At least 6 characters" required />
            <button type="button" className="password-toggle" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>
              {showPassword ? "Hide" : "Show"}
            </button>
          </span>
        </label>
        <label>Confirm password
          <input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" placeholder="Enter it again" required />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        {message && <p className="success" role="status">{message}</p>}
        <button type="submit" className="primary-button" disabled={busy}>{busy ? "Creating account…" : "Create account"}</button>
      </form>
      <p className="footer-note">Already have an account? <Link to="/">Sign in</Link></p>
    </AuthShell>
  );
}
