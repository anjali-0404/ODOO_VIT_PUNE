# Expense Reimbursement System

## Problem Statement
Organizations need a reliable way to submit, review, and approve employee expense claims with proper controls. Manual workflows are slow, error-prone, and hard to audit. This project provides a secure, role-based reimbursement platform with API-first backend architecture and a frontend-ready repository structure.

## Key Features
- JWT authentication and role-based authorization
- Multi-level approval workflow with step sequence
- Expense lifecycle management: DRAFT -> PENDING -> APPROVED/REJECTED
- Approval progress tracking with rule evaluation insights
- Expense history and audit trail
- Notification inbox and mark-as-read support
- OCR receipt scan API (mocked for demo)
- Currency conversion API with fallback handling
- Pagination and filtering support for frontend integration

## Tech Stack
- Java 17
- Spring Boot 3
- Spring Security (JWT)
- Spring Data JPA (Hibernate)
- PostgreSQL
- Maven
- Swagger/OpenAPI (springdoc)

## Repository Structure
```text
backend/   -> Spring Boot backend service
frontend/  -> Frontend placeholder (React planned)
postman/   -> API collection for testing/demo
README.md  -> Project overview and setup guide
```

Backend package structure:
```text
backend/src/main/java/com/expense/reimbursement/
  config/
  controller/
  dto/
  entity/
  exception/
  repository/
  security/
  service/
backend/src/main/resources/
```

## API Overview
Base path: /api

Main groups:
- Auth: /api/auth/*
- Users: /api/users/*
- Rules: /api/rules/*
- Expenses: /api/expenses/*
- Approvals: /api/approvals/*
- Notifications: /api/notifications/*
- Utility: /api/ocr/*, /api/currency/*

Swagger UI:
- http://localhost:8080/swagger-ui/index.html

## Setup Instructions
### 1. Clone repository
```bash
git clone https://github.com/anjali-0404/ODOO_VIT_PUNE.git
cd ODOO_VIT_PUNE/reimbursement
```

### 2. Move into backend service
```bash
cd backend
```

### 3. Configure environment variables
Set these before running:
- DB_USERNAME
- DB_PASSWORD
- APP_JWT_SECRET

Example (Git Bash):
```bash
export DB_USERNAME=postgres
export DB_PASSWORD=your_password
export APP_JWT_SECRET=your_long_random_secret
```

### 4. Run application
```bash
./mvnw spring-boot:run
```

### 5. Build check
```bash
./mvnw clean package -DskipTests
```

## Demo Flow (Hackathon)
1. Signup company + admin
2. Login and capture JWT token
3. Create users (manager, finance, director, employee)
4. Employee creates expense (DRAFT)
5. Employee submits expense (PENDING)
6. Manager/finance/director approve or reject by sequence
7. Track progress and history
8. Check notifications and mark notification as read

## Postman Collection
Collection file is included at:
- postman/reimbursement-api.postman_collection.json

How to use:
1. Import collection into Postman
2. Set baseUrl (default http://localhost:8080)
3. Run Auth -> Login to auto-store JWT token
4. Execute requests in the order from the demo flow

## Frontend Placeholder
- frontend/README.md contains initial frontend note.
- Planned stack: React.

## Team / Author
- Team: ODOO VIT Pune
- Repository Owner: anjali-0404
