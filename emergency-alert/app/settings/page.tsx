'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [phones, setPhones] = useState('');
  const [emails, setEmails] = useState('');
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push('/login');
        return;
      }
      setUser(data.session.user);
      loadSettings(data.session.user.id);
      setLoading(false);
    };
    checkUser();
  }, []);

  const loadSettings = async (userId: string) => {
    const { data } = await supabase
      .from('user_contacts')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (data) {
      setPhones(data.phones || '');
      setEmails(data.emails || '');
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      await supabase
        .from('user_contacts')
        .upsert({
          user_id: user.id,
          phones,
          emails,
          updated_at: new Date().toISOString(),
        });

      alert('✅ Settings saved!');
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
    setSaving(false);
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen text-white">Loading...</div>;

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>
        <p className="text-lg mb-4">Welcome, {user?.email}!</p>

        <div className="space-y-6">
          <div>
            <label className="block text-lg font-bold mb-2">Emergency Contact Numbers</label>
            <p className="text-sm text-gray-400 mb-2">Enter phone numbers separated by commas (e.g., +919876543210, +918765432109)</p>
            <textarea
              value={phones}
              onChange={(e) => setPhones(e.target.value)}
              placeholder="+919876543210, +918765432109"
              className="w-full px-4 py-2 bg-gray-800 text-white rounded border border-gray-600 h-24"
            />
          </div>

          <div>
            <label className="block text-lg font-bold mb-2">Emergency Contact Emails</label>
            <p className="text-sm text-gray-400 mb-2">Enter emails separated by commas</p>
            <textarea
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              placeholder="mom@gmail.com, dad@gmail.com"
              className="w-full px-4 py-2 bg-gray-800 text-white rounded border border-gray-600 h-24"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded font-bold"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>

          <a href="/" className="block text-center bg-red-600 hover:bg-red-700 text-white py-3 rounded font-bold">
            Go to Emergency Alert
          </a>
        </div>
      </div>
    </main>
  );
}
