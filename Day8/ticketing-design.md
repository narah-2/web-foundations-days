# TicketHub: Ticketing System Design

## 1. Requirements

### Functional requirements

* Users can register, log in, and manage their accounts.
* Users can browse events and view event details, prices, and available seats.
* Users can select seats and temporarily hold them while completing payment.
* Users can pay for held seats and receive an order confirmation.
* Users can view their purchased tickets and order history.
* The system releases expired seat holds so other customers can buy those seats.
* Administrators can create events, manage seat inventories, and monitor sales.
* The system prevents two customers from purchasing the same seat.

### Non-functional requirements

**Speed**

* Event listings and seat maps should load within 2 seconds under normal conditions.
* Most API requests should respond within 500 milliseconds under normal traffic.
* During a popular sale, the system should remain responsive and show customers their position or progress when demand exceeds capacity.

**Correctness and consistency**

* A seat must never be sold to two different customers for the same event.
* Payment and ticket creation must be recorded reliably.
* A failed payment must not result in a confirmed ticket.
* The database must enforce seat availability and order constraints, even when requests arrive simultaneously.

**Fairness**

* Customers should enter a virtual waiting room when demand is unusually high.
* The waiting room should assign positions using a transparent queue policy, such as arrival order.
* Rate limits and bot detection should reduce automated purchasing and abuse.
* Customers should receive clear messages when seats become unavailable or their holds expire.

**Reliability and security**

* The service should recover from component failures without losing confirmed orders.
* All payment and account information must be protected.
* Only authenticated customers can manage their own orders and tickets.
* Payment details should be handled by a trusted payment provider rather than stored directly by TicketHub.

## 2. Traffic estimates

TicketHub has 2 million registered users.

### Normal daily traffic

Given:

* 50,000 visitors per day.
* Each visitor views 10 pages.
* 5,000 tickets sold per day.

Page views per day:

50,000 × 10 = **500,000 page views per day**

Assuming traffic is spread evenly across 24 hours:

500,000 ÷ 86,400 ≈ **5.8 page views per second on average**

For planning purposes, assume the busiest periods reach five times the daily average:

5.8 × 5 ≈ **29 page views per second**

Average ticket sales:

5,000 ÷ 86,400 ≈ **0.058 tickets per second**, or approximately 208 tickets per hour on average.

### Popular concert sale

Given:

* 200,000 people attempt to buy tickets within 10 minutes.
* Only 20,000 seats are available.

Average arrival rate:

200,000 ÷ 600 = **333 people per second**

The event has ten potential buyers for every available seat:

200,000 ÷ 20,000 = **10 buyers per seat**

If each person makes five requests during the buying process, the system could receive approximately:

200,000 × 5 ÷ 600 ≈ **1,667 requests per second**

This is an illustrative estimate, not a measured peak. Actual traffic could be higher because of retries and uneven arrival patterns.

### Comparison

| Metric                          |                 Normal day |                                               Popular sale |
| ------------------------------- | -------------------------: | ---------------------------------------------------------: |
| Visitors or buyers              |        50,000 visitors/day |                                      200,000 buyers/10 min |
| Page views                      |                500,000/day |                                        Depends on browsing |
| Estimated page/API request rate | 5.8 page views/sec average | About 1,667 requests/sec under the five-request assumption |
| Ticket demand                   |          5,000 tickets/day |                            200,000 buyers for 20,000 seats |
| Main challenge                  | Efficient everyday service |                     Overload, fairness, and seat conflicts |

The popular sale needs much more capacity and stricter controls than normal traffic. The waiting room, caching, rate limiting, and database transaction controls are essential.

## 3. API design

The API uses REST endpoints and JSON responses. Protected endpoints require authentication.

| Method and endpoint                  | Purpose                                             |
| ------------------------------------ | --------------------------------------------------- |
| `GET /api/events`                    | Browse events with search, filters, and pagination. |
| `GET /api/events/{eventId}`          | View event details, venue, date, and prices.        |
| `GET /api/events/{eventId}/seats`    | View seats and their current availability.          |
| `POST /api/seat-holds`               | Request a temporary hold on selected seats.         |
| `GET /api/seat-holds/{holdId}`       | Check whether a hold is still valid.                |
| `POST /api/orders`                   | Create a pending order from a valid seat hold.      |
| `POST /api/orders/{orderId}/payment` | Start payment through a payment provider.           |
| `POST /api/payment-webhooks`         | Receive verified payment status updates.            |
| `GET /api/me/tickets`                | View the authenticated user's purchased tickets.    |
| `GET /api/me/orders`                 | View the user's order history.                      |

