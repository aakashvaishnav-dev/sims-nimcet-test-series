# SIMS Raipur — NIMCET Online Test Series

Production-ready starter for a fast, responsive NIMCET test-series website.

Branding included:
- SIMS Raipur logo
- Teacher: **P. Nishad Sir**
- Contact: **8959774702**
- Address: **Floor - 3, Main Road Choubey Colony, Samta, Raipur - 492001**
- Footer credit: **Website created by Aakash Vaishnav**

## Main features

- Student register/login
- Responsive student dashboard
- Timed CBT-style test interface
- Server-enforced expiry time
- Automatic answer saving
- Mark for review / clear response / question palette
- Automatic submission when time ends
- Scheduled safety auto-submit job for expired attempts
- Instant score, correct/wrong/unanswered, percentage, rank and answer review
- Admin dashboard
- Student list and all attempts/results
- Create/publish/unpublish tests
- Import questions directly into a test from **XLSX / XLS / CSV / DOCX**
- Import upload kept under **4 MB** for direct Vercel Function compatibility
- Validate + preview before import
- Replace or append import mode
- Duplicate-question skipping in append mode
- English + Hindi question/option support
- Marks and negative marking per question
- LaTeX math rendering using `$...$` or `$$...$$`
- Supabase RLS and secure RPCs so correct answers are not sent during a live test
- Vercel-ready deployment

---

# 1. Requirements

Install:

```bash
Node.js 22+
Git
```

Create accounts/projects on:

- Supabase
- GitHub
- Vercel

---

# 2. Install the project

```bash
cd sims-nimcet-test-series
npm install
```

Copy environment file:

```bash
cp .env.example .env.local
```

Fill `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxx
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
CRON_SECRET=make-a-long-random-secret
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Never expose `SUPABASE_SERVICE_ROLE_KEY` in browser/client code.** It is used only in server routes.

---

# 3. Create database in Supabase

Open:

**Supabase Dashboard → SQL Editor**

Run the complete file:

```text
supabase/migrations/001_init.sql
```

This creates:

```text
profiles
exams
questions
attempts
answers
```

and all required security policies/functions.

---

# 4. Create the admin account

First run the website and register normally using the email that should be the admin account.

Then edit:

```text
supabase/MAKE_ADMIN.sql
```

Change:

```sql
'YOUR_ADMIN_EMAIL@example.com'
```

to your real admin email, then run that SQL once in Supabase SQL Editor.

Logout and login again. You will now see the Admin Panel.

---

# 5. Start locally

Normal command:

```bash
npm run dev
```

For Windows, after `.env.local` is configured, you can also double-click:

```text
START_WINDOWS.bat
```

It installs dependencies on the first run, starts the development server and opens the browser automatically.

Open:

```text
http://localhost:3000
```

Production check:

```bash
npm run typecheck
npm run build
npm run start
```

---

# 6. First test workflow

Admin workflow:

```text
Admin Login
→ Tests & Import
→ Create New Test
→ Open Test
→ Upload Question File
→ Validate & Preview
→ Import to Test
→ Publish Test
```

Student workflow:

```text
Register/Login
→ Dashboard
→ Start Test
→ Answer Questions
→ Auto Save
→ Submit OR Timer Ends
→ Result
```

---

# 7. Question import format

A ready CSV template is already included:

```text
public/question-import-template.csv
```

Admin can download it directly from the Tests page.

Recommended columns:

```text
question_number
subject
question_english
question_hindi
option_a_english
option_a_hindi
option_b_english
option_b_hindi
option_c_english
option_c_hindi
option_d_english
option_d_hindi
answer
marks
negative_marks
explanation_english
explanation_hindi
```

`answer` must be one of:

```text
A
B
C
D
```

If `marks` / `negative_marks` are blank, the test's default values are used.

## Word DOCX format supported

The parser supports the SIMS-style format:

```text
1.
Question English: Which option is correct?
Question Hindi: कौन-सा विकल्प सही है?
A English: Option A
A Hindi: विकल्प A
B English: Option B
B Hindi: विकल्प B
C English: Option C
C Hindi: विकल्प C
D English: Option D
D Hindi: विकल्प D
Answer: B
Explanation English: Explanation here.
Explanation Hindi: व्याख्या यहाँ।
```

It also supports simple English MCQ DOCX text such as:

```text
1. Question text
A. First option
B. Second option
C. Third option
D. Fourth option
Answer: B
```

For highly mathematical papers, **XLSX/CSV with LaTeX text is the most reliable import format** because Word equation objects may not always convert perfectly to plain text.

Example math:

```text
If $x^2-5x+6=0$, find the roots.
```

or block math:

```text
$$\int_0^1 x^2\,dx$$
```

---

# 8. Auto-submit design

The test timer does not depend only on the browser.

When an attempt starts, the database stores:

```text
started_at
expires_at
```

Every answer-save request checks the real server/database deadline.

If the test has expired:

```text
answers are blocked
attempt is auto-submitted
result is calculated
```

The frontend also submits immediately at `00:00:00`.

Additionally `vercel.json` runs:

```text
/api/cron/auto-submit
```

once per day as a zero-cost safety cleanup that is compatible with Vercel Hobby scheduling. Live attempts still submit immediately at `00:00:00`, and every answer/session/result request enforces `expires_at` on the server. The Admin dashboard also finalizes any expired attempts whenever it is opened. On a Vercel Pro deployment you may change the cron schedule to `*/5 * * * *` for more frequent background cleanup.

---

# 9. Security model

Important protections already included:

- Supabase Row Level Security
- Correct answers are not directly readable by students
- Live test questions are returned through a secure RPC without `correct_option`
- Correct answer review is available only after submission
- Admin API routes verify admin role server-side
- Service-role key stays server-side
- Server/database controls attempt deadlines
- Basic security headers are enabled

Do not put the service-role key in any variable beginning with `NEXT_PUBLIC_`.

---

# 10. Deploy to Vercel

Push the folder to GitHub:

```bash
git init
git add .
git commit -m "SIMS NIMCET test series"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

