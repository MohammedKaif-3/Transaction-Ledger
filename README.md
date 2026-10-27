# Transaction Ledger

A small full-stack ledger app built with JavaScript, Express, MySQL, and React. The backend follows an MVC flow: routes map URLs to controllers, services enforce business rules, and models own SQL queries.

## Requirements

- Node.js 18 or newer
- MySQL 8.0.16 or newer
- npm

## Run locally

1. Create the database and tables:

   ```sh
   mysql -u root -p < backend/database/schema.sql
   ```

2. Configure the API:

   ```sh
   cd backend
   copy .env.example .env
   ```

   Set `DB_USER`, `DB_PASSWORD`, and any other connection values in `backend/.env`.

3. Install and start the API:

   ```sh
   npm install
   npm run dev
   ```

   The API listens on `http://localhost:4000`. `GET /api/health` reports whether the API process is up; starting the server also checks the MySQL connection.

4. In a second terminal, start the React app:

   ```sh
   cd frontend
   npm install
   npm run dev
   ```

   Open `http://localhost:5173`. Vite forwards `/api` requests to the local Express server.

## API

All endpoints are under `/api`. JSON errors use this shape:

```json
{
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "Account does not have sufficient balance for this debit."
  }
}
```

### Accounts

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/accounts` | Create an account with a system-generated zero balance |
| `GET` | `/accounts` | List accounts for the workspace |
| `GET` | `/accounts/:id/balance` | Read an account balance |

Create account body:

```json
{ "name": "Alex Morgan" }
```

### Transactions

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/accounts/:id/transactions` | Post a credit or debit |
| `GET` | `/accounts/:id/transactions` | Read paginated transaction history |

Post body:

```json
{
  "type": "credit",
  "amount": "125.50",
  "description": "Monthly deposit",
  "reference_id": "PAY-2026-001"
}
```

History query parameters: `type=credit|debit` (optional), `page` (default `1`), and `limit` (default `20`, maximum `100`). Results are newest first, then by descending transaction ID.

### Transfers

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/transfers` | Atomically move funds between two different accounts |

Transfer body:

```json
{
  "source_account_id": "1",
  "destination_account_id": "2",
  "amount": "25.00",
  "reference_id": "MOVE-2026-001"
}
```

The response contains a debit ledger entry and a credit ledger entry. Both entries and both balance changes commit together or roll back together.

## Data integrity

- Account balances start at zero; clients cannot supply an initial balance.
- Amounts must be positive and have no more than two decimal places.
- `(account_id, reference_id)` is unique in MySQL. A duplicate returns `409 DUPLICATE_TRANSACTION` without changing the balance.
- The account row is locked while a transaction is posted. The balance change and immutable ledger row are written in one InnoDB transaction.
- Transfers lock both accounts in a consistent order and create both ledger entries within one database transaction.
- There are no API routes for editing or deleting transactions.

## Assumptions

- Account IDs and transaction IDs are generated numeric IDs and are returned as strings by MySQL.
- The API accepts decimal amounts up to two fractional digits, stored as `DECIMAL(15,2)`. It does not convert currencies.
- The UI formats amounts as USD because the assignment does not specify a currency. This is display formatting only; the database stores currency-neutral decimal amounts.
- Duplicate references return `409 Conflict`; the same reference can be reused on a different account.
- Pagination is one-based, defaults to 20 records in the API, and is capped at 100.
- Account listing is included so the React app can select and switch accounts.
- Transfer is included as the assessment's optional bonus. It appears in history as one debit and one credit with the same reference ID.

## Project structure

```text
backend/
  database/schema.sql
  src/
    config/       MySQL connection pool
    controllers/  HTTP request and response handling
    models/       SQL access
    routes/       Express routes
    services/     Validation and ledger rules
    utils/        Shared HTTP errors and money parsing
frontend/
  src/
    components/   Account and transaction forms/navigation
    api.js        API client
    App.jsx       Ledger workspace
```
