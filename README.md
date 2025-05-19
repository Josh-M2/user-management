# Supabase User Management with RBAC, RLS, and Edge Functions (React + Vite)

This is a side project that demonstrates how to build a **user management system** using:

- **Supabase Edge Functions** (as server-side logic)
- **Supabase Auth**
- **Postgres Row-Level Security (RLS)**
- **Role-Based Access Control (RBAC)**
- **React.js (with Vite)** for the frontend

The goal is to practice secure access patterns using Supabase-native tools — **no Express or Node.js backend used**.

---

## 🔧 Features

- 🔐 **Supabase Auth** for signup/login
- 📤 **Supabase Edge Functions** to:
  - Update `user_metadata` and `app_metadata`
  - Create users (server-side logic)
- 🛡️ **RLS + RBAC** in Postgres to enforce data access per user role
- 🧑‍🤝‍🧑 Two roles only: `admin` and `manager`
- 👤 **Admin** can:
  - Access full admin dashboard
  - CRUD users (create, update role, delete, fetch all users)
- 📁 **Manager** can:
  - Only read their own profile
  - Cannot access admin dashboard

---

## 🧪 Signup Flow

- New users that register are automatically assigned the `admin` role by default
- This is intentional for easier testing of all RLS + RBAC functionality
- Email verification is required
- Role metadata is injected using Supabase Edge Functions

---

## 🧠 Tech Stack

| Layer        | Tool                     |
|--------------|--------------------------|
| Frontend     | React.js + Vite          |
| Backend      | Supabase Edge Functions  |
| Auth         | Supabase Auth            |
| Database     | Supabase Postgres        |
| Access Ctrl  | RLS + RBAC via policies  |

---

## 📜 Notes

- ✅ No Express / Node.js backend — all backend logic handled via **Supabase Edge Functions**
- ✅ Uses **Postgres RLS** to strictly control what each role can query
- ✅ Admin has full CRUD capabilities on the `profiles` table
- ✅ Manager role restricted to reading their own data only
- ❌ UI is intentionally minimal (styling not prioritized)

---

## 🚀 How to Run

1. Create a new [Supabase](https://supabase.com) project
2. Set up `profiles` table and enable **RLS**
3. Deploy your **Edge Functions** via the Supabase CLI:
   ```bash
   supabase functions deploy your-function-name
4. Set up JWT policies and metadata updates in your function logic

## Start the frontend:
    npm install
    npm run dev

## 🛠️ Environment Variables

Create a `.env` file in the root of your project and add the following:

```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_SERVICE_KEY=your-supabase-service-role-key
VITE_SUPABASE_API_KEY=your-supabase-anon-key
