# TriageSync: Solution Notes

This document records the implementation decisions for the assessment. Replace every `TO BE MEASURED` or verification note with results from the actual code and test environment. Do not report unrun tests or estimated measurements as facts.

## Part A. Architecture and ticket trace

```text
Browser
  |
  v
React + Vite frontend
  |
  | HTTP requests + JWT
  v
Express REST API
  |
  +--> Authentication middleware
  |
  +--> Ticket routes
  |      |
  |      +--> Ticket model
  |      +--> TicketEvent model
  |
  +--> Resource and booking routes
         |
         +--> Resource model
         +--> Booking model
  |
  v
MongoDB
```

### Imported ticket flow

1. An authenticated client sends `POST /api/tickets/import` with a `tickets` array.
2. The import route validates each item and checks its `externalId`.
3. A new item is classified using the deterministic keyword rules and stored.
4. An existing item is updated using its external ID. If an agent has overridden its category, the import must preserve the human-selected category.
5. The API returns import counts.
6. The frontend requests the ticket list and statistics, then renders the updated queue.

### Classification rules

| Signal | Category |
|---|---|
| refund, invoice, charge, payment | BILLING |
| password, 2fa, sign in, locked out, login | LOGIN |
| package, arrived, shipping, tracking, delivery | DELIVERY |
| crash, error, 500, exception, broken | BUG |
| No matching signal | FEATURE_REQUEST |

Priority rules:

- `URGENT`: urgent, production down or locked out.
- `HIGH`: error, refund or not arrived.
- `MEDIUM`: default.

The expected examples include “My package has not arrived” as `DELIVERY` and a refund-related ticket as `BILLING`.

### Definition of reviewed

A ticket is reviewed when an agent explicitly changes its category or changes its status from `OPEN`. A human category change also sets the human-override flag. Confirm this definition against the current route implementation and tests.

## Part B. Concurrency and idempotent import

### Booking overlap

Two bookings for the same resource overlap when:

```text
newStart < existingEnd && newEnd > existingStart
```

This strict comparison allows back-to-back bookings. Only `PENDING` and `APPROVED` bookings should block a slot.

The overlap check and insert must run atomically. A check performed outside the transaction is insufficient: two requests might both observe an empty slot and both insert a booking.

The current backend contains a MongoDB transaction and resource-version update approach in the booking creation flow. Verify the transaction is supported by the configured MongoDB deployment and run the required concurrency test.

### Required race test

Send ten simultaneous booking creation requests for the same resource and exact time slot.

| Result | Expected |
|---|---:|
| HTTP 201 | 1 |
| HTTP 409 | 9 |
| Active bookings for the slot | 1 |

Actual test command/tool: `TO BE ADDED`

Actual result: `TO BE TESTED`

### Idempotent import and human override

Use `externalId` as the stable identity for an imported ticket.

- First import creates the ticket.
- Re-import updates the existing ticket instead of inserting a duplicate.
- Re-import refreshes automatic classification only while the ticket has no human category override.
- A human category change sets the override flag.
- Later imports preserve the human-selected category.

Audit events should be recorded for each changed ticket field. The actor should come from the `X-Agent` header when supplied, otherwise from the authenticated user's email.

## Part C. Measure first, then optimise

The assessment asks for latency measurements of:

```http
GET /api/tickets?limit=100
```

Use at least 500 ticket records. Measure the same environment, dataset, request and authentication conditions before and after the indexing/query change. Run multiple samples and report the median.

| Measurement | Before optimisation | After optimisation |
|---|---:|---:|
| Dataset size | TO BE MEASURED | TO BE MEASURED |
| Median response time | TO BE MEASURED | TO BE MEASURED |
| p95 response time | TO BE MEASURED | TO BE MEASURED |
| Query/index change | Baseline | TO BE DOCUMENTED |

Measurement method and date: `TO BE ADDED`

Trade-off: indexes improve reads for matching query patterns but consume storage and add work to writes. Document the actual index added and the query pattern it supports.

Do not fill this table with invented or estimated timings.

## Part D. Improvements with one more day

Complete this section with verified file paths and line numbers from the final repository.

| Improvement | File and line | Reason |
|---|---|---|
| Complete and test the resource availability contract | `TO BE FILLED` | Return only the required availability fields and enforce the requested date range |
| Add separate booking approval and rejection handlers | `TO BE FILLED` | Match the required API paths and rejection-note validation |
| Enforce all booking time and per-user limits | `TO BE FILLED` | Prevent invalid durations, past slots and excess active bookings |
| Add optimistic ticket updates with rollback | `TO BE FILLED` | Keep the interface responsive while restoring server state on failure |
| Add automated API and race-condition tests | `TO BE FILLED` | Catch contract and concurrency regressions |
