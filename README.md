# TriageSync

TriageSync is a support-ticket triage and resource-booking application. It provides ticket categorisation, priority assignment, agent review, audit history, resource management and booking workflows.

## 1. Overview

The application is organised as a monorepo:

- `frontend/` contains the React and Vite client.
- `backend/` contains the Express REST API and MongoDB models.

Ticket classification uses deterministic keyword rules. Agents can review ticket details and change supported fields. Resource booking is intended for rooms, labs and equipment.

## 2. Live links

- Frontend: `ADD_DEPLOYED_FRONTEND_URL`
- Backend API: `ADD_DEPLOYED_BACKEND_URL`
- GitHub: https://github.com/sh33r0/engnf1-fullstack-sh33r0

Replace the frontend and backend placeholders with the final HTTPS deployment URLs.

## 3. Seeded credentials

The assessment seed accounts are:

| Role | Email | Password |
|---|---|---|
| ADMIN | `admin@triagesync.test` | `Admin@123` |
| USER | `user@triagesync.test` | `User@123` |

Use these credentials only in the assessment/demo environment. Change or remove demo credentials before any production use.

## 4. Tech stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, JavaScript, CSS |
| Backend | Node.js, Express |
| Database | MongoDB, Mongoose |
| Authentication | JSON Web Tokens |
| Password hashing | bcrypt |

## 5. Folder structure

```text
engnf1-fullstack-sh33r0/
├── backend/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── ...
├── frontend/
│   ├── src/
│   └── ...
├── .env.example
├── .gitignore
├── README.md
├── SOLUTION.md
└── AI_USAGE.md
```

The exact files inside `backend/` and `frontend/` are maintained in their respective directories.

## 6. Local setup

### Requirements

- Node.js and npm
- A MongoDB database, local or hosted

### Backend

```bash
cd backend
npm install
```

Create `backend/.env` using the variables in the root `.env.example`. Start the API with the script defined in `backend/package.json`.

### Frontend

Open a second terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env` or `frontend/.env.local` with `VITE_API_URL` pointing to the backend API base URL. Start the client with the script defined in `frontend/package.json`.

The default local URLs used during development are:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- API base: `http://localhost:5000/api`

### Seed data

Run the seed command defined in the backend package scripts. The seed operation should be idempotent: running it more than once should not create duplicate demo users, resources or tickets.

> Before submission, replace this note with the exact seed command from `backend/package.json` and verify the seed script against a clean database.

## 7. Database schema

The application uses MongoDB collections represented by Mongoose models.

- `User`: name, email, password hash and role.
- `Ticket`: external ID, subject, body, automatic category, current category, override flag, priority, status, assignee, review state and timestamps.
- `TicketEvent`: ticket reference, changed field, previous value, new value, actor and timestamp.
- `Resource`: name, type, capacity, description and active state.
- `Booking`: resource, user, optional ticket, start/end time, purpose, status and decision note.

The database enforces validation and uniqueness through the model definitions and route-level checks.

## 8. API summary

All routes below are under `/api`.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/register` | Register a USER account |
| POST | `/auth/login` | Authenticate and return a JWT |
| GET | `/auth/me` | Return the authenticated user |
| POST | `/tickets/import` | Import and classify ticket feed items |
| GET | `/tickets` | List tickets with filters and pagination |
| GET | `/tickets/:id` | Get ticket details and event history |
| PATCH | `/tickets/:id` | Update supported ticket fields |
| GET | `/resources` | List resources |
| POST | `/resources` | Create a resource as ADMIN |
| GET | `/bookings` | List bookings as ADMIN |
| GET | `/bookings/:id` | Get a booking visible to its owner or ADMIN |
| POST | `/bookings` | Create a booking |
| PATCH | `/bookings/:id/cancel` | Cancel an eligible booking |
| PATCH | `/bookings/:id/decision` | Submit an ADMIN booking decision |
| GET | `/stats` | Ticket and application statistics |

Check the route files before relying on this summary. Endpoints still required by the assessment are listed under Known limitations.

## 9. Completed features checklist

Mark an item complete only after testing it against the running application.

- [x] React/Vite frontend and Express backend
- [x] MongoDB persistence
- [x] JWT login and registration flow
- [x] Password hashing
- [x] Ticket import and deterministic categorisation
- [x] Ticket list, filters and pagination
- [x] Ticket detail and audit-event display
- [x] Ticket field editing
- [x] Resource listing and creation
- [x] Booking creation and cancellation
- [ ] Full assessment seed: 15+ tickets, six resources and required account data
- [ ] All 21 assessment API routes and exact response contracts
- [ ] Separate booking approval and rejection routes
- [ ] Resource detail and availability endpoint
- [ ] User booking list endpoint and all booking constraints
- [ ] Admin analytics endpoint and required response shape
- [ ] Ten-request concurrent booking race test
- [ ] Optimistic ticket update with rollback and visible error
- [ ] Responsive checks at 375px, 768px and 1280px
- [ ] HTTPS deployment verified for at least 14 days

Update this checklist after completing and testing each item.

## 10. Known limitations

The current implementation needs a final contract audit against the assessment brief. In particular, verify the exact import permission, `X-Agent` audit actor handling, ticket PATCH response shape, `/api/stats` access and response shape, resource availability, `/api/bookings/mine`, separate approve/reject routes, booking limits and time-slot validation, admin statistics, and concurrency behaviour.

The assessment requires measured before/after latency for `GET /api/tickets?limit=100` on a dataset of at least 500 tickets. Add real measurements to `SOLUTION.md`; do not use estimated values.

The application should be considered assessment-ready only after each required item has been implemented and tested.
