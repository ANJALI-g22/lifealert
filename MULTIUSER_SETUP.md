# Multi-User LifeAlert Setup

## Step 1: Create Supabase Tables

Go to: https://supabase.com/dashboard → Your Project → SQL Editor → New Query

Run this SQL:

```sql
-- User Contacts Table
CREATE TABLE IF NOT EXISTS user_contacts (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  phones TEXT,
  emails TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Alerts Table (logs all alerts)
CREATE TABLE IF NOT EXISTS alerts (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Step 2: Enable Email Authentication

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable "Email" provider
3. Click "Save"

## Step 3: Deploy to Vercel

```bash
git add .
git commit -m "Add multi-user LifeAlert system"
git push origin main
```

Then:
1. Go to https://vercel.com/new
2. Import your repo
3. Add environment variables (same as before)
4. Deploy!

## Step 4: Share with Group

Send the Vercel URL to your 5-7 people. They can:

1. **Create Account** - Click "Create Account" on login page
2. **Configure Contacts** - Go to Settings and add their emergency numbers/emails
3. **Send Alert** - Click the big red button when they need help
4. **Their Contacts Get Notified** - SMS/Email sent to their configured contacts

## How It Works

- Each person has their own account
- Each person configures their own emergency contacts
- When they click the button, THEIR contacts get notified (not shared)
- All alerts are logged to the database
- You can see all alerts if needed

---

**That's it!** Your multi-user emergency system is ready to share with 5-7 people! 🚀
