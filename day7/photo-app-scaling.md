# SnapShare Scaling Plan

## 1. Assumptions and Estimates

### Assumptions

* SnapShare has 10 million registered users.
* 10% of registered users are active each day.
* Each daily active user uploads 1 photo per day.
* Each daily active user views 50 feed pages per day.
* An average original photo is 2 MB.
* Each photo also has one 50 KB thumbnail.
* A day has 86,400 seconds.
* A year is assumed to have 365 days.
* For peak traffic, I use 5 times the average traffic.
* These calculations are averages; real traffic may be higher at particular times.

### Daily Active Users

10,000,000 × 10% = **1,000,000 daily active users**

### Uploads per Second

1,000,000 users × 1 photo per day = **1,000,000 uploads per day**

1,000,000 ÷ 86,400 ≈ **11.6 uploads per second**

Peak uploads:

11.6 × 5 ≈ **57.9 uploads per second**

### Feed Views per Second

1,000,000 users × 50 feed pages per day = **50,000,000 feed views per day**

50,000,000 ÷ 86,400 ≈ **579 feed views per second**

Peak feed views:

579 × 5 ≈ **2,894 feed views per second**

### Photo Storage per Year

Each photo requires:

* Original photo = 2 MB
* Thumbnail = 50 KB = 0.05 MB
* Total = **2.05 MB per photo**

There are 1,000,000 new photos per day.

1,000,000 × 2.05 MB = **2,050,000 MB per day**

This is approximately **2.05 TB per day**.

For one year:

2.05 TB × 365 = **748.25 TB per year**

So SnapShare needs approximately **748 TB of photo and thumbnail storage per year**, before considering backups, replication, or other overhead.

---

## 2. Read-Heavy or Write-Heavy?

SnapShare is **read-heavy**.

There are approximately 11.6 photo uploads per second but about 579 feed views per second on average. This means the system handles far more reading than writing.

Because the system is read-heavy, the design should focus on making feed requests fast by using caching, a CDN, and a database read replica. The application should also avoid sending large photo files through the application servers whenever possible.

---

## 3. Why Photos Should Not Be Stored Inside the Database

Photos should not be stored directly inside the database because large binary files would consume a lot of database storage, increase backup size, and make database operations slower and more expensive.

Instead, the original photos and thumbnails should be stored in **object storage**, while the database stores metadata such as the photo ID, owner, file location, upload time, and thumbnail location.

---

## 4. Architecture Diagram

```text
                         ┌───────────────┐
                         │     Users     │
                         └───────┬───────┘
                                 │
                                 ▼
                         ┌───────────────┐
                         │      CDN      │
                         └───────┬───────┘
                                 │
                                 ▼
                         ┌───────────────┐
                         │ Load Balancer │
                         └───────┬───────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
             ┌──────────────┐          ┌──────────────┐
             │  App Server  │          │  App Server  │
             └──────┬───────┘          └──────┬───────┘
                    │                         │
                    └────────────┬────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
              ▼                  ▼                  ▼
        ┌───────────┐      ┌────────────┐     ┌──────────────┐
        │   Cache   │      │  Database  │     │ Object       │
        │           │      │   Primary  │     │ Storage      │
        └───────────┘      └─────┬──────┘     │ Photos +     │
                                 │            │ Thumbnails   │
                                 ▼            └──────────────┘
                          ┌──────────────┐
                          │ Read Replica │
                          └──────────────┘

             Upload processing:
             App Server
                  │
                  ▼
             ┌───────────┐
             │   Queue   │
             └─────┬─────┘
                   │
                   ▼
             ┌───────────┐
             │  Worker   │
             │ Thumbnail │
             └─────┬─────┘
                   │
                   ▼
             Object Storage
```

---

## 5. What Each Component Does

* **CDN:** Delivers frequently requested photos and thumbnails from locations close to users, reducing latency and load on the servers.
* **Load Balancer:** Distributes incoming requests across multiple app servers so no single server becomes overloaded.
* **App Servers:** Handle application logic such as authentication, uploads, feed requests, and database operations.
* **Cache:** Stores frequently requested data such as popular feed information so the database does not have to answer every request.
* **Database:** Stores structured information such as users, follows, photo metadata, and feed information.
* **Read Replica:** Provides a separate database copy for read requests, helping the system handle the high number of feed views.
* **Object Storage:** Stores the large original photo files and thumbnails without placing them inside the database.
* **Queue:** Holds thumbnail-processing jobs so uploading a photo does not have to wait for thumbnail creation.
* **Worker:** Takes jobs from the queue and creates thumbnails from uploaded photos.

---

## 6. Photo Upload Flow

1. The user selects a photo in the SnapShare app.
2. The app sends the upload request to the load balancer.
3. The load balancer sends the request to an available app server.
4. The app server validates the user and upload information.
5. The original photo is stored in object storage.
6. The app server creates a thumbnail-processing job and places it in the queue.
7. The app server saves the photo metadata and object-storage location in the database.
8. A worker takes the job from the queue.
9. The worker creates the 50 KB thumbnail.
10. The worker stores the thumbnail in object storage.
11. The thumbnail location is saved with the photo metadata.
12. The CDN can then serve the original photo and thumbnail quickly to users.

---

## 7. Trade-Offs

### Trade-Off 1: Cache Speed vs Freshness

Caching makes feed requests much faster and reduces database load, but cached information may become slightly outdated. The system therefore needs a strategy for expiring or updating cached data.

### Trade-Off 2: Queue Processing vs Immediate Results

Using a queue makes photo uploads faster because thumbnail creation happens in the background. However, the thumbnail may not be available immediately after the upload.

### Trade-Off 3: Read Replica vs Data Consistency

A read replica improves read performance and allows the database to handle more feed requests, but there can be a short delay before new data appears on the replica.

### Trade-Off 4: Object Storage vs Simplicity

Object storage is much better for large photo files and scaling, but it adds another service to manage compared with storing everything directly in the database.

---

## Conclusion

SnapShare should use a read-heavy architecture because feed views greatly outnumber photo uploads. A CDN, cache, read replica, and multiple app servers help handle the large number of reads, while object storage, a queue, and thumbnail workers allow photo uploads and processing to scale independently.
