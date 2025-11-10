BareMinimum v4 — Supabase sync ready

What's included
- React + Vite app with Supabase client integration
- Local-first behaviour: saves to localStorage and syncs to Supabase when signed in & online
- Google sign-in + email/password support via Supabase Auth
- Expense CRUD with remote persist and simple sync-on-connect logic

Quick setup
1. Install dependencies:
   npm install

2. Provide environment variables (Vite):
   Create a file named .env in the project root with:
   VITE_SUPABASE_URL=https://noaykcttfgbnufrnyiow.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vYXlrY3R0ZmdibnVmcm55aW93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MDc4NzQsImV4cCI6MjA3ODI4Mzg3NH0.vi3F82hV7rEqnZwLTk1TRWCCSv7MNbmxOg5A_CK67Ks

3. Start dev server:
   npm run dev

Supabase SQL
You already ran the SQL provided earlier to create tables & RLS.

Notes
- Do not expose the service_role key on the client.
- This is a starting point. You can improve conflict resolution, add background sync, and notifications.
