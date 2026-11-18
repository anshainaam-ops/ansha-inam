# Ansha Inam Industry — Private Business System

Website (GitHub Pages) + database & login (Supabase, free). Only your 2 approved users can see anything.

## Folder map (upload ALL of this to GitHub, keep the same folders)
```
index.html            the page itself (top bar, login, header)
css/style.css         all colours, glossy theme, dark + light, card sizes
js/app.js             all the logic (sales, ledgers, loans, reports, PDF, pictures)
js/config.js          YOUR Supabase URL + public key   <-- already filled
js/logo.js            your monogram (used on login, top bar, invoices, reports)
img/logo.png          monogram as a normal picture
supabase/schema.sql   FULL database set-up (fresh project: run this ONE file only)
supabase/update2.sql  cancel feature      \  only for a project that was set up
supabase/update3.sql  permanent delete     > with an OLD schema.sql. Run them in
supabase/update4.sql  product pictures    /  order, each once.
.github/workflows/backup.yml   daily backup (create it by hand on GitHub — hidden folder)
```

## Fresh set-up in 6 steps
1. supabase.com → New project. Authentication → turn OFF "Allow new users to sign up".
2. Authentication → Users → add the 2 users (tick Auto Confirm).
3. SQL Editor → paste ALL of `schema.sql` → Run (once).
4. Run:  `insert into allowed_users select id from auth.users where email in ('a@x.com','b@x.com');`  (real emails)
5. Put your URL + publishable key in `js/config.js`.
6. Upload everything to GitHub → Settings → Pages → Deploy from branch `main` / root.

## Already running? Update in 2 steps
1. Supabase → SQL Editor → run `update4.sql` (pictures). If the site said "column voided does not exist", run `update2.sql` then `update3.sql` first.
2. GitHub → replace `index.html`, `css/style.css`, `js/app.js` and add `js/logo.js`, `img/logo.png`.

## Hints — where to change things (also written at the top of js/app.js)
- Business name / address: index.html and js/app.js (search `ANSHA INAM PLASTIC INDUSTRY`, `Rahimabad`)
- Menu pages: js/app.js → `const NAV`
- Expense categories: js/app.js → `V.expenses`
- Product pictures: in the app → Settings → Product pictures
- Cards per row: in the app → Settings → Cards per row (or css/style.css → `.pgrid`)
- Colours / gloss: css/style.css → `:root` (light) and `:root[data-theme=dark]`; gold = `--g1`, `--g2`
- The two "handled by" names: js/app.js → `const byf`
- Never put the `sb_secret_...` key in any file.

## Notes
- Cancel / delete asks for the user's password again; every delete leaves a line in the Activity Log.
- PDF: tap PDF → preview → "Save as PDF / Print" → choose "Save as PDF". The file name carries the user name and time.
- Backups: Backup & Log page → Master Excel / JSON, plus the daily GitHub backup (secret `SUPABASE_DB_URL`).

## Update 5 (prices, granule types, production, wallets, QR receipts)
1. Supabase > SQL Editor > run supabase/update5.sql once (safe to run again; old data is kept).
2. GitHub: upload these files, keeping the same folders:
   index.html, receipt.html (new), js/app.js, js/khata2.js (new), js/qrcode.js (new), js/rview.js (new), supabase/update5.sql, README.md
- Dashboard: Cost and Sell price (per Nug and per piece), Edit buttons, daily profit / loss.
- Cost / Sell buttons also on Products & Stock, the product page and Sales.
- Granules page (after Dashboard): many granule types, each with its own KG stock and rate; Production page (Manual / Automatic).
- Payment methods: Cash, Bank, Easypaisa, JazzCash, UPaisa, and "+ Add new wallet" in any Method list or on Cash Flow.
- Receipts page: A4 with 4 receipts per page, each with its own QR code that opens receipt.html (no login) for that exact receipt.
- Purchases page removed from the menu (old purchase data stays in the database).
