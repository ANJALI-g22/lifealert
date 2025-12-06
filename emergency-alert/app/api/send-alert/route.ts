import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  console.log('===== API CALLED =====');
  
  try {
    const body = await request.json();
    const { lat, lng, userId } = body;
    
    console.log('Location received:', lat, lng);
    console.log('User ID:', userId);

    if (!lat || !lng || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing data' },
        { status: 400 }
      );
    }

    // Get user's emergency contacts from database
    const { data: contacts } = await supabase
      .from('user_contacts')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!contacts) {
      return NextResponse.json(
        { success: false, error: 'No emergency contacts configured' },
        { status: 400 }
      );
    }

    const mapsLink = `https://maps.google.com/?q=${lat},${lng}`;
    const messageBody = `EMERGENCY! Help needed immediately → ${mapsLink}`;

    // Parse contacts
    const phoneNumbers = (contacts.phones || '').split(',').map((p: string) => p.trim()).filter((p: string) => p);
    const emailAddresses = (contacts.emails || '').split(',').map((e: string) => e.trim()).filter((e: string) => e);

    console.log('Sending to phones:', phoneNumbers);
    console.log('Sending to emails:', emailAddresses);

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
      } catch (smsError: any) {
        console.log(`❌ SMS failed for ${phone}:`, smsError.message);
      }
    }

    // Send Email to all addresses
    for (const email of emailAddresses) {
      try {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: '🚨 EMERGENCY ALERT - HELP NEEDED!',
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              <div style="background: red; color: white; padding: 20px; border-radius: 5px;">
                <h1 style="margin: 0;">🚨 EMERGENCY ALERT</h1>
              </div>
              <div style="padding: 20px; background: white; margin-top: 10px;">
                <p><strong>Location:</strong></p>
                <p>Latitude: ${lat}</p>
                <p>Longitude: ${lng}</p>
                <p><a href="${mapsLink}" style="background-color: red; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">📍 VIEW LOCATION</a></p>
              </div>
            </div>
          `,
        });

        console.log(`✅ Email sent to ${email}`);
      } catch (emailError: any) {
        console.log(`❌ Email failed for ${email}:`, emailError.message);
      }
    }

    // Log alert to database
    await supabase.from('alerts').insert([{
      user_id: userId,
      latitude: lat,
      longitude: lng,
      created_at: new Date().toISOString(),
    }]);

    return NextResponse.json({ success: true, message: 'Alerts sent' });
  } catch (error: any) {
    console.log('ERROR:', error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
