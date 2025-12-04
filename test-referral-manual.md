# Manual Referral System Test

## Setup: Create Two Test Users

### 1. Register Sponsor User (if not exists)
```
POST http://localhost:3001/api/auth/register
Body:
{
  "email": "sponsor@test.com",
  "password": "password123"
}
```
Save the `user.id` and `user.referralCode` from response.

### 2. Register Referred User
```
POST http://localhost:3001/api/auth/register
Body:
{
  "email": "referred@test.com",
  "password": "password123",
  "sponsorCode": "PASTE_SPONSOR_REFERRAL_CODE_HERE"
}
```
Save the `user.id` from response.

## Test Sequence

### 3. Link Referral (creates entry in sponsor's referrals array)
```
POST http://localhost:3001/api/game/REFERRED_USER_ID/link-referral
```
Expected: `"linked": true`, sponsor's `invitedFriends` increases

### 4. Add Flowers to Referred User
```
POST http://localhost:3001/api/game/REFERRED_USER_ID/add-test-resources
Body:
{
  "flowers": 5000
}
```

### 5. Referred User Buys a Bee (costs 1000 flowers)
```
POST http://localhost:3001/api/game/REFERRED_USER_ID/buy-bee
Body:
{
  "beeTypeId": "worker"
}
```

### 6. Process Referral Bonus (sponsor gets 10% of 1000 = 100 flowers)
```
POST http://localhost:3001/api/game/REFERRED_USER_ID/process-referral
Body:
{
  "purchaseAmount": 1000,
  "purchaseType": "bee_purchase"
}
```
Expected: `"bonusAwarded": true`, sponsor receives 100 flowers

### 7. Verify Sponsor Received Bonus
```
GET http://localhost:3001/api/game/SPONSOR_USER_ID
```
Check:
- `flowers` increased by 100
- `totalReferralEarnings` = 100
- `invitedFriends` = 1
- `referrals` array has one entry with `earnings: 100`

## OR: Use Your Existing User (Quick Test)

If you want to test with your existing user `6930a425b2468df4e5b54e4e`:

### 1. Get Your Referral Code
```
GET http://localhost:3001/api/users/6930a425b2468df4e5b54e4e
```

### 2. Register a New User with YOUR Code
```
POST http://localhost:3001/api/auth/register
Body:
{
  "email": "newreferreduser@test.com",
  "password": "password123",
  "sponsorCode": "YOUR_REFERRAL_CODE"
}
```

### 3. Then follow steps 3-7 above
