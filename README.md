# HydroNourish — Heritage Animal Clinic

Smart Pet Hydration & Feeding Management System powered by ESP32 IoT devices, real-time AI health monitoring, and a secure Supabase-backed administrator portal.

---

## Tech Stack

- **React 18 + Vite** — frontend framework
- **TypeScript** — strict typing throughout, no `.js`/`.jsx` files
- **Tailwind CSS v4** — utility-first styling
- **React Router v6** — client-side routing
- **Supabase** — authentication (email OTP) + PostgreSQL database + Row Level Security
- **Recharts** — dashboard charts
- **Lucide React** — icons

---

## Environment Variables

Create a `.env` file in the project root (never commit it):

```env
# Required
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Optional (AI Clinical Assistant)
VITE_GEMINI_API_KEY=
VITE_OPENAI_API_KEY=
```

> **Never put the Supabase service-role key in this file.** The service-role key bypasses Row Level Security and must only be used server-side.

---

## Supabase Project Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Choose a region closest to your users (e.g., AP Southeast — Singapore).
3. Wait for the project to initialize.

### 2. Copy Your API Keys

Navigate to **Project Settings → API**:

- **Project URL** → `VITE_SUPABASE_URL`
- **anon / public** key → `VITE_SUPABASE_ANON_KEY`

### 3. Enable Email OTP Authentication

1. Go to **Authentication → Providers**.
2. Ensure **Email** is enabled.
3. Under **Email**, enable **"Passwordless / OTP sign-in"** (this allows `signInWithOtp`).
4. Set **OTP Expiry** (recommended: 600 seconds / 10 minutes).
5. **Disable** "Confirm email" for OTP-only flow (or keep it on if you want email confirmation for new users).
6. Under **User Signups**, **disable "Enable new user signups"** — provisioning is done manually.

### 4. Configure the OTP Email Template

1. Go to **Authentication → Email Templates → Magic Link**.
2. Customize the template to match Heritage Animal Clinic branding.
3. The OTP code is available as `{{ .Token }}` in the template.
4. Recommended subject: `Your Heritage Animal Clinic Verification Code`

### 5. Configure Redirect URLs

For local development, add:
```
http://localhost:5173
http://localhost:5173/**
```

For production (Vercel), add:
```
https://your-app.vercel.app
https://your-app.vercel.app/**
```

Set these in **Authentication → URL Configuration → Redirect URLs**.

---

## Database Migration

### Run the Admin Profiles Migration

1. Go to **Supabase Dashboard → SQL Editor**.
2. Open and run `supabase/migrations/create_admin_profiles.sql`.

This creates:
- The `admin_profiles` table linked to `auth.users`
- Row Level Security policies (select-own, update-last-login only)
- A trigger preventing frontend `role`/`status` modification

> You only need to run this once per project.

---

## Creating the First Administrator

**There is no public sign-up page.** Administrators must be provisioned manually.

### Step 1: Create the Auth User

In **Supabase Dashboard → Authentication → Users**:

1. Click **"Invite user"**.
2. Enter the administrator's email address.
3. Supabase will send an invitation email.
4. The admin must click the link to confirm their account.

### Step 2: Get the User's UUID

After confirmation, find the user in **Authentication → Users** and copy their UUID.

### Step 3: Insert the Admin Profile

In **SQL Editor**, run:

```sql
INSERT INTO public.admin_profiles (id, email, full_name, role, status)
VALUES (
  'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',  -- replace with real auth.users UUID
  'admin@example.com',                      -- must match auth user email exactly
  'Administrator Full Name',
  'super_admin',                            -- or 'admin'
  'active'
);
```

> **Role and status can only be changed via this SQL Editor or a server-side process.** Frontend users cannot promote themselves.

---

## Running Locally

