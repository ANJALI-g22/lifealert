'use client';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
  const handleAlert = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;

      const { data, error } = await supabase.from('alerts').insert([
        {
          latitude,
          longitude,
          created_at: new Date().toISOString(),
          status: 'active'
        }
      ]);

      console.log("Supabase insert response:", { data, error });

      if (error) {
        console.error("Supabase insert error:", error.message);
        alert("Failed to send alert: " + error.message);
      } else {
        alert("Emergency alert sent!");
      }
    });
  };

  return (
    <main style={{ color: 'white' }}>
      <h1>Emergency Alert System</h1>
      <p>Press the button below to send an alert.</p>
      <button
        type="button"
        onClick={handleAlert}
        style={{
          padding: '15px 25px',
          marginTop: '20px',
          background: 'red',
          border: 'none',
          borderRadius: '10px',
          fontSize: '18px',
          cursor: 'pointer',
        }}
      >
        SEND EMERGENCY ALERT
      </button>
    </main>
  );
}