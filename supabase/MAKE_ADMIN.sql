-- Replace the email below with your admin login email, then run once in Supabase SQL Editor.
update public.profiles
set role = 'admin'
where id = (
  select id from auth.users where email = 'YOUR_ADMIN_EMAIL@example.com' limit 1
);
