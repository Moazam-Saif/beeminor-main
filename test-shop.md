# Shop Integration Test

## Test Flower Purchase Flow

### 1. Get Initial State
```
GET http://localhost:3001/api/game/6930a425b2468df4e5b54e4e
```
Check initial:
- `flowers`
- `tickets`
- `hasPendingFunds`

### 2. Mark Funds as Pending (user sent payment)
```
POST http://localhost:3001/api/game/6930a425b2468df4e5b54e4e/set-pending-funds
Body:
{
  "hasPending": true
}
```
Expected: `hasPendingFunds: true`

### 3. Purchase Flowers (50,000 flowers for $6)
```
POST http://localhost:3001/api/game/6930a425b2468df4e5b54e4e/purchase-flowers
Body:
{
  "amount": 50000,
  "priceUSD": 6,
  "paymentMethod": "crypto",
  "transactionId": "test_txn_001"
}
```
Expected:
- `flowers` increases by 50,000
- `tickets` increases by 0 (6/10 = 0 tickets)
- `hasPendingFunds` becomes false
- New transaction in `transactions` array

### 4. Purchase Larger Pack (100,000 flowers for $10)
First set pending funds again:
```
POST http://localhost:3001/api/game/6930a425b2468df4e5b54e4e/set-pending-funds
Body:
{
  "hasPending": true
}
```

Then purchase:
```
POST http://localhost:3001/api/game/6930a425b2468df4e5b54e4e/purchase-flowers
Body:
{
  "amount": 100000,
  "priceUSD": 10,
  "paymentMethod": "crypto",
  "transactionId": "test_txn_002"
}
```
Expected:
- `flowers` increases by 100,000
- `tickets` increases by 1 (10/10 = 1 ticket)
- `hasPendingFunds` becomes false

### 5. Purchase Big Pack (500,000 flowers for $50)
First set pending funds:
```
POST http://localhost:3001/api/game/6930a425b2468df4e5b54e4e/set-pending-funds
Body:
{
  "hasPending": true
}
```

Then purchase:
```
POST http://localhost:3001/api/game/6930a425b2468df4e5b54e4e/purchase-flowers
Body:
{
  "amount": 500000,
  "priceUSD": 50,
  "paymentMethod": "crypto",
  "transactionId": "test_txn_003"
}
```
Expected:
- `flowers` increases by 500,000
- `tickets` increases by 5 (50/10 = 5 tickets)
- `hasPendingFunds` becomes false

### 6. Verify Final State
```
GET http://localhost:3001/api/game/6930a425b2468df4e5b54e4e
```
Check:
- Total flowers increased by 650,000
- Total tickets increased by 6
- `hasPendingFunds` is false
- `transactions` array has 3 new entries

## Tickets Calculation
- $1-9: 0 tickets
- $10-19: 1 ticket
- $20-29: 2 tickets
- $30-39: 3 tickets
- etc. (1 ticket per $10 spent)
