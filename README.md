# Ledgr — Personal Expense Tracker

Ledgr is a vanilla JS + React frontend backed by two Spring Boot microservices:

```
React UI  →  REST API  →  Transaction Service (8081)  →  MySQL ledgr_db
          →  REST API  →  User Service        (8082)  →  MySQL ledgr_users
```

| Folder | What it is | Port |
|---|---|---|
| `spring-boot-backend/` | Transaction Service: transactions CRUD | 8081 |
| `user-service/` | User Service: register, login, BCrypt password hashing | 8082 |
| `index.html`, `app.js`, `react-app.jsx`, `store.js`, `config.js`, `style.css` | Frontend (VS Code Live Server, port 5500) | 5500 |

## Run everything

1. **MySQL**: run `spring-boot-backend/database.sql` and `user-service/database.sql`.
2. Set the `DB_PASSWORD` environment variable in the terminals used to start the services; the MySQL password is not stored in the repository.
3. Start each service in its own terminal:
   ```bash
   cd spring-boot-backend && mvn spring-boot:run
   cd user-service        && mvn spring-boot:run
   ```
   No MySQL handy? Add `-Dspring-boot.run.profiles=h2` to use an in-memory database (data is lost on restart).
4. Open this folder in VS Code, right-click `index.html` → **Open with Live Server** (port 5500).
5. Register an account, log in, and use Ledgr as before.

The Transaction Service inserts the 10 sample entries on first start (only if the table is empty).

## Important
- Internet is required: React, ReactDOM, Babel and Google Fonts load from CDNs.
- The frontend must be served on `localhost:5500` or `127.0.0.1:5500`; the services only accept those origins (CORS). To use another origin, change `ledgr.cors.allowed-origins` in both `application.properties` files.
- Service URLs for the frontend are in `config.js`.
- Login verifies credentials and remembers the signed-in name in `localStorage` (`ledgr_user`). It does **not** issue a session token, and transactions are not yet per-user.
- Do not open `react-app.jsx` directly; run the project through `index.html` / Live Server.

## Main Features
Login/Register, Dashboard, Transactions, Add Entry, category filters, search, sorting, financial analytics, edit, delete, validation and toast notifications.
