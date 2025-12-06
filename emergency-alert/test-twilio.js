const Twilio = require('twilio');
const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');

const envVars = {};
envContent.split('\n').forEach(line => {
  if (line && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const accountSid = envVars.TWILIO_SID;
const authToken = envVars.TWILIO_TOKEN;
const twilioPhone = envVars.TWILIO_PHONE;
const myPhone = envVars.MY_PHONE;

console.log('=== TWILIO CREDENTIALS TEST ===\n');
console.log('TWILIO_SID:', accountSid ? accountSid.substring(0, 5) + '...' : 'MISSING');
console.log('TWILIO_TOKEN:', authToken ? authToken.substring(0, 5) + '...' : 'MISSING');
console.log('TWILIO_PHONE:', twilioPhone || 'MISSING');
console.log('MY_PHONE:', myPhone || 'MISSING');

if (!accountSid || !authToken) {
  console.log('\n❌ ERROR: Missing Twilio credentials!');
  process.exit(1);
}

const client = Twilio(accountSid, authToken);

console.log('\n=== ATTEMPTING TO VERIFY CREDENTIALS ===\n');

client.api.accounts(accountSid).fetch()
  .then((account) => {
    console.log('✅ Credentials are VALID!');
    console.log('Account Status:', account.status);
    console.log('Account Name:', account.friendlyName);
    console.log('Account Type:', account.type);
    console.log('\n=== SENDING TEST SMS ===\n');

    // Send test SMS
    return client.messages.create({
      body: 'TEST: LifeAlert SMS is working! ✓',
      from: twilioPhone,
      to: myPhone,
    });
  })
  .then((message) => {
    console.log('✅ SMS SENT SUCCESSFULLY!');
    console.log('Message SID:', message.sid);
    console.log('Status:', message.status);
    console.log('To:', message.to);
    console.log('\nYou should receive an SMS shortly!');
  })
  .catch((error) => {
    console.log('❌ ERROR:');
    console.log('Code:', error.code);
    console.log('Message:', error.message);
    
    if (error.code === 20003) {
      console.log('\n⚠️  Invalid credentials - Check your TWILIO_SID and TWILIO_TOKEN');
    } else if (error.code === 21614) {
      console.log('\n⚠️  Invalid phone number - Check TWILIO_PHONE or MY_PHONE format');
    } else if (error.code === 21211) {
      console.log('\n⚠️  Invalid phone number format');
    }
    process.exit(1);
  });
