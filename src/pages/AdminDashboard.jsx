import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

async function invokeAdmin(name, body) {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (!error) return data;
  let detail = error.message;
  if (error.context instanceof Response) {
    try {
      const payload = await error.context.json();
      detail = payload.error || detail;
    } catch {
      // Keep the SDK error when the response body is not JSON.
    }
  }
  throw new Error(detail);
}

function initials(email = "") {
  return email.split("@")[0].slice(0, 2).toUpperCase() || "U";
}

function joinedDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date);
}

const roleLabels = { admin: "Administrator", manager: "Manager", staff: "Staff" };

const roleOptions = [
  { value: "staff", label: "Staff" },
  { value: "manager", label: "Manager" },
  { value: "admin", label: "Administrator" },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [form, setForm] = useState({ email: "", password: "", role: "staff" });
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        navigate("/", { replace: true });
        return false;
      }
      setUser(authData.user);
      const { data: ownProfile, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, role, created_at")
        .eq("id", authData.user.id)
        .single();
      if (profileError || !ownProfile) {
        throw new Error("Could not load your profile: " + (profileError?.message || "Profile not found"));
      }
      setProfile(ownProfile);
      if (ownProfile.role === "admin" || ownProfile.role === "manager") {
        const { data, error: listError } = await supabase
          .from("profiles")
          .select("id, email, role, created_at")
          .order("created_at", { ascending: false });
        if (listError) throw new Error("Could not load users: " + listError.message);
        setProfiles(data || []);
      } else {
        setProfiles([]);
      }
      return true;
    } catch (loadError) {
      setError(loadError.message || "Could not load the workspace. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { load(); }, [load]);

  async function runAction(action, successMessage) {
    setError("");
    setMessage("");
    setBusy(true);
    try {
      await action();
      if (await load()) setMessage(successMessage);
    } catch (actionError) {
      setError(actionError.message || "The action could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  function createUser(event) {
    event.preventDefault();
    runAction(async () => {
      await invokeAdmin("create-user", form);
      setForm({ email: "", password: "", role: "staff" });
    }, "User created successfully.");
  }

  function changeRole(id, role) {
    runAction(() => invokeAdmin("update-user-auth-role", { id, role }), "Role updated successfully.");
  }

  function deleteUser(id, email) {
    if (!window.confirm("Permanently delete " + email + "? This account cannot be restored.")) return;
    runAction(() => invokeAdmin("delete-user", { id }), "User deleted successfully.");
  }

  async function refresh() {
    setBusy(true);
    await load();
    setBusy(false);
  }

  async function signOut() {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) setError(signOutError.message);
    else navigate("/", { replace: true });
  }

  if (loading) {
    return <main className="loading-screen" aria-live="polite"><span className="brand-mark">U</span><p>Loading your workspace…</p></main>;
  }

  const isAdmin = profile?.role === "admin";
  const canViewDirectory = isAdmin || profile?.role === "manager";
  const adminCount = profiles.filter((item) => item.role === "admin").length;
  const managerCount = profiles.filter((item) => item.role === "manager").length;
  const staffCount = profiles.filter((item) => item.role === "staff").length;
  const filteredProfiles = profiles.filter((item) => {
    const matchesSearch = item.email.toLowerCase().includes(search.trim().toLowerCase());
    return matchesSearch && (roleFilter === "all" || item.role === roleFilter);
  });

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="brand"><span className="brand-mark">U</span><span>User Management</span></div>
        <div className="header-account">
          <span className="account-avatar" aria-hidden="true">{initials(user?.email)}</span>
          <span className="account-details"><strong>{user?.email}</strong><small>{roleLabels[profile?.role] || "Member"}</small></span>
          <button type="button" className="text-button" onClick={signOut}>Sign out</button>
        </div>
      </header>

      <div className="workspace">
        <div className="page-heading">
          <div><span className="eyebrow">Workspace / People</span><h1>{canViewDirectory ? "Team directory" : "Your account"}</h1><p className="muted">{isAdmin ? "Manage team members and keep access up to date." : canViewDirectory ? "Browse team members and their access levels." : "View the details and access level for your account."}</p></div>
          <button type="button" className="secondary-button" onClick={refresh} disabled={busy}>{busy ? "Working…" : "Refresh data"}</button>
        </div>

        {error && <p className="error notice" role="alert">{error}</p>}
        {message && <p className="success notice" role="status">{message}</p>}

        {profile && !canViewDirectory && (
          <section className="panel profile-panel">
            <div className="section-heading"><div><h2>Your profile</h2><p className="muted">An administrator can update your role.</p></div></div>
            <div className="profile-summary"><span className="member-avatar large" aria-hidden="true">{initials(profile.email)}</span><div><strong>{profile.email}</strong><span className="role-badge staff">Staff</span></div></div>
            <dl className="profile-details">
              <div><dt>Email address</dt><dd>{profile.email}</dd></div>
              <div><dt>Access level</dt><dd>Staff</dd></div>
              <div><dt>Joined</dt><dd>{joinedDate(profile.created_at)}</dd></div>
            </dl>
          </section>
        )}

        {canViewDirectory && (
          <>
            <section className="stats-grid" aria-label="Team overview">
              <div className="stat-card"><span>Total members</span><strong>{profiles.length}</strong><small>People in this workspace</small></div>
              <div className="stat-card"><span>Administrators</span><strong>{adminCount}</strong><small>Can manage accounts</small></div>
              <div className="stat-card"><span>Managers</span><strong>{managerCount}</strong><small>Can browse the directory</small></div>
              <div className="stat-card"><span>Staff</span><strong>{staffCount}</strong><small>Can view their own profile</small></div>
            </section>

            <div className={isAdmin ? "dashboard-grid" : "dashboard-grid read-only"}>
              {isAdmin && (
              <section className="panel create-panel">
                <div className="section-heading"><div><span className="eyebrow">Add member</span><h2>Create a user</h2><p className="muted">Set up an account and choose its access level.</p></div></div>
                <form onSubmit={createUser} className="stack">
                  <label>Email address<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} autoComplete="off" placeholder="teammate@company.com" required /></label>
                  <label>Password<input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} autoComplete="new-password" placeholder="At least 6 characters" minLength={6} required /></label>
                  <label>Role<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>{roleOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                  <p className="field-note">Staff see their own profile. Managers can browse the directory. Administrators can manage accounts.</p>
                  <button type="submit" className="primary-button" disabled={busy}>{busy ? "Working…" : "Create user"}</button>
                </form>
              </section>
              )}

              <section className="panel members-panel">
                <div className="section-heading"><div><span className="eyebrow">Directory</span><h2>Team members <span className="count-badge">{profiles.length}</span></h2><p className="muted">{isAdmin ? "Review access and manage existing accounts." : "A read-only view of your team and its roles."}</p></div></div>
                <div className="list-toolbar">
                  <label className="visually-hidden" htmlFor="member-search">Search members</label>
                  <input id="member-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by email" />
                  <label className="visually-hidden" htmlFor="role-filter">Filter by role</label>
                  <select id="role-filter" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}><option value="all">All roles</option><option value="admin">Administrators</option><option value="manager">Managers</option><option value="staff">Staff</option></select>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead><tr><th scope="col">Member</th><th scope="col">Role</th><th scope="col">Joined</th>{isAdmin && <th scope="col">Actions</th>}</tr></thead>
                    <tbody>
                      {filteredProfiles.map((item) => (
                        <tr key={item.id}>
                          <td><div className="member-cell"><span className="member-avatar" aria-hidden="true">{initials(item.email)}</span><span className="member-name">{item.email}{item.id === user?.id && <span className="you">You</span>}</span></div></td>
                          <td>{!isAdmin || item.id === user?.id ? <span className={"role-badge " + item.role}>{roleLabels[item.role] || item.role}</span> : (
                            <select className="role-select" aria-label={"Role for " + item.email} value={item.role} disabled={busy} onChange={(event) => changeRole(item.id, event.target.value)}>{roleOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
                          )}</td>
                          <td className="date-cell">{joinedDate(item.created_at)}</td>
                          {isAdmin && <td>{item.id !== user?.id && <button type="button" className="danger-button" disabled={busy} onClick={() => deleteUser(item.id, item.email)}>Delete</button>}</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredProfiles.length === 0 && <p className="empty-state">{profiles.length === 0 ? "No users yet. Create the first one using the form." : "No members match your search."}</p>}
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
