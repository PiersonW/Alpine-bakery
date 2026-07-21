# Alpine Bakery website

Your own storefront: browse products, add to cart, check out with Stripe,
and a private `/admin` page to add/edit products with a photo and price.
You own all of this code outright. The only recurring cost is your
domain (which you already have) — hosting, the database, and image
storage all run on free tiers.

## What's included
- `/` — the public shop
- `/cart` — cart + a pickup-date picker + checkout (hands off to Stripe's
  secure payment page)
- `/admin` — password-protected page to add, edit, delete products, and
  block off dates you're not available for pickup
- Orders themselves live in your Stripe Dashboard (Payments tab) — that's
  where you'll see what sold, the requested pickup date (shown on each
  payment), and get paid out. This site doesn't keep a separate order
  history, which keeps things simple for a small bakery.

## Blocking pickup dates
On `/admin`, under "Pickup availability," click any date on the calendar
to block it — customers won't be able to select it at checkout. Click a
blocked (struck-through) date again to make it available. This is
checked twice: once in the browser so customers never see a blocked
date as pickable, and again on the server at the moment of checkout, in
case you block a date after they've loaded the page.

## One-time setup (about 30–45 minutes)

### 1. Install Node.js
If you don't have it: download the LTS version from https://nodejs.org

### 2. Create your free accounts
You'll need four free accounts. None require a paid plan for a small
bakery's traffic:

1. **Turso** (database) — https://turso.tech → sign up → "Create Database"
   (pick any region close to you) → open the database → copy the
   **Database URL** and create/copy an **Auth Token**.
2. **Cloudinary** (photo storage) — https://cloudinary.com → sign up →
   your **Cloud name** is on the dashboard. Then go to
   Settings → Upload → "Add upload preset" → set **Signing Mode to
   "Unsigned"** → save → copy the preset name.
3. **Stripe** (payments) — https://dashboard.stripe.com/register → once
   in, go to Developers → API keys → copy the **Secret key**. Also
   complete Stripe's business verification (bank account, etc.) so you
   can actually get paid out — this normally takes a day or two, so do
   it early.
4. **Vercel** (hosting) — https://vercel.com/signup → sign up with
   GitHub (easiest — see step 4 below for why).

### 3. Configure your project
In this project folder, copy `.env.example` to `.env` and fill in the
values you just collected:

```
cp .env.example .env
```

Open `.env` and fill in every value. For `ADMIN_PASSWORD`, pick
something you and your wife will remember but a stranger won't guess.
For `ADMIN_SESSION_SECRET`, any long random string works — mash your
keyboard for 40+ characters.

### 4. Run it locally to try it out
```
npm install
npm run dev
```
Visit http://localhost:3000 for the shop, and http://localhost:3000/admin
to log in and add your first products.

(Checkout will work with Stripe's test mode by default if you used a
`sk_test_...` key. Switch to your `sk_live_...` key when you're ready to
accept real payments.)

### 5. Put the code on GitHub
Create a free GitHub account if you don't have one, create a new
repository, and push this project to it. GitHub Desktop
(https://desktop.github.com) is the easiest way if you're not
comfortable with git on the command line.

### 6. Deploy to Vercel
1. In Vercel, click "Add New… → Project" and import the GitHub repo
   you just created.
2. Before deploying, open "Environment Variables" and add every value
   from your `.env` file (same names, same values). Use your **live**
   Stripe secret key here, not the test one, once you're ready to sell
   for real.
3. Click Deploy. Vercel gives you a `xxx.vercel.app` URL to test with.

### 7. Point alpinebakery.org at Vercel
In Vercel: Project → Settings → Domains → add `alpinebakery.org`.
Vercel will show you one or two DNS records to add. Go to wherever your
domain is registered (Squarespace Domains, or wherever you manage DNS
for alpinebakery.org) and add those records. This usually takes effect
within a few hours.

## Day-to-day use
- To add a product: go to `alpinebakery.org/admin`, log in, fill in the
  photo, name, price, and optional description, click "Add product."
- To mark something sold out without deleting it: edit the product and
  uncheck "In stock."
- Orders and payouts: check https://dashboard.stripe.com

## If something breaks
- **Photos won't upload:** double check the Cloudinary cloud name and
  upload preset in your environment variables, and that the preset's
  signing mode is set to "Unsigned."
- **Checkout fails:** check that `STRIPE_SECRET_KEY` is set correctly in
  Vercel's environment variables, and that `NEXT_PUBLIC_BASE_URL`
  matches your real domain.
- **Can't log into /admin:** the password is whatever you set as
  `ADMIN_PASSWORD` in your environment variables — not your Vercel or
  Stripe password.
