const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Read .env.local
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');

const envVars = {};
envContent.split('\n').forEach(line => {
  if (line && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const EMAIL_USER = envVars.EMAIL_USER;
const EMAIL_PASS = envVars.EMAIL_PASS;
const ALERT_EMAIL = envVars.ALERT_RECIPIENT_EMAIL;

console.log('=== EMAIL CONFIGURATION TEST ===\n');
console.log('EMAIL_USER:', EMAIL_USER || 'MISSING');
console.log('EMAIL_PASS:', EMAIL_PASS ? '***' : 'MISSING');
console.log('ALERT_EMAIL:', ALERT_EMAIL || 'MISSING');

if (!EMAIL_USER || !EMAIL_PASS) {
  console.log('\n❌ ERROR: Missing email credentials!');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

console.log('\n=== SENDING TEST EMAIL ===\n');

transporter.sendMail({
  from: EMAIL_USER,
  to: ALERT_EMAIL,
  subject: '🚨 TEST: LifeAlert Emergency System Working!',
  html: `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h1 style="color: red;">🚨 EMERGENCY ALERT TEST</h1>
      <p><strong>Your LifeAlert system is working!</strong></p>
      <p><strong>Location:</strong> Test location</p>
      <p><a href="https://maps.google.com/?q=28.7041,77.1025" style="background-color: red; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        View Location on Google Maps
      </a></p>
      <p style="color: gray; font-size: 12px;">Test time: ${new Date().toISOString()}</p>
    </div>
  `,
})
.then(() => {
  console.log('✅ TEST EMAIL SENT SUCCESSFULLY!');
  console.log('Check your email at:', ALERT_EMAIL);
})
.catch((error) => {
  console.log('❌ EMAIL ERROR:');
  console.log('Message:', error.message);
  
  if (error.message.includes('Invalid login')) {
    console.log('\n⚠️  Invalid email credentials - Check your EMAIL_USER and EMAIL_PASS');
    console.log('Note: For Gmail, use an App Password, not your regular password');
  }
  process.exit(1);
});
