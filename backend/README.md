# Backend Service

Spring Boot backend for the Expense Reimbursement System.

## Overview

This service provides:

- JWT-based authentication and authorization
- Role-based access control for employee, manager, finance, and admin flows
- Expense submission and lifecycle management
- Multi-step approval workflows
- Notification APIs
- OCR and currency utility endpoints

## Tech Stack

- Java 17
- Spring Boot 3.5.13
- Spring Security
- Spring Data JPA (Hibernate)
- PostgreSQL (runtime)
- Maven Wrapper
- springdoc OpenAPI

## Project Structure

```text
backend/
  src/main/java/com/expense/reimbursement/
    config/
    controller/
    dto/
    entity/
    exception/
    repository/
    security/
    service/
  src/main/resources/application.properties
  src/test/resources/application.properties
  pom.xml
  mvnw
  mvnw.cmd
```

## Prerequisites

- Java 17
- PostgreSQL running locally (default expected: localhost:5432)

## Environment Variables

The backend uses these variables from application properties:

- DB_URL: JDBC datasource URL (example: jdbc:postgresql://localhost:5432/expense_db)
- DB_USERNAME: database username
- DB_PASSWORD: database password
- APP_JWT_SECRET: JWT signing secret

The backend auto-loads environment variables from `.env` in either:

- `backend/.env`
- repository root `.env`

Recommended setup (used by the current Neon connection):

```env
DB_URL=jdbc:postgresql://<your-neon-host>/<your-db>?sslmode=require&channelBinding=require
DB_USERNAME=<your-neon-user>
DB_PASSWORD=<your-neon-password>
APP_JWT_SECRET=<your-long-random-secret>
```

Defaults exist in configuration for local development, but use real secure values in local/dev/prod.

Example (Git Bash):

```bash
export DB_USERNAME=postgres
export DB_PASSWORD=your_password
export DB_URL=jdbc:postgresql://localhost:5432/expense_db
export APP_JWT_SECRET=your_very_long_random_secret
```

Example (Windows PowerShell):

```powershell
$env:DB_USERNAME="postgres"
$env:DB_PASSWORD="your_password"
$env:DB_URL="jdbc:postgresql://localhost:5432/expense_db"
$env:APP_JWT_SECRET="your_very_long_random_secret"
```

Neon tip:

- Keep `sslmode=require` in `DB_URL`.
- Use JDBC format (`jdbc:postgresql://...`) for `DB_URL`.
- Prefer setting username/password via `DB_USERNAME` and `DB_PASSWORD` instead of embedding them in the URL.

## Database Defaults

Main datasource URL:

```text
jdbc:postgresql://localhost:5432/expense_db
```

JPA behavior:

- ddl-auto: update
- show-sql: true
- open-in-view: false

## Run Locally

From the backend directory:

- Using `.env` (recommended):

```bash
./mvnw spring-boot:run
```

- Git Bash / Linux / macOS:

```bash
./mvnw spring-boot:run
```

- Windows CMD or PowerShell:

```bash
mvnw.cmd spring-boot:run
```

Backend default URL:

- <http://localhost:8080>

## Build and Test

Build jar:

```bash
./mvnw clean package -DskipTests
```

Run tests:

```bash
./mvnw test
```

## API and Docs

Base path:

- /api

Swagger UI:

- <http://localhost:8080/swagger-ui/index.html>

OpenAPI docs:

- <http://localhost:8080/v3/api-docs>

## Endpoint Groups

- /api/auth
  - signup, login, me
- /api/users
  - create user, list users, get user, update role
- /api/rules
  - create/list/update approval rules
- /api/expenses
  - create, list mine, get by id, update, submit, pending, history, upload receipt
- /api/approvals
  - approve, reject, progress, pending, get by expense id
- /api/notifications
  - list, mark read
- /api/ocr
  - scan
- /api/currency
  - convert

## Security Notes

- Public endpoints:
  - /api/auth/signup
  - /api/auth/login
  - /swagger-ui/**
  - /v3/api-docs/**
- All other /api/** endpoints require authentication.

Rate limiting:

- API rate limiting filter is enabled for `/api/**` except `/api/auth/**`.
- Current limit in code: 120 requests per minute per client IP.

## Notes for Contributors

- Keep DTO changes backward-compatible when possible.
- Prefer validating request payloads at DTO/controller level.
- If endpoint behavior changes, update Postman collection in postman/ and docs accordingly.