Then:

```text
Vercel
→ Add New Project
→ Import GitHub Repository
→ Add Environment Variables
→ Deploy
```

Add these environment variables in Vercel:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
CRON_SECRET
NEXT_PUBLIC_SITE_URL
```

After deployment, change:

```env
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

and redeploy.

You can connect a custom domain such as:

```text
nimcet.simsraipuredu.in
```

---

# 11. Important Supabase Auth setting

For the simplest launch, choose one of these:

### Option A — email confirmation OFF
Students register and can login immediately.

### Option B — email confirmation ON
Students must confirm email before login.

Set it in:

```text
Supabase → Authentication → Providers → Email
```

Also add these redirect URLs in **Supabase → Authentication → URL Configuration → Redirect URLs**:

```text
http://localhost:3000/auth/callback
https://your-production-domain.com/auth/callback
```

These URLs are used for email confirmation and password reset.

---

# 12. Recommended production launch checklist

Before opening the test series to students:

```text
1. Run npm run build successfully
2. Create admin account
3. Import one small test
4. Test on mobile and desktop
5. Start a test and refresh the browser
6. Verify saved answers remain
7. Verify timer does not reset
8. Verify manual submission
9. Verify automatic expiry
10. Verify admin result appears
11. Verify student cannot access correct answers during live test
12. Add production domain
```

---

## Technology

```text
Next.js 16
React 19
TypeScript
Supabase PostgreSQL + Auth + RLS
KaTeX
XLSX
Mammoth DOCX parser
Vercel
```

## Project branding

```text
SIMS RAIPUR
NIMCET Online Test Series
Teacher: P. Nishad Sir
Contact: 8959774702
Floor - 3, Main Road Choubey Colony, Samta, Raipur - 492001
Website created by Aakash Vaishnav
```

## Responsive UI update (29 Sep 2026)

The current build includes the final SIMS transparent logo (`public/sims-raipur-logo.png`) and mobile-first exam UI refinements. The test runner prevents horizontal page overflow, uses a compact responsive test header, a sticky progress indicator, a slide-in question palette on mobile/tablet, and a permanently visible mobile Questions/Submit action bar. Duplicate bilingual option text is hidden automatically when English and Hindi option values are identical.
