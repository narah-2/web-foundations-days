# TicketHub: High-Traffic Ticketing System Design

## 1. Overview

TicketHub is an online ticketing platform where customers can browse events, view available seats, and purchase tickets. The system must remain reliable during popular ticket sales and prevent two customers from buying the same seat.

## 2. Requirements

### Functional requirements

* Customers can register, log in, and view events.
* Customers can view available seats and ticket prices.
* Customers can select seats and place orders.
* The system temporarily reserves selected seats during checkout.
* Customers can complete payment and receive booking confirmation.
* Customers can view their order history.
* Administrators can create events and manage seats.

### Non-functional requirements

* The system must handle sudden increases in traffic.
* A seat must never be sold to two customers.
* Customer and payment information must be protected.
* The system should recover from temporary service failures.
* Pages and APIs should respond quickly under normal traffic.

## 3. Traffic Estimates

Assumptions for planning:

* 500,000 page views per day.
* Average traffic: approximately 6 page views per second.
* Peak traffic may be five times the average, or approximately 30 page views per second.
* A major sale may attract 200,000 buyers in 10 minutes.
* That sale represents approximately 333 buyers per second.
* If each buyer makes five requests, the system may receive approximately 1,667 requests per second.
* An event may offer 20,000 seats, with many customers attempting to buy the same seats.

These are planning estimates, not measured production traffic. Load testing would be needed to validate the assumptions.

## 4. Proposed Architecture

Customers use a web frontend to browse events and purchase tickets. Requests pass through a load balancer to application servers. The application servers communicate with a relational database and a queue for background tasks.

```text
Customers
    |
    v
Web Frontend
    |
    v
Load Balancer
    |
    v
Application Servers
    |
    +------> Relational Database
    |
    +------> Message Queue
                  |
                  v
          Background Workers
          (emails and notifications)
```

### Main components

* **Frontend:** Displays events, seat availability, checkout, and order history.
* **Load balancer:** Distributes incoming requests across application servers.
* **Application servers:** Validate requests, manage orders, and enforce business rules.
* **Relational database:** Stores users, events, seats, and orders.
* **Message queue:** Holds background jobs so notifications do not delay checkout.
* **Background workers:** Send booking confirmations and process other asynchronous tasks.
* **Payment provider:** Processes payments through a secure payment integration.

## 5. API Design

| Method | Endpoint                    | Purpose                           |
| ------ | --------------------------- | --------------------------------- |
| GET    | `/api/events`               | List available events             |
| GET    | `/api/events/{id}`          | View event details                |
| GET    | `/api/events/{id}/seats`    | View seat availability            |
| POST   | `/api/orders`               | Create an order and reserve seats |
| GET    | `/api/orders/{id}`          | View order details                |
| POST   | `/api/orders/{id}/checkout` | Begin the payment process         |
| POST   | `/api/payments/webhook`     | Receive payment-provider updates  |

The API should validate all input, authenticate customers where required, and return appropriate error responses. Order creation should support idempotency keys so that retrying a request does not create duplicate orders.

## 6. Database Design

### Users

* `id` — primary key
* `name`
* `email` — unique
* `password_hash`
* `created_at`

### Events

* `id` — primary key
* `name`
* `venue`
* `starts_at`
* `created_at`

### Seats

* `id` — primary key
* `event_id` — foreign key to Events
* `seat_number`
* `price`
* `status` — available, reserved, or sold

A unique constraint on `(event_id, seat_number)` prevents duplicate seat records for the same event.

### Orders

* `id` — primary key
* `user_id` — foreign key to Users
* `status` — pending, confirmed, cancelled, or expired
* `total_amount`
* `created_at`

### Order Items

* `id` — primary key
* `order_id` — foreign key to Orders
* `seat_id` — foreign key to Seats
* `price`

The database should also enforce that a seat cannot appear in more than one active or completed booking for the same event. This can be implemented with suitable constraints and booking records, depending on the database design.

## 7. Preventing Double Booking

The database, rather than the frontend alone, must decide who gets a seat.

1. A customer selects a seat.
2. The application starts a database transaction.
3. It locks or atomically updates the selected seat, provided it is still available.
4. It creates an order and a time-limited reservation.
5. The transaction commits if the reservation succeeds.
6. If another customer has already reserved the seat, the request fails and the customer must select another seat.
7. After successful payment, the reservation becomes a confirmed booking.
8. If the reservation expires or payment fails, the seat can become available again.

The application must verify payment-provider notifications before confirming an order. Expiration handling and payment retries must also be designed to avoid selling the same seat twice.

## 8. Scaling and Reliability

* Run multiple application-server instances behind a load balancer.
* Add database indexes for common event, seat, and order queries.
* Use caching for event details, but do not rely on cached seat availability to confirm a purchase.
* Use queues for email and other background tasks.
* Apply rate limits and waiting-room controls during extremely popular sales.
* Monitor response times, error rates, database load, and queue length.
* Back up the database and test recovery procedures.
* Use HTTPS, secure password hashing, access controls, and a trusted payment provider.

## 9. Trade-offs

A relational database with transactions is a strong starting point because ticket sales require consistent seat and order records. However, heavy contention for popular seats can slow transactions.

Caching improves read performance but cannot replace database checks during checkout. Queues help with background work, but they introduce delays and require retry and failure-handling logic.

A waiting room can protect the application during large sales, but customers may have to wait before entering the booking process.

## 10. Conclusion

TicketHub should prioritize correct seat allocation, secure payment handling, and reliable order processing before adding advanced scaling features. Database transactions, appropriate constraints, horizontal application scaling, background queues, monitoring, and load testing provide a practical foundation for a high-traffic ticketing system.
