BareMinimum v6.1 — Final polished build

What's included
- v6.1: Improved Auth (Google + Email), show/hide password, forgot password flow
- Local-first behavior with Supabase sync (pull/push)
- Daily & Monthly summaries, grouped-by-date expense list, type & category summaries
- Default current month/year, Mark-as-Cash (via payment type dropdown)
- Light/Dark mode, emojis, tidy UI, responsive design

Instructions
1. Unzip the folder.
2. Create a .env file in the project root with these values (replace anon key if you rotate it):
   VITE_SUPABASE_URL=https://noaykcttfgbnufrnyiow.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
3. npm install
4. npm run dev
5. In Supabase dashboard → Authentication → Settings, ensure Site URL and Redirect URL include your live Vercel URL (e.g. https://bareminimum-igfb7ll8r-somanshu-agarwals-projects.vercel.app) for Google OAuth to work.

Security note: never commit service_role key to the repo.
