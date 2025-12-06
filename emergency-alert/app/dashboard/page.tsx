'use client';

import { useState } from 'react';

export default function Home() {
  const [status, setStatus] = useState('');
  const [details, setDetails] = useState('');

  const sendEmergency = async () => {
    console.log('BUTTON CLICKED');
    
    if (!navigator.geolocation) {
      setStatus('❌ Geolocation not supported');
      console.log('Geolocation not supported');
      return;
    }

    setStatus('📍 Getting location...');
    setDetails('Requesting location access...');
    console.log('Requesting location...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log('✅ Location obtained:', latitude, longitude);
        setDetails(`Lat: ${latitude}, Lng: ${longitude}`);
        setStatus('📤 Sending alert to server...');

        try {
          console.log('Fetching /api/send-alert with:', { lat: latitude, lng: longitude });
          
          const res = await fetch('/api/send-alert', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              lat: latitude, 
              lng: longitude 
            }),
          });

          console.log('Response status:', res.status);
          const data = await res.json();
          console.log('Response data:', data);

          if (res.ok) {
            setStatus('✅ ALERT SENT SUCCESSFULLY!');
            setDetails(`Email and SMS sent with location`);
            console.log('SUCCESS - Alert sent');
          } else {
            setStatus('❌ Failed to send');
            setDetails(`Server error: ${data.error}`);
            console.error('API returned error:', data);
          }
        } catch (err: any) {
          console.error('FETCH ERROR:', err);
          setStatus('❌ Network error');
          setDetails(`${err.message}`);
        }
      },
      (error) => {
        console.error('❌ Geolocation error:', error);
        setStatus('❌ Location access denied');
        setDetails(`Please allow location access: ${error.message}`);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black text-white">
      <h1 className="text-4xl font-bold mb-8">LifeAlert Emergency System</h1>
      <p className="text-xl mb-12">Press the button to send an alert</p>

      <button
        onClick={sendEmergency}
        className="w-80 h-80 rounded-full bg-red-600 hover:bg-red-700 active:scale-95 
                   text-white font-bold text-4xl shadow-2xl transition-all 
                   flex items-center justify-center"
      >
        SEND EMERGENCY ALERT
      </button>

      {status && (
        <div className="mt-10 text-center">
          <p className="text-2xl font-bold">{status}</p>
          {details && <p className="text-lg text-gray-400 mt-2">{details}</p>}
        </div>
      )}
    </main>
  );
}
