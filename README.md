# 🚀 FlashSale Engine + Fair Checkout System

A full-stack flash sale system built with **Node.js, Express, PostgreSQL, Redis, and React (Vite)** that allows users to participate in limited-stock flash sales with **fair inventory handling, time-bound checkout, race-safe holds, and real-time admin monitoring**.

This project demonstrates:
- High-concurrency **race-safe stock handling**
- **Redis-based distributed locking**
- **Time-bound inventory holds**
- **Automatic expiry cleanup**
- **Anti-bot throttling (bonus)**
- **Admin analytics dashboard**

---

## 🧩 Features Overview

### ✅ User Side (Storefront)
- View all **live flash sale products**
- See **real-time stock updates**
- Sale **countdown timer**
- Create a **2-minute temporary hold**
- **Checkout before timer expires**
- Order confirmation flow

### ✅ Backend Core
- Race-safe inventory holds using **Redis Locks**
- Automatic **hold expiry cleanup**
- Stock restored on expiration
- Prevents **overselling under heavy traffic**

### ✅ Admin Dashboard
- Total holds created
- Holds expired
- Confirmed orders
- Oversell attempts blocked
- Throttle blocks
- Per-product:
  - Total stock
  - Live stock
  - Pending holds
  - Confirmed orders
  - Expired orders
- **Chart: Sold vs Expired (Last 1 hour)**

### ✅ Bonus Implemented
✅ **Anti-Bot Throttling**
- Max **2 holds per email**
- Max **2 holds per IP**
- Time window: **10 minutes**
- Implemented using **Redis counters**

---

## 🛠️ Tech Stack

### ✅ Backend
- **Node.js**
- **Express.js**
- **PostgreSQL**
- **Prisma ORM**
- **Redis (ioredis)**

### ✅ Frontend
- **React (Vite)**
- **Bootstrap 5**
- **React Router**
- **React Query**
- **Recharts (Admin Chart)**

---

## ⚙️ Complete Project Setup (Step-by-Step)

### ✅ 1. Clone the Repository
```bash
git clone https://github.com/Kanchan-Gore-16/FlashSale.git
cd flashsale
```

---

### ✅ 2. Setup Backend

```bash
cd server
npm install
```

---

### ✅ 3. Setup PostgreSQL Database

Create a database named:

```
flashsale
```

Update `.env` file:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/flashsale"
REDIS_URL="redis://127.0.0.1:6379"
PORT=4000
```

---

### ✅ 4. Run Database Migrations

```bash
npx prisma migrate dev --name init
npx prisma generate
```

---

### ✅ 5. Seed Demo Data

```bash
npm run seed
```

✅ Adds:
- 3 live products
- 1 future product

---

### ✅ 6. Start Redis

#### Option 1: Using Docker (Recommended)

```bash
docker run --name flashsale-redis -p 6379:6379 -d redis
```

#### Option 2: Windows Alternative
Use **Memurai (Redis for Windows)**

---

### ✅ 7. Start Backend Server

```bash
npm run dev
```

Backend runs on:

```
http://localhost:4000
```

---

### ✅ 8. Setup Frontend (React + Vite)

```bash
cd ../client
npm install
npm run dev
```

Frontend runs on:

```
http://localhost:5173
```

---

## 🗄️ Database Schema Diagram (Simplified)

```text
+------------------+
|   products       |
+------------------+
| id (PK)          |
| name             |
| description      |
| price            |
| total_stock      |
| sale_starts_at   |
| sale_ends_at     |
| created_at       |
+------------------+
        |
        | 1-to-many
        |
+------------------+
|   orders         |
+------------------+
| id (PK)          |
| product_id (FK) |
| customer_email  |
| quantity         |
| status           |
| hold_expires_at |
| created_at       |
+------------------+
        |
        | 1-to-many
        |
+--------------------------+
|   inventory_events      |
+--------------------------+
| id (PK)                  |
| product_id (FK)          |
| order_id (FK)            |
| type                     |
| delta                    |
| metadata (json)          |
| created_at               |
+--------------------------+
```

---

## 🔐 Redis Locking Strategy (Race-Safe Stock Handling)

Purpose:
- Prevent **overselling when multiple users click "Buy" at the same time**

Implementation:
- Uses **Redis distributed locks**
- Lock key format:

```
lock:product:<productId>
```

Flow:
1. User tries to create hold
2. Backend acquires Redis lock
3. Checks live stock
4. Creates order + inventory event
5. Releases lock

✅ Ensures **atomic stock decrement**

---

## 🤖 Anti-Bot Throttling Strategy (Bonus)

Implemented in:

```
POST /api/holds
```

Rules:
- Max **2 holds per email per 10 minutes**
- Max **2 holds per IP per 10 minutes**

Redis Keys:
```
throttle:email:<email>
throttle:ip:<ip>
```

Logic:
- Uses `INCR` + `EXPIRE 600`
- If count exceeds `2` → Request blocked with **429**

Admin Metric:
```
throttleBlocked
```

✅ Prevents abuse and automated bots

---

## ⏳ Automatic Expiry Cleanup Job

Runs every **30 seconds**:

Checks:
- Orders where:
  - `status = pending`
  - `hold_expires_at < current time`

Actions:
- Marks order as `expired`
- Restores stock
- Creates inventory event:
```
type: "hold_released"
delta: +quantity
```

✅ Keeps inventory accurate at all times

---

## 📊 Admin Analytics

Endpoint:
```
GET /api/admin/metrics
```

Returns:
- Total holds created
- Holds expired
- Confirmed orders
- Oversell attempts blocked
- Throttle blocks
- Per-product:
  - Total stock
  - Live stock
  - Pending
  - Confirmed
  - Expired
- Chart:
  - Sold vs Expired (last hour)

---

## ⚠️ Assumptions & Trade-offs

### ✅ Assumptions
- No authentication system required
- Email used as user identifier
- Single Redis instance
- Single DB instance

### ⚖️ Trade-offs
- Polling used instead of WebSockets (simpler setup)
- Inventory tracked using **event-based delta system**
- No payment gateway integration
- No real-time sockets (optional bonus not implemented)

---

## ✅ Project Status

✔ Core Features Completed  
✔ All APIs Implemented  
✔ Admin Dashboard Complete  
✔ Bonus Anti-Bot Throttling Implemented  
✔ Bootstrap UI Applied  
✔ Production-Ready Architecture  

---

## 📌 Future Enhancements (Optional)

- WebSockets / SSE for live stock updates
- Waitlist system
- User authentication
- Payment integration

---

## 👨‍💻 Author  
Kanchan Gore   
Full Stack Developer