```bash
# Install dependencies
npm install

# Copy and fill in your environment variables
cp .env.example .env
# Edit .env with your Supabase URL and anon key

# Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

Admin login is at `/admin/login`.

---

## Testing Administrator Login

1. Navigate to `/admin/login`.
2. Enter the provisioned administrator email.
3. Click **"Send Verification Code"**.
4. Check your email inbox for the 6-digit OTP from Supabase.
5. Enter the OTP in the 6-box input.
6. On success, you will be redirected to `/app` (the dashboard).

### Testing Edge Cases

| Scenario | Expected Behaviour |
|---|---|
| Unknown email | Neutral "if authorized" message |
| Wrong OTP | "Incorrect code" error |
| Expired OTP | "Code has expired" error |
| Inactive account | Signed out, error shown |
| Suspended account | Signed out, error shown |
| No admin profile | Signed out, unauthorized page |
| Direct `/app` URL without session | Redirect to `/admin/login` |
| Refresh with valid session | Stays on dashboard |
| Logout → browser Back | Cannot access dashboard |

---

## Deploying to Vercel

1. Push to GitHub.
2. In Vercel, import your repository.
3. Set the **Framework Preset** to `Vite`.
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy.

### Required: Add Vercel URL to Supabase Redirect URLs

After deployment, add your Vercel URL to **Authentication → URL Configuration → Redirect URLs** in Supabase:

```
https://your-app.vercel.app
https://your-app.vercel.app/**
```

The project includes a `vercel.json` for SPA routing:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

---

## Security Reminders

- **Never commit `.env`** — it is in `.gitignore`
- **Never put the service-role key in frontend code** — it bypasses RLS
- **Admin provisioning** is done via the Supabase dashboard only
- **Role and status changes** must go through the SQL editor or a server-side function
- **OTP codes** are generated and validated by Supabase — never client-side
- **Session persistence** is managed by the Supabase client — never stored manually in localStorage
- **Row Level Security** is the true security boundary — frontend route guards are for UX only

---

## Troubleshooting

### OTP Email Not Received

1. Check the spam/junk folder.
2. Verify the email provider is not blocking Supabase's sending domain.
3. In Supabase Dashboard → **Authentication → Logs**, check for send errors.
4. Supabase free tier has an email send rate limit — wait 60 seconds between attempts.
5. For production, configure a **custom SMTP provider** in **Project Settings → Auth → SMTP Settings**.

### "Authentication service is not configured"

Your `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` is missing or incorrect. Check your `.env` file.

### "This account is not authorized to access the administrator portal."

Either:
- No `admin_profiles` row exists for this user → run the INSERT statement in the SQL Editor.
- The `status` is `inactive` or `suspended` → update via SQL Editor.
- The `role` is not `admin` or `super_admin` → update via SQL Editor.

### Session Expires Too Quickly

In **Supabase Dashboard → Project Settings → Auth → JWT expiry**, the default is 3600 seconds (1 hour). The Supabase client auto-refreshes tokens. If sessions expire, check that `autoRefreshToken: true` is set in the Supabase client config (`src/lib/supabase.ts`).

---

## Project Structure (Auth-Related Files)

```
src/
├── lib/
│   └── supabase.ts              # Supabase client (env vars only)
├── types/
│   ├── auth.ts                  # AdminProfile, AuthContextValue, AuthResult
│   └── database.ts              # Supabase Database type definitions
├── contexts/
│   └── AuthContext.tsx          # Real Supabase Auth context
├── services/
│   └── adminAuthService.ts      # requestOtp, verifyOtp, fetchAdminProfile
├── utils/
│   └── authErrors.ts            # User-friendly error messages
├── components/auth/
│   ├── AdminEmailForm.tsx        # Step 1: email input
│   ├── AdminOtpForm.tsx          # Step 2: OTP verification
│   └── AuthLoadingScreen.tsx    # Full-page session loading screen
├── routes/
│   ├── ProtectedRoute.tsx       # Session check guard
│   └── AdminRoute.tsx           # Admin role + status guard
└── pages/
    ├── auth/
    │   └── AdminLoginPage.tsx   # Two-step login page
    ├── UnauthorizedPage.tsx     # For authenticated non-admins
    └── NotFoundPage.tsx         # 404 page

supabase/
└── migrations/
    └── create_admin_profiles.sql  # Table + RLS + trigger
```