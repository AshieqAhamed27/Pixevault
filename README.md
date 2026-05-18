# PixelVault — Digital Products Store

A production-ready digital e-commerce store built with Next.js, Razorpay, MongoDB Atlas, and Vercel.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (React) |
| Backend | Next.js API Routes (Node.js) |
| Database | MongoDB Atlas |
| Payments | Razorpay (live keys) |
| Email | Nodemailer + Gmail / SendGrid |
| Hosting | Vercel |

---

## Quick Start

### 1. Clone & install

```bash
git clone <your-repo>
cd pixelvault
npm install
```

### 2. Set up MongoDB Atlas

1. Go to https://cloud.mongodb.com → Create a free cluster
2. Create a database user (username + password)
3. Whitelist IP: Add `0.0.0.0/0` (all IPs) for Vercel compatibility
4. Click "Connect" → "Drivers" → copy the connection string
5. Replace `<password>` in the string with your DB user password

### 3. Set up Gmail App Password (for order emails)

1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification
3. Go to https://myaccount.google.com/apppasswords
4. Create an app password for "Mail"
5. Copy the 16-character password

### 4. Configure environment variables

Copy `.env.example` to `.env.local` and fill in ALL values:

```bash
cp .env.example .env.local
```

Required values:
- `RAZORPAY_KEY_ID` — from https://dashboard.razorpay.com/app/keys (use Live keys)
- `RAZORPAY_KEY_SECRET` — same page
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` — same as KEY_ID (used in browser)
- `MONGODB_URI` — from MongoDB Atlas
- `SMTP_USER` — your Gmail address
- `SMTP_PASS` — your Gmail App Password (16 chars, no spaces)
- `EMAIL_FROM` — e.g. `PixelVault <you@gmail.com>`
- `ADMIN_SECRET` — a random string you choose (protects dashboard + product API)
- `RAZORPAY_WEBHOOK_SECRET` — generate with: `openssl rand -hex 32`
- `NEXT_PUBLIC_SITE_URL` — your Vercel URL once deployed

### 5. Add your products

Edit `scripts/seed-products.js` — replace the sample products with your real ones:

```js
{
  slug: 'my-product-slug',          // URL-friendly identifier
  name: 'My Product Name',
  description: 'Short description shown on card',
  category: 'course',               // course | template | tool | licence
  price: 1999,                      // in ₹ (not paise)
  comparePrice: 2999,               // struck-through original price
  emoji: '🎨',                      // shown on product card
  color: 'teal',                    // teal | amber | rose | slate | mint | plum
  badge: 'New',                     // Hot | New | Sale | null
  features: ['Feature 1', ...],
  downloadUrl: 'https://drive.google.com/...',  // Google Drive / S3 / any URL
  active: true,
  rating: 4.8,
  reviewCount: 124,
}
```

Run the seed:
```bash
MONGODB_URI="your_uri_here" node scripts/seed-products.js
```

### 6. Run locally

```bash
npm run dev
# → http://localhost:3000
```

### 7. Deploy to Vercel

```bash
npm install -g vercel
vercel login
vercel --prod
```

When prompted, add each environment variable from `.env.local` in the Vercel dashboard:
- Go to your project → Settings → Environment Variables
- Add every key from `.env.local`

### 8. Configure Razorpay Webhook

1. Go to https://dashboard.razorpay.com/app/webhooks
2. Add endpoint: `https://your-domain.vercel.app/api/webhook`
3. Select event: `payment.captured`
4. Set Secret to the value of `RAZORPAY_WEBHOOK_SECRET`

This ensures payment is confirmed even if the user closes the browser mid-flow.

---

## API Reference

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/signup` | Create customer account | None |
| POST | `/api/auth/login` | Log in customer account | None |
| POST | `/api/auth/logout` | Log out customer account | Session cookie |
| GET | `/api/auth/me` | Read current customer account | Session cookie |
| GET | `/api/products` | List all active products | None |
| GET | `/api/products?category=course` | Filter by category | None |
| POST | `/api/products` | Add a product | `x-admin-secret` header |
| POST | `/api/seed-products` | Seed/update starter products | `x-admin-secret` header |
| POST | `/api/create-order` | Create Razorpay order | None |
| POST | `/api/verify-payment` | Verify payment signature | None |
| POST | `/api/webhook` | Razorpay webhook receiver | HMAC signature |
| GET | `/api/download` | Download a paid product file | Order download token |
| GET | `/api/orders` | List paid orders | `x-admin-secret` header |

---

## Adding Products via API (no seed script)

```bash
curl -X POST https://your-domain.vercel.app/api/products \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: YOUR_ADMIN_SECRET" \
  -d '{
    "slug": "my-course",
    "name": "My Course",
    "description": "Course description",
    "category": "course",
    "price": 1999,
    "comparePrice": 2999,
    "emoji": "🎓",
    "color": "teal",
    "downloadUrl": "https://drive.google.com/your-link",
    "active": true
  }'
```

---

## Dashboard

Visit `/` → click "Seller Dashboard" → enter your `ADMIN_SECRET`.

Shows:
- Total revenue (real, from MongoDB)
- Paid order count
- Average order value
- Full orders table with customer email, items, and amount

---

## How Payments Work

```
Customer → Clicks Pay
  → POST /api/create-order
    → Razorpay order created (server-side, amount locked in DB)
      → Razorpay Checkout opens in browser
        → Customer pays (UPI / Card / Wallet / EMI)
          → Razorpay calls handler() with payment IDs
            → POST /api/verify-payment
              → HMAC signature verified
                → Order marked paid in MongoDB
                  → Confirmation email sent with download links
                    → Success screen shown
```

Webhook at `/api/webhook` runs the same flow as a backup (handles browser close / network drop).

---

## Security Notes

- Product prices are **never trusted from the client** — always fetched from MongoDB in `/api/create-order`
- Payment signature is **cryptographically verified** before marking any order as paid
- Webhook signature is **verified** before processing
- Admin routes require `ADMIN_SECRET` header
- MongoDB connection string is **server-only** (never exposed to browser)

---

## Customisation

- **Brand name / logo**: Edit `pages/index.js` — search for `PixelVault`
- **GST rate**: Change `0.18` in `create-order.js` and `index.js`
- **Colours**: CSS variables at the top of `index.js`
- **Email template**: Edit `lib/mailer.js`
- **Currency**: Change `INR` in `create-order.js` (Razorpay supports INR only for Indian merchants)