### Important API rules

* Seat-hold requests must be authenticated and rate-limited.
* A successful hold response includes a hold ID and expiration time.
* The server must check availability again when processing a hold; the seat map alone is not authoritative.
* Requests that create orders or payments should use idempotency keys so retries do not create duplicate orders or charges.
* Payment webhooks must be authenticated or cryptographically verified.
* Customers may access only their own orders and tickets.
* A sold-out or unavailable seat should return a clear conflict response, such as HTTP `409 Conflict`.

## 4. Database design

Use a relational database such as PostgreSQL because seat sales require strong consistency, transactions, and constraints.

### Table 1: users

| Column          | Purpose                       |
| --------------- | ----------------------------- |
| `id`            | Primary key                   |
| `name`          | Customer name                 |
| `email`         | Unique customer email         |
| `password_hash` | Securely stored password hash |
| `created_at`    | Account creation timestamp    |

### Table 2: events

| Column           | Purpose                      |
| ---------------- | ---------------------------- |
| `id`             | Primary key                  |
| `title`          | Event name                   |
| `venue`          | Event location               |
| `starts_at`      | Event start time             |
| `sale_starts_at` | Ticket sale opening time     |
| `status`         | Draft, on sale, or cancelled |

### Table 3: seats

Each row represents a physical seat for a particular event.

| Column            | Purpose                             |
| ----------------- | ----------------------------------- |
| `id`              | Primary key                         |
| `event_id`        | Foreign key to `events.id`          |
| `seat_label`      | Seat identifier, such as A-12       |
| `price`           | Ticket price                        |
| `status`          | Available, held, or sold            |
| `hold_expires_at` | Expiration time of a temporary hold |

Constraint: `UNIQUE (event_id, seat_label)` prevents duplicate definitions of the same seat within an event.

### Table 4: orders

| Column              | Purpose                                  |
| ------------------- | ---------------------------------------- |
| `id`                | Primary key                              |
| `user_id`           | Foreign key to `users.id`                |
| `status`            | Pending, confirmed, failed, or cancelled |
| `total_amount`      | Total order price                        |
| `payment_reference` | Payment provider reference               |
| `created_at`        | Order creation timestamp                 |

### Table 5: order_items

This table links orders to individual seats.

| Column              | Purpose                         |
| ------------------- | ------------------------------- |
| `id`                | Primary key                     |
| `order_id`          | Foreign key to `orders.id`      |
| `seat_id`           | Foreign key to `seats.id`       |
| `price_at_purchase` | Price recorded at purchase time |

Constraint: `UNIQUE (seat_id)` ensures that a seat can appear in only one order item across all orders. If the business later supports legitimate resale or rebooking, this rule would need a more advanced ticket-ownership model.

### Relationships

* One user can create many orders.
* One event has many seats.
* One order contains one or more order items.
* Each order item refers to one seat.
* A seat belongs to one event.
* The order and order-item records preserve the purchase history.

## 5. Preventing double-booking

The most important correctness rule is that two customers must never buy the same seat.

TicketHub uses database transactions, row-level locking, and constraints.

### Step 1: Hold the seat

When a customer requests a seat, the server starts a database transaction and locks the relevant seat row.

It checks whether the seat is available or whether an earlier hold has expired. If available, it changes the seat to `held`, records the expiration time, and associates the hold with the customer. The transaction then commits.

If another customer requests the same seat simultaneously, that request must wait for the first transaction to finish. Afterward, it sees the updated status and cannot claim the same seat.

### Step 2: Complete payment

The customer has a limited time to pay. TicketHub creates a pending order and sends the payment request to the payment provider.

When verified payment confirmation arrives, the system starts a new transaction. It locks the relevant records, verifies that the hold is still valid and belongs to the order, marks the seats as sold, and confirms the order.

If payment fails or the hold expires before confirmation, the order is not confirmed and the seats can be released according to the payment-reconciliation rules.

