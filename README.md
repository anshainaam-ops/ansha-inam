# Ansha Inam Plastic Industry — Private Business System

Static site (GitHub Pages) + Supabase (free PostgreSQL + login). Only 2 approved users.

## Setup (≈15 min)
1. **supabase.com** → New project (free).
2. **Authentication → Providers → Email:** turn OFF "Allow new users to sign up" (Public registration closed).
3. **Authentication → Users → Add user:** create Inamullah and Aizaz Khan (own email + password each).
4. **SQL Editor:** paste all of `supabase/schema.sql` → Run. Then run the last (commented) line with the two real emails.
5. **Project Settings → API:** copy URL + anon key into `js/config.js`.
6. Put product photos in `img/` and set the path with the ✏️ Edit button on the Products page.
7. Push this folder to GitHub → Settings → Pages → deploy from `main`. Make the repo **private** if your plan allows (the site works either way; data lives in Supabase, not in the repo).

## The 3 checks you asked for
- **Database:** PostgreSQL; nothing can be deleted (no DELETE rights exist); every insert/update is logged with user + time. Daily backup: add repo secret `SUPABASE_DB_URL` (Supabase → Connect → Session pooler URI); `.github/workflows/backup.yml` stores a `pg_dump` for 90 days (Actions → download). Also download the Master Excel / JSON from "Backup & Log" any time. Restore: `psql "$DB_URL" < backup.sql` on a fresh Supabase project.
- **Accounting accuracy:** totals are computed in the database (`numeric`, 2 decimals); stock and payments change only inside locked database functions (no double-selling, safe for 2 users together); profit uses the cost at the time of sale (weighted-average purchase cost); balances are always recalculated from the records, never typed by hand; loan repayments cannot exceed what is remaining.
- **Security:** Supabase Auth + Row Level Security. Even if someone signs up, `allowed_users` lets only the two approved IDs read or write anything.

## Not included yet
PWA install icon, automatic scheduled weekly Excel files (use Reports → date range → Excel), multi-product invoices (one product per entry), cash-closing history archive. Test with fake data before real use.
