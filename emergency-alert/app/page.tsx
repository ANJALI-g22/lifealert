'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
  const [status, setStatus] = useState('');
  const [details, setDetails] = useState('');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push('/login');
        return;
      }
      setUser(data.session.user);
      setLoading(false);
    };
    checkUser();
  }, []);

  const sendEmergency = async () => {
    if (!user) return;
    console.log('BUTTON CLICKED');
    
    if (!navigator.geolocation) {
      setStatus('❌ Geolocation not supported');
      return;
    }

    setStatus('📍 Getting location...');
    setDetails('Requesting location access...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log('✅ Location obtained:', latitude, longitude);
        setDetails(`Lat: ${latitude}, Lng: ${longitude}`);
        setStatus('📤 Sending alert to server...');

        try {
          const res = await fetch('/api/send-alert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              lat: latitude, 
              lng: longitude,
              userId: user.id 
            }),
          });

          const data = await res.json();
          if (res.ok) {
            setStatus('✅ ALERT SENT SUCCESSFULLY!');
            setDetails(`SMS & Email sent to your contacts`);
          } else {
            setStatus('❌ Failed to send');
            setDetails(`Error: ${data.error}`);
          }
        } catch (err: any) {
          setStatus('❌ Network error');
          setDetails(`${err.message}`);
        }
      },
      (error) => {
        setStatus('❌ Location access denied');
        setDetails(`Please allow location access`);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen text-white">Loading...</div>;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black text-white">
      <h1 className="text-4xl font-bold mb-4">LifeAlert Emergency System</h1>
      <p className="text-lg mb-2">{user?.email}</p>
      <p className="text-xl mb-12">Press the button to send an alert</p>

      <button
        onClick={sendEmergency}
        className="w-80 h-80 rounded-full bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-4xl shadow-2xl transition-all flex items-center justify-center"
      >
        SEND EMERGENCY ALERT
      </button>

      {status && (
        <div className="mt-10 text-center">
          <p className="text-2xl font-bold">{status}</p>
          {details && <p className="text-lg text-gray-400 mt-2">{details}</p>}
        </div>
      )}

      <div className="mt-12 space-x-4">
        <a href="/settings" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded inline-block">
          Settings
        </a>
        <button onClick={handleLogout} className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded">
          Logout
        </button>
      </div>
    </main>
  );
}