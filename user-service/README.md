# Ledgr User Service (Spring Boot)

Handles registration and login for Ledgr. Passwords are hashed with BCrypt and never returned by the API.

## Structure (`com.ledgr.userservice`)
- `User` — entity (table `users`; unique email)
- `UserRepository` — JPA access, `findByEmail`
- `UserService` — registration (validation, duplicate-email check, BCrypt) and login
- `UserController` — REST endpoints
- `UserResponse` — id, name, email only (no password)
- `PasswordConfig` — `BCryptPasswordEncoder` bean
- `CorsConfig`, `ApiExceptionHandler`

## Run
1. Run `database.sql` in MySQL.
2. Set the `DB_PASSWORD` environment variable to your MySQL password.
3. `mvn spring-boot:run` → `http://localhost:8082`
   (No MySQL: `mvn spring-boot:run -Dspring-boot.run.profiles=h2`.)

## API
| Method | Endpoint | Purpose | Success | Errors |
|---|---|---|---|---|
| GET | `/api/users` | List users (no passwords) | 200 | |
| POST | `/api/users` | Register `{name,email,password}` | 201 | 400 invalid input, 409 email taken |
| POST | `/api/users/login` | Verify `{email,password}` | 200 user | 400 missing fields, 401 wrong credentials |

Passwords must be 6–72 characters (BCrypt limit). Emails are stored lower-case.

Test with PowerShell:
```powershell
$body = @{ name="Priya Sharma"; email="priya@example.com"; password="DemoPass456" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8082/api/users" -Method Post -ContentType "application/json" -Body $body
```
Check MySQL: `USE ledgr_users; SELECT id, name, email, password FROM users;` — the password column starts with `$2a$`.

Login does not issue a token or session yet.
