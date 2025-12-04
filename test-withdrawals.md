# Withdrawal & Transaction System Test

## Test Withdrawal Flow

### 1. Get Initial State
```
GET http://localhost:3001/api/game/6930a425b2468df4e5b54e4e
```
Check initial `flowers` balance.

### 2. Create Withdrawal Request
```
POST http://localhost:3001/api/transactions/withdraw
Body:
{
  "userId": "6930a425b2468df4e5b54e4e",
  "amount": 50000,
  "currency": "USD",
  "cryptoAddress": "0x1234567890abcdef"
}
```
Expected:
- Success response with transaction ID
- `remainingFlowers` reduced by 50,000
- Transaction status: `pending`

### 3. Verify Flowers Deducted
```
GET http://localhost:3001/api/game/6930a425b2468df4e5b54e4e
```
Confirm flowers reduced immediately.

### 4. View User Transactions
```
GET http://localhost:3001/api/transactions/6930a425b2468df4e5b54e4e
```
Should show the withdrawal request with status `pending`.

### 5. Admin: View All Pending Transactions
```
GET http://localhost:3001/api/transactions/pending/all
```
Should show all pending withdrawals across all users.

### 6. Admin: Approve Withdrawal
```
PUT http://localhost:3001/api/transactions/{transaction_id}/status
Body:
{
  "status": "completed",
  "adminNotes": "Payment sent via crypto"
}
```
Expected:
- Transaction status changes to `completed`
- `processedAt` timestamp set
- Flowers remain deducted

### 7. Admin: Reject Withdrawal (Test Refund)
Create another withdrawal first:
```
POST http://localhost:3001/api/transactions/withdraw
Body:
{
  "userId": "6930a425b2468df4e5b54e4e",
  "amount": 10000,
  "currency": "USD",
  "cryptoAddress": "0x1234567890abcdef"
}
```

Then reject it:
```
PUT http://localhost:3001/api/transactions/{transaction_id}/status
Body:
{
  "status": "cancelled",
  "adminNotes": "Invalid address provided"
}
```
Expected:
- Transaction status changes to `cancelled`
- Flowers refunded to user's account
- User gets 10,000 flowers back

### 8. Verify Refund
```
GET http://localhost:3001/api/game/6930a425b2468df4e5b54e4e
```
Confirm flowers increased by the refunded amount.

### 9. Test Insufficient Balance
Try to withdraw more than available:
```
POST http://localhost:3001/api/transactions/withdraw
Body:
{
  "userId": "6930a425b2468df4e5b54e4e",
  "amount": 99999999,
  "currency": "USD",
  "cryptoAddress": "0x1234567890abcdef"
}
```
Expected:
- Error response: "Insufficient flowers"
- Shows current balance and required amount
- No transaction created

## Transaction Lifecycle

1. **Pending**: User creates withdrawal, flowers deducted immediately
2. **Completed**: Admin approves, payment sent (flowers stay deducted)
3. **Cancelled/Failed**: Admin rejects, flowers refunded to user

## Notes

- Flowers are deducted immediately when withdrawal is requested
- If withdrawal is cancelled/failed, flowers are refunded
- If withdrawal is completed, flowers remain deducted (user got paid)
- Users can view their transaction history
- Admins can view all pending transactions and update status