### Step 3: Enforce database constraints

* `UNIQUE (event_id, seat_label)` prevents duplicate seat records.
* `UNIQUE (seat_id)` in `order_items` prevents a seat from being sold through two orders.
* Foreign keys prevent orders from referencing nonexistent users or seats.
* Transactions ensure that related changes either commit together or roll back together.

**Important:** A seat status check by itself is not sufficient. The check and update must occur atomically inside a transaction. Payment calls should happen outside long-running database locks, with verified callbacks and idempotent processing to handle delays and retries safely.

## 6. Architecture diagram

```text
                 Customers
                     |
                     v
              CDN / Web Frontend
                     |
                     v
             API Gateway / WAF
           (rate limits, security)
                     |
                     v
              Virtual Waiting Room
                     |
                     v
               Application API
              /       |       \
             v        v        v
       Event/Seat   Order     Ticket
        Service    Service   Service
             \        |        /
              \       v       /
               PostgreSQL
          (transactions and constraints)
                     ^
                     |
             Payment Webhooks
                     ^
                     |
              Payment Provider

 Supporting components:
 - Redis/cache: event details and temporary queue state
 - Background workers/queue: payment reconciliation,
   expired-hold cleanup, email and ticket delivery
 - Monitoring/logging: latency, errors, queue length,
   payment failures and seat conflicts
```

### Component explanations

**CDN and web frontend:** Serve static assets close to customers and reduce requests reaching the application servers.

**API gateway and web application firewall:** Authenticate and route requests, apply rate limits, and block suspicious traffic.

**Virtual waiting room:** Controls entry during the popular sale. It admits customers at a rate the backend can safely handle and communicates queue positions or estimated progress.

**Application services:** Separate event browsing, seat management, orders, and ticket delivery responsibilities. Multiple stateless application instances can run behind a load balancer.

**PostgreSQL:** Stores authoritative seat, order, and payment-related records. Transactions, locks, and constraints protect correctness.

**Redis/cache:** Stores frequently accessed event details and other suitable temporary data. Cached seat availability is informational only; the database makes the final booking decision.

**Payment provider and webhooks:** Process payments securely and notify TicketHub about their outcomes. Webhook verification and idempotency prevent duplicate processing.

**Background queue and workers:** Process non-urgent tasks such as sending tickets, expiring holds, and reconciling uncertain payments. Retries with backoff help recover from temporary failures.

**Monitoring and logging:** Track response times, error rates, database load, waiting-room length, and payment problems.

### How the architecture survives the big sale

The waiting room limits the number of customers entering the purchase workflow at once. The CDN and caches absorb much of the read traffic, while stateless application servers can scale horizontally.

Seat claims are serialized at the database row level, so only one customer can successfully hold a given seat at a time. Database constraints provide a second layer of protection. Background queues move non-essential work away from the critical purchase path, while monitoring alerts the team to overload or failures.

## 7. Trade-offs

### Trade-off 1: Strong consistency versus speed

Using PostgreSQL transactions and row locks protects seat correctness, but simultaneous requests for the same seat can wait and increase response times.

**Decision:** Prioritize correctness for booking and payment operations. Use caching for event browsing, and let the waiting room control how quickly purchase requests reach the database.

### Trade-off 2: Fairness versus maximum throughput

A virtual waiting room makes the sale more orderly and protects the backend, but customers may have to wait even when some resources are available.

**Decision:** Use a transparent queue policy, communicate progress clearly, and admit customers at a controlled rate rather than allowing an uncontrolled rush.

### Trade-off 3: Temporary holds versus seat utilization

Long holds give customers more time to pay, but they prevent other customers from buying those seats. Very short holds may cause customers to lose seats while paying.

**Decision:** Use a clear, limited hold period, such as five minutes, with a visible countdown and reliable expiration handling. Reconcile delayed payment confirmations carefully before releasing a seat.

## Conclusion

TicketHub must support everyday browsing and an intense ticket-sale peak without compromising fairness, security, or booking correctness. Caching and horizontal scaling improve capacity, while a waiting room controls demand. Most importantly, database transactions, row-level locks, and uniqueness constraints prevent double-booking even when many customers attempt to purchase the same seat simultaneously.
