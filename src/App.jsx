import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { isConfigured } from "./supabaseClient";
import LoginPage from "./pages/Login";
import SignupPage from "./pages/Signup";
import AdminDashboard from "./pages/AdminDashboard";
import "./App.css";

function App() {
  if (!isConfigured) {
    return (
      <main className="setup-screen">
        <div className="setup-card">
          <span className="brand-mark">U</span>
          <h1>Supabase setup needed</h1>
          <p>Copy <code>.env.example</code> to <code>.env</code>, add your project URL and publishable key, then restart the development server.</p>
        </div>
      </main>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/admindashboard" element={<AdminDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
