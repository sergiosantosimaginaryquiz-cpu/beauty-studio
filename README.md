# Beauty Studio Cátia Gonçalves — static web app

Plain **HTML + CSS + JavaScript** (ES modules). No build step, no frameworks, no `npm install` — upload the folder to GitHub and turn on GitHub Pages.

- **Public site**: `index.html`, `trabalhos.html`, `marcacao.html`
- **Admin panel**: `admin.html` (login with Supabase Auth)
- **Backend**: Supabase (database, login, image storage), called directly from the browser. Security is enforced by the database's Row Level Security rules, so the public "anon" key is safe to commit.

Until Supabase is configured, the site runs in **demo mode** with sample data (a small "Modo de demonstração" badge appears), so you can publish and preview it straight away.

---

## 1. Publish on GitHub Pages (5 minutes)

1. Create a new repository on github.com (e.g. `beauty-studio`).
2. Upload **the contents of this folder** (not the folder itself) — drag the files into *Add file → Upload files*, or:
   ```bash
   git init && git add . && git commit -m "Site Beauty Studio"
   git branch -M main
   git remote add origin https://github.com/YOUR-USER/beauty-studio.git
   git push -u origin main
   ```
3. Repository → **Settings → Pages** → *Source: Deploy from a branch* → Branch `main`, folder `/ (root)` → Save.
4. After ~1 minute the site is live at `https://YOUR-USER.github.io/beauty-studio/`.

> The empty `.nojekyll` file must be included — it tells GitHub to serve the files as-is.

**Custom domain** (e.g. `beautystudiocatia.pt`): Settings → Pages → Custom domain, then add the DNS records GitHub shows you. Afterwards replace `SEU-DOMINIO` in `robots.txt` and `sitemap.xml`.

## 2. Connect the real database (Supabase)

1. Create a free project at supabase.com (region: *West EU*).
2. **SQL Editor** → paste and run `supabase/01_schema.sql`, then `supabase/02_seed.sql`.
3. **Authentication → Users → Add user** → Cátia's email + password (tick *Auto confirm user*).
4. Make her an admin (SQL Editor):
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'catia@example.pt';
   ```
5. **Authentication → Sign In / Providers → Email**: turn **off** "Allow new users to sign up".
6. **Authentication → URL Configuration**: set *Site URL* to your GitHub Pages address (needed for password-reset emails).
7. Open `assets/js/config.js` and paste the two values from **Project Settings → API**:
   ```js
   export const SUPABASE_URL = "https://xxxx.supabase.co";
   export const SUPABASE_ANON_KEY = "eyJ…";
   ```
8. Commit and push. The demo badge disappears and everything is now live and editable in `admin.html`.

## 3. First things to fill in (admin → `admin.html`)

- **Definições** — real WhatsApp number (`351912345678`), phone, email, full address with door number and postcode, Google Maps link.
- **Galeria** — drag in the studio's nail photos (several at once). Until then the site shows illustrated placeholders.
- **Conteúdo** — hero photo, Cátia's photo and bio, interior photos.
- **Serviços / Preços** — confirm the real price list (seed prices are examples).
- **Galeria → Instagram** — upload 6 recent posts and paste their links.

---

## Structure

```
index.html  trabalhos.html  marcacao.html  admin.html  404.html
robots.txt  sitemap.xml  .nojekyll
assets/
  css/site.css      design system (glass, clay, polish-bottle details), all breakpoints
  css/admin.css     Apple-style admin UI
  js/config.js      ← your Supabase URL + anon key
  js/lib.js         formatting, opening-hours/slot logic, WhatsApp links, SVG art
  js/db.js          Supabase access + demo data
  js/site.js        shared nav, mobile dock, footer, WhatsApp button, cursor, lightbox
  js/home.js  works.js  booking.js  notfound.js        page scripts
  js/admin.js  admin-ui.js  admin-views1/2/3.js         admin app (hash routes)
  fonts/            self-hosted Manrope + Cormorant Garamond (OFL)
  img/              favicon + social share image
supabase/01_schema.sql  02_seed.sql
```

## How the important parts work

- **Bookings**: visitors can't read or write the `appointments` table. The booking page calls `request_appointment()`, a database function that re-checks opening hours, closures and overlaps before saving; `get_busy_slots()` returns only start times and durations, never customer data. Requests arrive as *Pendente* in **Marcações**.
- **Availability**: weekly hours with multiple intervals per day; holidays, vacations, partial closures and special opening hours. Days with no possible slot are greyed out in the calendar.
- **Promotions** hide themselves automatically once their end date passes (enforced by the database rule as well as the page).
- **WhatsApp**: every WhatsApp click is logged with its context and shown on the dashboard. Messages are generated per service/promotion.
- **Images** upload to the Supabase `media` bucket (admin only, max 8 MB each).
- **Accessibility & motion**: keyboard-navigable lightbox and drag-and-drop (focus the ⋮⋮ handle and use the arrow keys), visible focus rings, ARIA labels, and all animation is disabled for visitors who prefer reduced motion.

## Notes

- Because pages render in the browser, search engines that execute JavaScript (Google does) index the content; the static `<title>`, description, Open Graph tags and share image are in each HTML file.
- To preview locally, any static server works: `python3 -m http.server` then open `http://localhost:8000`. (Opening the HTML file directly with `file://` won't work, because browsers block ES modules there.)
