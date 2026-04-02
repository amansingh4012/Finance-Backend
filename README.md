# Finance Data Processing & Access Control Backend

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.18-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-5.10-2D3748?logo=prisma&logoColor=white)
![License](https://img.shields.io/badge/License-ISC-blue)

> A production-grade backend API for managing financial records with hierarchical role-based access control, real-time dashboard analytics, and comprehensive audit trails.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Tech Stack](#-tech-stack)
- [Architecture & Project Structure](#-architecture--project-structure)
- [System Architecture Overview](#-system-architecture-overview)
- [Request Lifecycle & System Flows](#-request-lifecycle--system-flows)
  - [Authentication Flow](#authentication-flow-1)
  - [Role-Based Access Control Flow](#role-based-access-control-flow)
  - [Financial Record Creation Flow](#financial-record-creation-flow)
  - [Dashboard Summary Generation Flow](#dashboard-summary-generation-flow)
- [Data Models](#-data-models)
- [Role & Access Control Design](#-role--access-control-design)
- [API Reference](#-api-reference)
- [Setup & Installation](#-setup--installation)
- [Authentication Flow](#-authentication-flow)
- [Dashboard Summary Logic](#-dashboard-summary-logic)
- [Validation & Error Handling](#-validation--error-handling)
- [Assumptions & Tradeoffs](#-assumptions--tradeoffs)
- [Optional Enhancements Implemented](#-optional-enhancements-implemented)
- [Future Improvements](#-future-improvements)

---

## 🎯 Overview

This backend system powers a **finance dashboard** where users with different roles interact with financial records based on their permissions. The system provides:

- **User & Role Management**: Create users, assign roles (Viewer, Analyst, Admin), manage account status
- **Financial Records**: Full CRUD operations for income/expense entries with advanced filtering
- **Dashboard Analytics**: Real-time summaries, category breakdowns, trends, and spending patterns
- **Access Control**: Granular permission-based authorization enforced at middleware level
- **Audit Trail**: Soft deletes and timestamps for data integrity and compliance

The API follows REST conventions, uses JWT for stateless authentication, and employs a layered architecture (Routes → Controllers → Services → Repository) for maintainability.

---

## 🛠 Tech Stack

| Technology | Purpose |
|------------|---------|
| **Node.js 18+** | Runtime environment — async I/O, extensive ecosystem |
| **TypeScript 5.3** | Type safety, better IDE support, reduced runtime errors |
| **Express.js 4.18** | Minimal, flexible web framework with robust middleware support |
| **PostgreSQL (Neon)** | ACID-compliant relational database ideal for financial data |
| **Prisma 5.10** | Type-safe ORM with migrations, introspection, and query optimization |
| **JWT (jsonwebtoken)** | Stateless authentication enabling horizontal scaling |
| **bcryptjs** | Password hashing with configurable work factor (12 rounds) |
| **Zod** | Runtime schema validation with TypeScript inference |
| **Helmet** | Security headers middleware (XSS, clickjacking protection) |
| **Swagger/OpenAPI** | Interactive API documentation |
| **Jest + Supertest** | Unit and integration testing framework |

---

## 🏗 Architecture & Project Structure

```
src/
├── app.ts                              # Express app setup, middleware chain, route mounting
├── server.ts                           # Entry point, DB connection, graceful shutdown
├── config/
│   └── index.ts                        # Environment config loader (dotenv)
├── middlewares/
│   ├── index.ts                        # Barrel export for all middleware
│   ├── auth.middleware.ts              # JWT verification, user attachment to request
│   ├── rbac.middleware.ts              # Permission & role-based authorization
│   ├── validate.middleware.ts          # Zod schema validation (body/query/params)
│   ├── errorHandler.middleware.ts      # Global error handler + 404 handler
│   └── common.middleware.ts            # Request ID generation, request logging
├── modules/
│   ├── auth/                           # Authentication module
│   │   ├── auth.routes.ts              # Route definitions
│   │   ├── auth.controller.ts          # Request handlers
│   │   ├── auth.service.ts             # Business logic (register, login, tokens)
│   │   ├── auth.schema.ts              # Zod validation schemas
│   │   └── index.ts                    # Module exports
│   ├── users/                          # User management module (same structure)
│   ├── records/                        # Financial records module (same structure)
│   └── dashboard/                      # Analytics & summaries module (same structure)
├── shared/
│   ├── errors/
│   │   ├── AppError.ts                 # Base error class + subclasses (400-500)
│   │   └── index.ts
│   ├── types/
│   │   ├── enums.ts                    # Role, UserStatus, RecordType, Permissions
│   │   ├── interfaces.ts               # TypeScript interfaces for all entities
│   │   └── index.ts
│   └── utils/
│       ├── helpers.ts                  # Response formatters, pagination, decimal conversion
│       └── index.ts
├── prisma/
│   ├── schema.prisma                   # Database schema definition
│   └── seed.ts                         # Seed script for sample data
└── tests/
    ├── setup.ts                        # Jest setup, global helpers
    ├── integration/                    # API endpoint tests
    │   ├── auth.test.ts
    │   └── records.test.ts
    └── unit/                           # Unit tests
        └── rbac.test.ts
```

### Separation of Concerns

| Layer | Responsibility |
|-------|----------------|
| **Routes** | HTTP method mapping, middleware chaining, parameter extraction |
| **Controllers** | Request/response handling, calls service methods, error delegation |
| **Services** | Business logic, validation rules, database operations via Prisma |
| **Middlewares** | Cross-cutting concerns (auth, validation, error handling) |
| **Shared** | Reusable types, utilities, and error classes |

---

## 🔷 System Architecture Overview

This backend follows a **layered architecture pattern** with clear separation between HTTP handling, business logic, and data persistence. Each layer has a single responsibility, enabling independent testing, easier maintenance, and horizontal scaling.

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                                 │
│         (Postman / Frontend App / REST API Consumer)            │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP Request (JSON)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SERVER ENTRY POINT                           │
│                      (server.ts)                                │
│   • Database connection (Prisma)                                │
│   • Graceful shutdown handling                                  │
│   • Server initialization on PORT                               │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXPRESS APPLICATION                          │
│                       (app.ts)                                  │
│   • Global middleware (helmet, cors, body-parser)               │
│   • Request ID & logging middleware                             │
│   • Route mounting (/api/auth, /api/users, etc.)                │
│   • Swagger documentation (/api/docs)                           │
│   • 404 & Global error handlers                                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ROUTING LAYER                                │
│            (modules/*/routes.ts)                                │
│   • HTTP method mapping (GET, POST, PUT, DELETE)                │
│   • Middleware chaining per route                               │
│   • Parameter extraction (params, query, body)                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MIDDLEWARE LAYER                             │
│                   (middlewares/*.ts)                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │    Auth     │  │    RBAC     │  │      Validation         │  │
│  │ Middleware  │→ │   Guard     │→ │   (Zod Schemas)         │  │
│  │ (JWT verify)│  │ (permission)│  │ (body/query/params)     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CONTROLLER LAYER                             │
│              (modules/*/controller.ts)                          │
│   • Extract validated request data                              │
│   • Invoke service methods                                      │
│   • Format and send HTTP responses                              │
│   • Delegate errors to error handler                            │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SERVICE LAYER                                │
│               (modules/*/service.ts)                            │
│   • Business logic implementation                               │
│   • Data transformation & calculations                          │
│   • Validation rules enforcement                                │
│   • Orchestrates database operations                            │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                DATA ACCESS LAYER (ORM)                          │
│                 (Prisma Client)                                 │
│   • Type-safe database queries                                  │
│   • Transaction management                                      │
│   • Query optimization & indexing                               │
│   • Soft delete filtering                                       │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE                                     │
│              (PostgreSQL via Neon)                              │
│   • Tables: User, Record, Category                              │
│   • Indexes for performance                                     │
│   • ACID compliance for financial data                          │
└─────────────────────────────────────────────────────────────────┘
```

### Design Philosophy

The architecture enforces **strict unidirectional data flow** — requests travel downward through layers, and responses bubble up. This prevents circular dependencies and makes the codebase predictable. Each layer only knows about the layer directly below it: controllers call services, services call Prisma, but never the reverse.

**Middleware composition** allows cross-cutting concerns (authentication, authorization, validation) to be applied declaratively at the route level without polluting business logic. A route definition reads like a pipeline: `authenticate → authorize → validate → handle`.

The **modular structure** (auth, users, records, dashboard) enables feature isolation. Each module owns its routes, controller, service, and schemas, making it easy to modify or extend one domain without affecting others. Shared utilities and types live in `/shared`, promoting DRY principles while maintaining module independence.

---

## 🔄 Request Lifecycle & System Flows

This section details how requests flow through the system for key operations. Each flow includes a step-by-step walkthrough and an ASCII diagram showing decision points.

---

### Authentication Flow

**Scenario**: A user submits credentials to `POST /api/auth/login` and receives JWT tokens.

#### Step-by-Step Walkthrough

1. **Client** sends POST request with `{ email, password }` to `/api/auth/login`
2. **Express Router** matches the route and invokes the middleware chain
3. **Validation Middleware** validates request body against `loginSchema` (Zod)
4. **Auth Controller** receives validated data, calls `authService.login()`
5. **Auth Service** queries database for user by email (case-insensitive)
6. **Auth Service** verifies user exists, is not deleted, and status is ACTIVE
7. **Auth Service** compares password hash using `bcrypt.compare()`
8. **Auth Service** generates JWT access token (24h) and refresh token (7d)
9. **Auth Controller** formats response with user data (sans password) and tokens
10. **Client** receives 200 OK with tokens for subsequent authenticated requests

#### Flow Diagram

```
┌──────────┐     POST /api/auth/login
│  Client  │     { email, password }
└────┬─────┘
     │
     ▼
┌──────────────────────────────────────┐
│           Express Router             │
│        (auth.routes.ts)              │
└────┬─────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│       Validation Middleware          │
│    validate(loginSchema, 'body')     │
└────┬─────────────────────────────────┘
     │
     ├─────────────────────────────────────┐
     │                                     │
   Valid                              Invalid Input
     │                                     │
     ▼                                     ▼
┌──────────────────────────────────────┐  ┌─────────────────┐
│         Auth Controller              │  │ 422 Validation  │
│    authController.login()            │  │     Error       │
└────┬─────────────────────────────────┘  └─────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│          Auth Service                │
│     authService.login(data)          │
└────┬─────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│         Prisma Client                │
│  prisma.user.findUnique({ email })   │
└────┬─────────────────────────────────┘
     │
     ├─────────────────────────────────────┐
     │                                     │
 User Found                          User Not Found
     │                                     │
     ▼                                     ▼
┌──────────────────────────────────────┐  ┌─────────────────┐
│    Check: deletedAt, status          │  │ 401 Unauthorized│
│    bcrypt.compare(password, hash)    │  │ Invalid creds   │
└────┬─────────────────────────────────┘  └─────────────────┘
     │
     ├─────────────────────────────────────┐
     │                                     │
Password Valid                       Password Invalid
     │                                     │
     ▼                                     ▼
┌──────────────────────────────────────┐  ┌─────────────────┐
│      Generate JWT Tokens             │  │ 401 Unauthorized│
│  accessToken (24h), refreshToken(7d) │  │ Invalid creds   │
└────┬─────────────────────────────────┘  └─────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│        Response 200 OK               │
│  { user, tokens: { access, refresh }}│
└──────────────────────────────────────┘
```

---

### Role-Based Access Control Flow

**Scenario**: An authenticated user accesses a protected endpoint that requires specific permissions.

#### Step-by-Step Walkthrough

1. **Client** sends request with `Authorization: Bearer <token>` header
2. **Express Router** matches route, begins middleware chain
3. **Auth Middleware** extracts token from header, verifies JWT signature
4. **Auth Middleware** decodes payload `{ userId, email, role }`
5. **Auth Middleware** queries database to confirm user is active and not deleted
6. **Auth Middleware** attaches `req.user = { userId, email, role }` to request
7. **RBAC Middleware** checks if `req.user.role` has required permission(s)
8. **RBAC Middleware** uses `RolePermissions` mapping to verify access
9. If authorized: request proceeds to controller → service → database → response
10. If unauthorized: 403 Forbidden response returned immediately

#### Flow Diagram

```
┌──────────┐     GET /api/users
│  Client  │     Authorization: Bearer <JWT>
└────┬─────┘
     │
     ▼
┌──────────────────────────────────────┐
│           Express Router             │
│        (users.routes.ts)             │
└────┬─────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│        Auth Middleware               │
│       authenticate(req, res, next)   │
│  • Extract Bearer token              │
│  • jwt.verify(token, secret)         │
│  • Decode { userId, email, role }    │
└────┬─────────────────────────────────┘
     │
     ├─────────────────────────────────────────────────────┐
     │                                                     │
 Token Valid                                        Token Invalid/Expired
     │                                                     │
     ▼                                                     ▼
┌──────────────────────────────────────┐          ┌─────────────────┐
│      Query User from Database        │          │ 401 Unauthorized│
│  prisma.user.findUnique({ userId })  │          │ Invalid token   │
│  Check: exists, active, not deleted  │          └─────────────────┘
└────┬─────────────────────────────────┘
     │
     ├─────────────────────────────────────────────────────┐
     │                                                     │
 User Valid                                          User Invalid
     │                                                     │
     ▼                                                     ▼
┌──────────────────────────────────────┐          ┌─────────────────┐
│  Attach req.user = { userId, role }  │          │ 401 Unauthorized│
│          next()                      │          │ Account inactive│
└────┬─────────────────────────────────┘          └─────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│         RBAC Middleware              │
│  authorize(Permissions.READ_USERS)   │
│  • Check: req.user.role              │
│  • Lookup: RolePermissions[role]     │
│  • Verify: includes permission?      │
└────┬─────────────────────────────────┘
     │
     ├─────────────────────────────────────────────────────┐
     │                                                     │
 Has Permission                                    Missing Permission
 (ANALYST, ADMIN)                                      (VIEWER)
     │                                                     │
     ▼                                                     ▼
┌──────────────────────────────────────┐          ┌─────────────────┐
│          Controller                  │          │  403 Forbidden  │
│   usersController.getAllUsers()      │          │  Access denied  │
└────┬─────────────────────────────────┘          └─────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│            Service                   │
│   usersService.getAllUsers(query)    │
└────┬─────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│         Prisma Client                │
│   prisma.user.findMany({ where })    │
└────┬─────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│        Response 200 OK               │
│   { data: users[], pagination }      │
└──────────────────────────────────────┘
```

---

### Financial Record Creation Flow

**Scenario**: An Admin user creates a new financial record via `POST /api/records`.

#### Step-by-Step Walkthrough

1. **Client** sends POST request with record data and Bearer token
2. **Express Router** matches `/api/records` POST route
3. **Auth Middleware** verifies JWT, attaches `req.user` with role ADMIN
4. **RBAC Middleware** checks `authorize(Permissions.CREATE_RECORDS)`
5. **Validation Middleware** validates body against `createRecordSchema`
6. **Records Controller** extracts validated data, calls service with `userId`
7. **Records Service** transforms date string to Date object
8. **Prisma Client** inserts record with proper Decimal handling
9. **Records Service** converts Decimal to number for response
10. **Records Controller** returns 201 Created with new record data

#### Flow Diagram

```
┌──────────┐     POST /api/records
│  Client  │     Authorization: Bearer <admin-token>
│ (Admin)  │     { amount, type, category, date, description }
└────┬─────┘
     │
     ▼
┌──────────────────────────────────────┐
│           Express Router             │
│        (records.routes.ts)           │
│   router.post('/', authenticate,     │
│     authorize(CREATE_RECORDS),       │
│     validate(createRecordSchema),    │
│     controller.createRecord)         │
└────┬─────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│        Auth Middleware               │
│  • Verify JWT token                  │
│  • Confirm user active               │
│  • Attach req.user = { role: ADMIN } │
└────┬─────────────────────────────────┘
     │ ✓ Token Valid
     ▼
┌──────────────────────────────────────┐
│         RBAC Middleware              │
│  authorize(Permissions.CREATE_RECORDS)│
│  • ADMIN role has CREATE_RECORDS ✓   │
└────┬─────────────────────────────────┘
     │ ✓ Permission Granted
     ▼
┌──────────────────────────────────────┐
│       Validation Middleware          │
│    validate(createRecordSchema)      │
│  • amount: positive, max 999999999.99│
│  • type: INCOME | EXPENSE            │
│  • category: string 1-50 chars       │
│  • date: valid ISO date string       │
│  • description: optional, max 500    │
└────┬─────────────────────────────────┘
     │
     ├─────────────────────────────────────┐
     │                                     │
   Valid                              Invalid
     │                                     │
     ▼                                     ▼
┌──────────────────────────────────────┐  ┌─────────────────┐
│        Records Controller            │  │ 422 Validation  │
│   recordsController.createRecord()   │  │ { details: [] } │
│   • Extract req.body, req.user.userId│  └─────────────────┘
└────┬─────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│         Records Service              │
│   recordsService.createRecord()      │
│   • Parse date string to Date        │
│   • Attach userId to record          │
└────┬─────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│         Prisma Client                │
│   prisma.record.create({             │
│     data: {                          │
│       amount: Decimal,               │
│       type, category, date,          │
│       description, userId            │
│     }                                │
│   })                                 │
└────┬─────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│      Transform & Respond             │
│   • Convert Decimal → number         │
│   • Format success response          │
└────┬─────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│        Response 201 Created          │
│   {                                  │
│     success: true,                   │
│     data: { id, amount, type, ... }, │
│     message: "Record created"        │
│   }                                  │
└──────────────────────────────────────┘
```

---

### Dashboard Summary Generation Flow

**Scenario**: A Viewer requests financial summary via `GET /api/dashboard/summary`.

#### Step-by-Step Walkthrough

1. **Client** sends GET request with optional `startDate` and `endDate` query params
2. **Express Router** matches route, begins middleware chain
3. **Auth Middleware** verifies JWT, confirms user is active
4. **RBAC Middleware** checks `authorize(Permissions.READ_DASHBOARD)` — VIEWER has this
5. **Validation Middleware** validates query params against `dashboardQuerySchema`
6. **Dashboard Controller** extracts query params, calls service
7. **Dashboard Service** builds Prisma `where` clause with date filters
8. **Prisma Client** executes `groupBy` aggregation on records table
9. **Dashboard Service** calculates totals, net balance, savings rate
10. **Dashboard Controller** returns formatted summary response

#### Flow Diagram

```
┌──────────┐     GET /api/dashboard/summary?startDate=2024-01-01&endDate=2024-12-31
│  Client  │     Authorization: Bearer <viewer-token>
│ (Viewer) │
└────┬─────┘
     │
     ▼
┌──────────────────────────────────────┐
│           Express Router             │
│      (dashboard.routes.ts)           │
│   router.get('/summary',             │
│     authenticate,                    │
│     authorize(READ_DASHBOARD),       │
│     validate(dashboardQuerySchema),  │
│     controller.getSummary)           │
└────┬─────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│        Auth Middleware               │
│  • Verify JWT, decode payload        │
│  • req.user = { role: VIEWER }       │
└────┬─────────────────────────────────┘
     │ ✓ Valid
     ▼
┌──────────────────────────────────────┐
│         RBAC Middleware              │
│  authorize(Permissions.READ_DASHBOARD)│
│  • VIEWER has READ_DASHBOARD ✓       │
└────┬─────────────────────────────────┘
     │ ✓ Authorized
     ▼
┌──────────────────────────────────────┐
│       Validation Middleware          │
│   validate(dashboardQuerySchema)     │
│  • startDate: optional ISO string    │
│  • endDate: optional ISO string      │
└────┬─────────────────────────────────┘
     │ ✓ Valid
     ▼
┌──────────────────────────────────────┐
│       Dashboard Controller           │
│   dashboardController.getSummary()   │
│   • Extract validated query params   │
└────┬─────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│        Dashboard Service             │
│   dashboardService.getSummary(query) │
│   • Build date filter WHERE clause   │
│   • Filter: deletedAt IS NULL        │
└────┬─────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│         Prisma Client                │
│   prisma.record.groupBy({            │
│     by: ['type'],                    │
│     where: { deletedAt: null, date },│
│     _sum: { amount: true },          │
│     _count: { id: true }             │
│   })                                 │
└────┬─────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│      Aggregation Logic               │
│   • totalIncome = SUM(INCOME)        │
│   • totalExpenses = SUM(EXPENSE)     │
│   • netBalance = income - expenses   │
│   • recordCount = income + expense   │
│   • savingsRate = (net/income)*100   │
│   • Convert Decimal → number         │
└────┬─────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│        Response 200 OK               │
│   {                                  │
│     success: true,                   │
│     data: {                          │
│       totalIncome: 25000.00,         │
│       totalExpenses: 8500.00,        │
│       netBalance: 16500.00,          │
│       recordCount: 45,               │
│       incomeCount: 12,               │
│       expenseCount: 33,              │
│       savingsRate: "66.00"           │
│     }                                │
│   }                                  │
└──────────────────────────────────────┘
```

---

## 📊 Data Models

### User

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key, auto-generated |
| `email` | String (unique) | User email, indexed for fast lookup |
| `password` | String | Bcrypt hash (12 rounds) |
| `name` | String | Display name |
| `role` | Enum | `VIEWER` \| `ANALYST` \| `ADMIN` (default: VIEWER) |
| `status` | Enum | `ACTIVE` \| `INACTIVE` (default: ACTIVE) |
| `createdById` | UUID? | Self-referential FK to creating admin |
| `createdAt` | DateTime | Auto-set on creation |
| `updatedAt` | DateTime | Auto-updated on modification |
| `deletedAt` | DateTime? | Soft delete timestamp |

**Relationships**: User → Records (one-to-many), User → User (self-referential for creator tracking)

### Record (Financial Entry)

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `amount` | Decimal(15,2) | Transaction amount (positive) |
| `type` | Enum | `INCOME` \| `EXPENSE` |
| `category` | String | Category name (e.g., "Salary", "Food") |
| `date` | DateTime | Transaction date |
| `description` | String? | Optional notes |
| `userId` | UUID | FK to owning user |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |
| `deletedAt` | DateTime? | Soft delete timestamp |

**Indexes**: `userId`, `type`, `category`, `date`, composite `[userId, date]`, composite `[type, category]`

### Category (Reference Table)

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `name` | String (unique) | Category name |
| `type` | Enum | `INCOME` \| `EXPENSE` |
| `icon` | String? | Icon identifier for UI |
| `color` | String? | Hex color code |

---

## 🔐 Role & Access Control Design

### Permission Matrix

| Permission | VIEWER | ANALYST | ADMIN |
|------------|:------:|:-------:|:-----:|
| `read:dashboard` | ✅ | ✅ | ✅ |
| `read:records` | ✅ | ✅ | ✅ |
| `read:analytics` | ❌ | ✅ | ✅ |
| `read:users` | ❌ | ✅ | ✅ |
| `create:records` | ❌ | ❌ | ✅ |
| `update:records` | ❌ | ❌ | ✅ |
| `delete:records` | ❌ | ❌ | ✅ |
| `create:users` | ❌ | ❌ | ✅ |
| `update:users` | ❌ | ❌ | ✅ |
| `delete:users` | ❌ | ❌ | ✅ |
| `manage:roles` | ❌ | ❌ | ✅ |

### Enforcement Mechanism

Authorization is enforced via **middleware functions** applied at the route level:

```typescript
// rbac.middleware.ts

// Requires ALL specified permissions
export const authorize = (...permissions: Permission[]) => middleware

// Requires ANY ONE of the specified permissions
export const authorizeAny = (...permissions: Permission[]) => middleware

// Requires exact role match
export const requireRole = (...roles: Role[]) => middleware

// Requires role at or above minimum level (hierarchy: VIEWER < ANALYST < ADMIN)
export const requireMinRole = (minRole: Role) => middleware
```

**Usage in Routes:**
```typescript
router.post('/records',
  authenticate,                          // Verify JWT
  authorize(Permissions.CREATE_RECORDS), // Check permission
  validate(createRecordSchema),          // Validate input
  controller.createRecord                // Handle request
);
```

---

## 📚 API Reference

### Authentication Endpoints

#### `POST /api/auth/register`
Register a new user account.

| Field | Required | Auth |
|-------|----------|------|
| — | — | ❌ Public |

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Doe"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": "...", "name": "...", "role": "VIEWER" },
    "tokens": { "accessToken": "jwt...", "refreshToken": "jwt..." }
  },
  "message": "Registration successful",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Errors:** `409 CONFLICT` (email exists), `422 VALIDATION_ERROR` (invalid input)

---

#### `POST /api/auth/login`
Authenticate user and receive tokens.

**Request Body:**
```json
{
  "email": "admin@finance.com",
  "password": "Admin@123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": "...", "name": "...", "role": "ADMIN", "status": "ACTIVE" },
    "tokens": { "accessToken": "jwt...", "refreshToken": "jwt..." }
  }
}
```

**Errors:** `401 UNAUTHORIZED` (invalid credentials or inactive account)

---

#### `POST /api/auth/refresh`
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "jwt..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": { "accessToken": "jwt...", "refreshToken": "jwt..." }
}
```

---

#### `PUT /api/auth/change-password`
Change current user's password. **Requires authentication.**

**Request Body:**
```json
{
  "currentPassword": "OldPass123",
  "newPassword": "NewPass456"
}
```

---

#### `GET /api/auth/profile`
Get current authenticated user's profile. **Requires authentication.**

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "VIEWER",
    "status": "ACTIVE",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

### User Management Endpoints

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/api/users` | `read:users` | List users with pagination/filters |
| POST | `/api/users` | `create:users` | Create new user |
| GET | `/api/users/:id` | `read:users` | Get user by ID |
| PUT | `/api/users/:id` | Owner or Admin | Update user profile |
| PATCH | `/api/users/:id/role` | `manage:roles` | Change user role |
| PATCH | `/api/users/:id/status` | `update:users` | Activate/deactivate user |
| DELETE | `/api/users/:id` | `delete:users` | Soft delete user |

**Query Parameters for GET /api/users:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `limit` | int | 20 | Items per page (max: 100) |
| `role` | enum | — | Filter by VIEWER/ANALYST/ADMIN |
| `status` | enum | — | Filter by ACTIVE/INACTIVE |
| `search` | string | — | Search in name/email |
| `sortBy` | string | createdAt | Sort field |
| `sortOrder` | string | desc | asc or desc |

---

### Financial Records Endpoints

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/api/records` | `read:records` | List records with filters |
| POST | `/api/records` | `create:records` | Create single record |
| POST | `/api/records/bulk` | `create:records` | Bulk create (max 100) |
| GET | `/api/records/:id` | `read:records` | Get record by ID |
| PUT | `/api/records/:id` | `update:records` | Update record |
| DELETE | `/api/records/:id` | `delete:records` | Soft delete record |
| GET | `/api/records/categories` | `read:records` | List predefined categories |
| GET | `/api/records/categories/used` | `read:records` | List categories with usage count |

**Query Parameters for GET /api/records:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `limit` | int | 20 | Items per page (max: 100) |
| `type` | enum | — | INCOME or EXPENSE |
| `category` | string | — | Filter by category (partial match) |
| `startDate` | ISO date | — | Filter from date |
| `endDate` | ISO date | — | Filter to date |
| `minAmount` | number | — | Minimum amount |
| `maxAmount` | number | — | Maximum amount |
| `search` | string | — | Search in description/category |
| `sortBy` | string | date | amount, date, category, type |
| `sortOrder` | string | desc | asc or desc |

**Create Record Request:**
```json
{
  "amount": 5000.00,
  "type": "INCOME",
  "category": "Salary",
  "date": "2024-01-15T00:00:00.000Z",
  "description": "Monthly salary"
}
```

---

### Dashboard Endpoints

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/api/dashboard/summary` | `read:dashboard` | Financial totals |
| GET | `/api/dashboard/category-breakdown` | `read:dashboard` | Category-wise breakdown |
| GET | `/api/dashboard/trends` | `read:analytics` | Time-series trends |
| GET | `/api/dashboard/recent-activity` | `read:dashboard` | Recent transactions |
| GET | `/api/dashboard/analytics` | `read:analytics` | Advanced analytics |

**Summary Response:**
```json
{
  "totalIncome": 25000.00,
  "totalExpenses": 8500.00,
  "netBalance": 16500.00,
  "recordCount": 45,
  "incomeCount": 12,
  "expenseCount": 33,
  "savingsRate": "66.00"
}
```

**Trends Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `period` | enum | monthly | daily, weekly, monthly, yearly |
| `months` | int | 6 | How many months back (1-24) |

---

## ⚡ Setup & Installation

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- PostgreSQL database (local or hosted like Neon)

### Step-by-Step Setup

```bash
# 1. Clone repository
git clone <repository-url>
cd finance-backend

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
```

### Environment Variables

```env
# Database (Neon PostgreSQL or local)
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

# JWT Configuration
JWT_SECRET="your-super-secret-key-minimum-32-characters-long"
JWT_EXPIRES_IN="24h"
JWT_REFRESH_EXPIRES_IN="7d"

# Server
PORT=3000
NODE_ENV=development

# Rate Limiting (optional)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Secret for signing JWTs (min 32 chars) |
| `JWT_EXPIRES_IN` | ❌ | Access token TTL (default: 24h) |
| `JWT_REFRESH_EXPIRES_IN` | ❌ | Refresh token TTL (default: 7d) |
| `PORT` | ❌ | Server port (default: 3000) |
| `NODE_ENV` | ❌ | development or production |

### Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database (creates tables)
npx prisma db push

# Seed with sample data
npm run prisma:seed
```

### Run the Server

```bash
# Development (with hot reload)
npm run dev

# Production
npm run build
npm start
```

### Verify Installation

- **Health Check**: http://localhost:3000/health
- **API Docs**: http://localhost:3000/api/docs

---

## 🔑 Authentication Flow

### JWT-Based Authentication

```
┌─────────┐       ┌─────────┐       ┌─────────┐
│ Client  │       │  API    │       │   DB    │
└────┬────┘       └────┬────┘       └────┬────┘
     │                 │                 │
     │ POST /login     │                 │
     │ {email,password}│                 │
     │────────────────►│                 │
     │                 │ Query user      │
     │                 │────────────────►│
     │                 │ User data       │
     │                 │◄────────────────│
     │                 │                 │
     │                 │ Verify password │
     │                 │ Generate tokens │
     │                 │                 │
     │ {accessToken,   │                 │
     │  refreshToken}  │                 │
     │◄────────────────│                 │
     │                 │                 │
     │ GET /records    │                 │
     │ Auth: Bearer xxx│                 │
     │────────────────►│                 │
     │                 │ Verify JWT      │
     │                 │ Check user      │
     │                 │ active/exists   │
     │                 │────────────────►│
     │                 │◄────────────────│
     │                 │                 │
     │ Records data    │                 │
     │◄────────────────│                 │
```

### Token Structure

**Access Token Payload:**
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "role": "ADMIN",
  "iat": 1705312200,
  "exp": 1705398600
}
```

**Refresh Token Payload:**
```json
{
  "userId": "uuid",
  "type": "refresh",
  "iat": 1705312200,
  "exp": 1705917000
}
```

### Using Tokens

Include the access token in the `Authorization` header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

When access token expires, use `/api/auth/refresh` with the refresh token to obtain new tokens.

---

## 📈 Dashboard Summary Logic

### Summary Calculation (`/api/dashboard/summary`)

```typescript
// Algorithm:
1. Filter records by date range (optional) and exclude soft-deleted
2. Group by type (INCOME/EXPENSE)
3. Calculate SUM(amount) and COUNT(*) per group
4. Derive:
   - totalIncome = SUM where type=INCOME
   - totalExpenses = SUM where type=EXPENSE
   - netBalance = totalIncome - totalExpenses
   - savingsRate = (netBalance / totalIncome) * 100
```

### Category Breakdown (`/api/dashboard/category-breakdown`)

```typescript
// Algorithm:
1. Group records by (category, type)
2. Calculate SUM(amount) and COUNT(*) per group
3. Calculate total per type for percentage computation
4. percentage = (categoryTotal / typeTotal) * 100
5. Sort by total descending within each type
```

### Trends (`/api/dashboard/trends`)

```typescript
// Algorithm:
1. Determine start date based on 'months' parameter
2. Fetch all records in range
3. Group by period (daily/weekly/monthly/yearly):
   - daily: YYYY-MM-DD
   - weekly: week start date
   - monthly: YYYY-MM
   - yearly: YYYY
4. Accumulate income/expenses per period
5. Calculate net = income - expenses
6. Sort chronologically
```

### Analytics (`/api/dashboard/analytics`)

Advanced analytics include:
- **Top Categories**: Top 10 by amount
- **Transaction Stats**: Average, min, max per type
- **Weekday Analysis**: Spending patterns by day of week

---

## ✅ Validation & Error Handling

### Validation Approach

All input validation uses **Zod schemas** with:
- Type coercion for query parameters
- Custom error messages
- Transformation (trim, lowercase)
- Refinements for complex rules

**Example Schema:**
```typescript
const createRecordSchema = z.object({
  amount: z.number()
    .positive('Amount must be positive')
    .max(999999999.99, 'Amount too large'),
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z.string().min(1).max(50).trim(),
  date: z.string().refine(val => !isNaN(Date.parse(val)), 'Invalid date'),
  description: z.string().max(500).optional()
});
```

### Error Response Schema

```typescript
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",           // Machine-readable code
    "message": "Human readable",    // User-friendly message
    "details": [                    // Validation errors (optional)
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "requestId": "uuid-for-tracing"
}
```

### HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET, PUT, PATCH, DELETE |
| 201 | Created | Successful POST creating resource |
| 400 | Bad Request | Client error, malformed request |
| 401 | Unauthorized | Missing/invalid/expired token |
| 403 | Forbidden | Valid token but insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate entry (e.g., email) |
| 422 | Unprocessable | Validation failed |
| 500 | Internal Error | Unexpected server error |

---

## 🤔 Assumptions & Tradeoffs

### Assumptions Made

1. **Single Organization**: No multi-tenancy; all users belong to one organization
2. **Admin Creates Users**: Self-registration creates VIEWER; only Admin can assign higher roles
3. **Currency Agnostic**: Amounts are numeric; currency handling is frontend responsibility
4. **UTC Storage**: All timestamps stored in UTC; timezone conversion is client-side
5. **Category Flexibility**: Categories are free-text; predefined categories are suggestions only

### Tradeoffs

| Decision | Tradeoff | Rationale |
|----------|----------|-----------|
| PostgreSQL over SQLite | More setup, but better for concurrent access and production | Financial data needs ACID guarantees |
| Soft deletes over hard deletes | Increased storage, but full audit trail | Compliance and data recovery needs |
| JWT over sessions | No server-side session store, but harder to revoke | Horizontal scalability priority |
| Zod over Joi | Smaller ecosystem, but TypeScript-first with inference | Better DX with TypeScript |
| Offset pagination over cursor | Less efficient for large datasets, but simpler | Acceptable for expected data volumes |

---

## ✨ Optional Enhancements Implemented

| Feature | Implementation |
|---------|----------------|
| **JWT Authentication** | Access + refresh token pair with configurable expiry |
| **Pagination** | Offset-based with total count, page info, hasNext/hasPrev |
| **Search** | Case-insensitive partial match on name, email, description |
| **Soft Delete** | `deletedAt` timestamp; queries filter deleted records |
| **Bulk Operations** | Create up to 100 records in single request |
| **Request Tracing** | Unique `requestId` on every response for debugging |
| **API Documentation** | Swagger UI at `/api/docs` with try-it-out |
| **Unit Tests** | RBAC permission logic tests |
| **Integration Tests** | Auth and Records API endpoint tests |
| **Graceful Shutdown** | SIGTERM/SIGINT handling with connection cleanup |
| **Security Headers** | Helmet middleware for XSS, clickjacking protection |

---

## 🚀 Future Improvements

1. **Rate Limiting**: Implement per-user rate limiting using Redis to prevent abuse and ensure fair usage
   
2. **Caching Layer**: Add Redis caching for dashboard summaries and frequently accessed data to reduce database load

3. **Audit Logging**: Create separate audit log table tracking all mutations with actor, timestamp, and before/after values

4. **Export Functionality**: Add CSV/Excel export for financial records with date range selection

5. **Multi-tenancy**: Extend data model to support multiple organizations with tenant isolation

6. **Real-time Updates**: WebSocket integration for live dashboard updates when records change

7. **Two-Factor Authentication**: Add TOTP-based 2FA for enhanced security on admin accounts

---

## 🧪 Running Tests

```bash
# Run all tests
npm test

# Run with coverage report
npm test -- --coverage

# Run specific test file
npm test -- auth.test.ts

# Watch mode for development
npm run test:watch
```

---

## 📜 Test Credentials (Development)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@finance.com | Admin@123 |
| Analyst | analyst@finance.com | Analyst@123 |
| Viewer | viewer@finance.com | Viewer@123 |

---

## 📄 License

ISC

---

**Built for backend development assessment** — demonstrating API design, data modeling, business logic implementation, and access control patterns.
