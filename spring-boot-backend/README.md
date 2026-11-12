# Ledgr Transaction Service (Spring Boot)

The transaction microservice for Ledgr. The frontend reads and writes transactions through this API (see `store.js` in the project root).

## Structure

- `LedgrApplication.java` — Spring Boot main class
- `entity/Transaction.java` — database entity
- `entity/TransactionType.java` — INCOME / EXPENSE enum
- `repository/TransactionRepository.java` — JPA database access
- `service/TransactionService.java` — business logic
- `controller/TransactionController.java` — REST API endpoints
- `config/CorsConfig.java` — allows only the Live Server origins
- `config/SampleDataLoader.java` — inserts the sample entries when the table is empty
- `config/ApiExceptionHandler.java` — JSON error messages (400 / 404)
- `application.properties` — MySQL and server configuration

## Requirements

- Java 17+
- Maven 3.9+
- MySQL 8+

## Run

1. Create the database by running `database.sql` in MySQL.
2. Set the `DB_PASSWORD` environment variable to your MySQL password.
3. Open this `spring-boot-backend` folder in VS Code.
4. Run:

```bash
mvn spring-boot:run
```

Service URL: `http://localhost:8081`

Without MySQL: `mvn spring-boot:run -Dspring-boot.run.profiles=h2` (in-memory, H2 console at `/h2-console`, JDBC URL `jdbc:h2:mem:ledgrdb`, user `sa`).

## API

- `GET /api/transactions` — all transactions
- `GET /api/transactions/{id}` — one transaction
- `GET /api/transactions?category=Food` — filter by category
- `GET /api/transactions?search=salary` — search by description
- `POST /api/transactions` — add transaction
- `PUT /api/transactions/{id}` — edit transaction
- `DELETE /api/transactions/{id}` — delete transaction

Example POST body:

```json
{
  "description": "Monthly Salary",
  "type": "INCOME",
  "category": "Salary",
  "amount": 45000,
  "date": "2026-10-07"
}
```

The frontend is connected to this service: add, edit, delete and listing all go through the API.
