# सबसे पहले क्या करना है

यह project पूरा structure लेकर तैयार है। इसे चलाने के लिए केवल Supabase connect करना है।

## Step 1

Terminal में:

```bash
npm install
```

## Step 2

`.env.example` की copy बनाकर `.env.local` बनाएँ और Supabase keys डालें।

## Step 3

Supabase SQL Editor में यह file पूरी run करें:

```text
supabase/migrations/001_init.sql
```

## Step 4

Website पर अपना admin account पहले normal register करें। फिर:

```text
supabase/MAKE_ADMIN.sql
```

में अपना email डालकर SQL Editor में run करें।

## Step 5

```bash
npm run dev
```

अब browser में:

```text
http://localhost:3000
```

खोलें।

## Step 6 — Test बनाना

```text
Admin → Tests & Import → Create New Test
```

फिर test open करें और XLSX / CSV / DOCX upload करें।

```text
Validate & Preview → Import to Test → Publish Test
```

बस। Student dashboard में test दिखने लगेगा।

## Deploy

GitHub पर push करके Vercel में repository import करें, environment variables add करें और Deploy दबाएँ।
