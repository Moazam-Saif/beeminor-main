const http = require('http');

const sponsorUserId = '6930a425b2468df4e5b54e4e'; // Your user (the sponsor)
const baseUrl = 'http://localhost:3001/api';

// Helper function to make HTTP requests
function makeRequest(url, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function testReferralSystem() {
  try {
    console.log('=== REFERRAL SYSTEM TEST ===\n');

    // Step 1: Get sponsor's info (your user)
    console.log('Step 1: Fetching sponsor (your) user info...');
    const sponsorUserData = await makeRequest(`${baseUrl}/users/${sponsorUserId}`);
    if (!sponsorUserData.success) {
      console.error('Failed to get sponsor user:', sponsorUserData);
      return;
    }
    const sponsorReferralCode = sponsorUserData.user.referralCode;
    console.log('Sponsor referral code:', sponsorReferralCode);

    // Step 2: Get sponsor's initial game state
    console.log('\nStep 2: Fetching sponsor initial game state...');
    const initialData = await makeRequest(`${baseUrl}/game/${sponsorUserId}`);
    console.log('Initial flowers:', initialData.gameState.flowers);
    console.log('Initial invitedFriends:', initialData.gameState.invitedFriends);
    console.log('Initial totalReferralEarnings:', initialData.gameState.totalReferralEarnings);
    console.log('Initial referrals count:', initialData.gameState.referrals.length);

    // Step 3: Create a new "referred" user with sponsor code
    console.log('\nStep 3: Creating a referred user...');
    const referredEmail = `referred_user_${Date.now()}@test.com`;
    const registerData = await makeRequest(`${baseUrl}/auth/register`, 'POST', {
      email: referredEmail,
      password: 'password123',
      sponsorCode: sponsorReferralCode
    });
    console.log('Register result:', registerData.success ? 'Success' : 'Failed');
    if (!registerData.success) {
      console.error('Registration failed:', registerData);
      return;
    }
    const referredUserId = registerData.user.id;
    console.log('Referred user ID:', referredUserId);

    // Step 4: Link the referral (this should increment invitedFriends)
    console.log('\nStep 4: Linking referral...');
    const linkData = await makeRequest(`${baseUrl}/game/${referredUserId}/link-referral`, 'POST');
    console.log('Link result:', JSON.stringify(linkData, null, 2));

    // Step 5: Give the referred user some flowers to make a purchase
    console.log('\nStep 5: Adding flowers to referred user for testing...');
    await makeRequest(`${baseUrl}/game/${referredUserId}/add-test-resources`, 'POST', {
      flowers: 5000
    });

    // Step 6: Referred user makes a purchase (1000 flowers)
    console.log('\nStep 6: Referred user making a bee purchase (1000 flowers)...');
    const purchaseData = await makeRequest(`${baseUrl}/game/${referredUserId}/buy-bee`, 'POST', {
      beeTypeId: 'worker'
    });
    console.log('Purchase result:', purchaseData.success ? 'Success' : 'Failed');

    // Step 7: Process referral bonus (10% of 1000 = 100 flowers to sponsor)
    console.log('\nStep 7: Processing referral bonus...');
    const processData = await makeRequest(`${baseUrl}/game/${referredUserId}/process-referral`, 'POST', {
      purchaseAmount: 1000,
      purchaseType: 'bee_purchase'
    });
    console.log('Process result:', JSON.stringify(processData, null, 2));

    // Step 8: Verify sponsor's final state
    console.log('\nStep 8: Verifying sponsor final game state...');
    const finalData = await makeRequest(`${baseUrl}/game/${sponsorUserId}`);
    console.log('Final flowers:', finalData.gameState.flowers);
    console.log('Final invitedFriends:', finalData.gameState.invitedFriends);
    console.log('Final totalReferralEarnings:', finalData.gameState.totalReferralEarnings);
    console.log('Final referrals:', JSON.stringify(finalData.gameState.referrals, null, 2));

    // Calculate expected values
    const expectedBonus = Math.floor(1000 * 0.1); // 10% of purchase
    const expectedFlowers = initialData.gameState.flowers + expectedBonus;
    
    console.log('\n=== VERIFICATION ===');
    console.log('Expected bonus:', expectedBonus);
    console.log('Expected flowers:', expectedFlowers);
    console.log('Actual flowers:', finalData.gameState.flowers);
    console.log('Match:', expectedFlowers === finalData.gameState.flowers ? '✅' : '❌');

    console.log('\n✅ Referral system test completed!');
  } catch (error) {
    console.error('❌ Error testing referral system:', error.message);
    console.error('Full error:', error);
  }
}

testReferralSystem();
