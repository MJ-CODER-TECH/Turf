# TurfZone Backend API 🏟️

Production-grade REST API for TurfZone — India's fastest turf booking platform.

**Stack:** Node.js · Express · MongoDB · Razorpay · Twilio · Nodemailer · Cloudinary · Redis

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your credentials

# 3. Seed database (optional)
npm run seed

# 4. Start server
npm run dev        # development (nodemon)
npm start          # production
```

---

## 📁 Project Structure

```
turfzone/
├── server.js              # Entry point
├── config/
│   └── database.js        # MongoDB connection
├── controllers/
│   ├── authController.js  # Auth logic
│   ├── bookingController.js
│   └── turfController.js
├── middleware/
│   ├── auth.js            # JWT protect + authorize
│   ├── errorHandler.js    # Global error handler
│   └── notFound.js        # 404 handler
├── models/
│   ├── User.js            # User schema + methods
│   ├── Turf.js            # Turf schema
│   ├── Booking.js         # Booking schema
│   ├── Review.js          # Review schema
│   └── Notification.js    # Notification schema
├── routes/
│   ├── auth.js            # /api/v1/auth/*
│   ├── turfs.js           # /api/v1/turfs/*
│   ├── bookings.js        # /api/v1/bookings/*
│   ├── reviews.js         # /api/v1/reviews/*
│   ├── payments.js        # /api/v1/payments/*
│   ├── users.js           # /api/v1/users/*
│   ├── locations.js       # /api/v1/locations/*
│   ├── sports.js          # /api/v1/sports/*
│   ├── notifications.js   # /api/v1/notifications/*
│   ├── admin.js           # /api/v1/admin/*
│   └── uploads.js         # /api/v1/uploads/*
├── services/
│   ├── emailService.js    # Nodemailer + templates
│   ├── smsService.js      # Twilio SMS
│   └── paymentService.js  # Razorpay
└── utils/
    ├── logger.js           # Winston logger
    ├── cronJobs.js         # Scheduled tasks
    └── seeder.js           # DB seeder
```

---

## 🔑 API Endpoints

### Auth — `/api/v1/auth`
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/register` | Register new user | ❌ |
| POST | `/login` | Login | ❌ |
| POST | `/logout` | Logout | ✅ |
| GET | `/me` | Get current user | ✅ |
| POST | `/send-otp` | Send phone OTP | ✅ |
| POST | `/verify-phone` | Verify phone OTP | ✅ |
| GET | `/verify-email/:token` | Verify email | ❌ |
| POST | `/forgot-password` | Send reset email | ❌ |
| PUT | `/reset-password/:token` | Reset password | ❌ |
| PUT | `/change-password` | Change password | ✅ |
| POST | `/refresh-token` | Refresh JWT | ❌ |

### Turfs — `/api/v1/turfs`
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | All turfs (with filters) | ❌ |
| GET | `/featured` | Featured turfs | ❌ |
| GET | `/cities` | All cities | ❌ |
| GET | `/:id` | Single turf (id or slug) | ❌ |
| POST | `/` | Create turf | owner/admin |
| PUT | `/:id` | Update turf | owner/admin |
| DELETE | `/:id` | Deactivate turf | owner/admin |
| GET | `/:id/stats` | Turf analytics | owner/admin |

### Bookings — `/api/v1/bookings`
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/availability?turfId&date` | Check slot availability | ❌ |
| GET | `/my` | My bookings | ✅ |
| POST | `/initiate` | Step 1: Create Razorpay order | ✅ |
| POST | `/confirm` | Step 2: Verify payment | ✅ |
| GET | `/:id` | Booking details | ✅ |
| POST | `/:id/cancel` | Cancel booking + refund | ✅ |
| POST | `/webhook` | Razorpay webhook | ❌ |

### Query Params for `GET /turfs`
```
?search=green arena
?sport=Football
?city=Mumbai
?minPrice=500&maxPrice=1500
?rating=4.5
?amenities=Parking,Floodlit
?isFeatured=true
?sort=price_asc|price_desc|rating|popular|new
?page=1&limit=12
?lat=19.11&lng=72.83&radius=5
```

---

## 📧 Email Notifications
- ✅ Welcome email
- ✅ Email verification link
- ✅ Booking confirmation (with full details)
- ✅ Booking cancellation + refund info
- ✅ 24-hour reminder
- ✅ 1-hour reminder
- ✅ Password reset link
- ✅ Payment failed alert
- ✅ OTP email

## 📱 SMS Notifications (Twilio)
- ✅ OTP verification
- ✅ Booking confirmed
- ✅ Booking cancelled + refund
- ✅ 24h & 1h reminders
- ✅ Payment success/failed
- ✅ Refund processed
- ✅ Welcome SMS

## 💳 Payment Flow (Razorpay)
```
Frontend → POST /bookings/initiate
       ← razorpayOrderId + amount

Frontend → Opens Razorpay checkout
        → User pays

Frontend → POST /bookings/confirm
        → { razorpayOrderId, razorpayPaymentId, razorpaySignature }
       ← Booking confirmed + SMS + Email
```

---

## ⏰ Cron Jobs
| Time | Job |
|------|-----|
| Daily 9:00 AM IST | Send 24h booking reminders |
| Every hour :00 | Send 1h booking reminders |
| Daily 12:05 AM IST | Mark past bookings as 'completed' |
| Every 15 mins | Auto-cancel expired pending bookings |

---

## 🔒 Security Features
- Helmet.js headers
- Rate limiting (100/15min global, 20/15min auth)
- MongoDB sanitization (NoSQL injection prevention)
- HPP (HTTP Parameter Pollution prevention)
- JWT with refresh tokens
- Password hashing (bcrypt, 12 rounds)
- CORS whitelist
- Input validation (express-validator)
- Gzip compression

---

## 🧪 Test Credentials (after seeding)
```
Admin:  admin@turfzone.in   / Admin@1234
Owner:  owner1@turfzone.in  / Owner@1234
Player: player@turfzone.in  / Player@1234
```

---

## 🌐 Production Deployment

```bash
# Environment
NODE_ENV=production
MONGO_URI=mongodb+srv://...
JWT_SECRET=<strong-random-secret-min-32-chars>

# Process manager
npm install -g pm2
pm2 start server.js --name turfzone-api
pm2 save
pm2 startup

# Nginx reverse proxy
# proxy_pass http://localhost:5000;
```

---

## 📞 Support
Email: dev@turfzone.in | Docs: docs.turfzone.in
