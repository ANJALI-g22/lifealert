# LifeAlert - Setup & Customization Guide

## 1. ADD MORE PHONE NUMBERS & EMAILS

### Step 1: Update `.env.local`
Replace the single phone/email with multiple contacts:

```env
# Multiple Emergency Contacts (comma-separated)
ALERT_RECIPIENT_EMAILS=patnianjali22@gmail.com,mom@gmail.com,dad@gmail.com,brother@gmail.com
ALERT_RECIPIENT_PHONES=+916378171616,+919876543210,+911234567890,+919999999999
```

### Step 2: Update the API Route
Update `/app/api/send-alert/route.ts` to send to all numbers:

```typescript
// Parse multiple phone numbers
const phoneNumbers = (process.env.ALERT_RECIPIENT_PHONES || '').split(',').map(p => p.trim());
const emailAddresses = (process.env.ALERT_RECIPIENT_EMAILS || '').split(',').map(e => e.trim());

// Send SMS to all numbers
for (const phone of phoneNumbers) {
  try {
    const Twilio = require('twilio');
    const client = Twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
    await client.messages.create({
      body: messageBody,
      from: process.env.TWILIO_PHONE,
      to: phone,
    });
    console.log(`✅ SMS sent to ${phone}`);
  } catch (e: any) {
    console.log(`❌ SMS failed for ${phone}:`, e.message);
  }
}

// Send Email to all addresses
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

for (const email of emailAddresses) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: '🚨 EMERGENCY ALERT - HELP NEEDED!',
      html: `<h1 style="color:red;">EMERGENCY ALERT</h1><p>Location: <a href="${mapsLink}">${mapsLink}</a></p>`,
    });
    console.log(`✅ Email sent to ${email}`);
  } catch (e: any) {
    console.log(`❌ Email failed for ${email}:`, e.message);
  }
}
```

---

## 2. ADD A DATABASE TO LOG ALERTS

You already have **Supabase** configured! Here's how to use it:

### Step 1: Create a Table in Supabase
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** → **New Query**
4. Run this SQL:

```sql
CREATE TABLE alerts (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP DEFAULT NOW(),
  user_email TEXT,
  status TEXT DEFAULT 'active',
  resolved_at TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX idx_alerts_created_at ON alerts(created_at DESC);
CREATE INDEX idx_alerts_user_email ON alerts(user_email);
```

### Step 2: Update API to Log to Database
Add this to your `/app/api/send-alert/route.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// After sending SMS/Email, add this:
try {
  await supabase.from('alerts').insert([{
    latitude: lat,
    longitude: lng,
    user_email: process.env.EMAIL_USER,
    status: 'active'
  }]);
  console.log('✅ Alert logged to database');
} catch (dbError: any) {
  console.log('❌ Database error:', dbError.message);
}
```

### Step 3: Create a Dashboard to View Alerts
Create `/app/alerts/page.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AlertsHistory() {
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    const fetchAlerts = async () => {
      const { data } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false });
      setAlerts(data || []);
    };
    fetchAlerts();
  }, []);

  return (
    <main style={{ padding: '20px', color: 'white' }}>
      <h1>Alert History</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid white' }}>
            <th style={{ padding: '10px', textAlign: 'left' }}>Time</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Location</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {alerts.map((alert) => (
            <tr key={alert.id} style={{ borderBottom: '1px solid gray' }}>
              <td style={{ padding: '10px' }}>{new Date(alert.created_at).toLocaleString()}</td>
              <td style={{ padding: '10px' }}>
                <a href={`https://maps.google.com/?q=${alert.latitude},${alert.longitude}`} target="_blank">
                  {alert.latitude.toFixed(4)}, {alert.longitude.toFixed(4)}
                </a>
              </td>
              <td style={{ padding: '10px' }}>{alert.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
```

---

## 3. SHARE WITH OTHER USERS

### Option A: Deploy to Vercel (Easiest)

1. **Push to GitHub:**
```bash
git add .
git commit -m "Add LifeAlert emergency system"
git push origin main
```

2. **Deploy to Vercel:**
   - Go to https://vercel.com/new
   - Connect your GitHub repo
   - Set Environment Variables (copy from `.env.local`)
   - Click Deploy!
   - Share the URL with others

### Option B: Deploy to Heroku

1. Create `Procfile`:
```
web: npm start
```

2. Deploy:
```bash
heroku create your-app-name
git push heroku main
```

3. Set environment variables:
```bash
heroku config:set TWILIO_SID=xxx
heroku config:set EMAIL_USER=xxx
# ... set all other vars
```

### Option C: Share Locally (For Testing)

1. **Make it accessible on your network:**
   - Update `next.config.ts`:
   ```typescript
   export default {
     server: {
       host: '0.0.0.0',
       port: 3000,
     }
   };
   ```

2. **Get your IP:**
   ```bash
   ipconfig getifaddr en0  # Mac
   hostname -I             # Linux
   ```

3. **Share URL:** `http://YOUR_IP:3000`

---

## QUICK SUMMARY

✅ **Multiple Contacts:** Add phone/email to `.env.local` and loop through them in API  
✅ **Database:** Use Supabase (already set up!) to log all alerts  
✅ **Share:** Deploy to Vercel for easy sharing  

Would you like me to implement the multiple contacts feature for you?
