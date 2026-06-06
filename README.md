<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white" alt="Socket.IO" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
</p>

# 🏥 Flow Backend

> A robust, real-time clinic queue management system built with modern technologies. Designed to eliminate long waiting times at clinics by digitizing the queue experience.

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Docker Deployment](#-docker-deployment)
- [API Documentation](#-api-documentation)
- [WebSocket Events](#-websocket-events)
- [Database Schema](#-database-schema)
- [Environment Variables](#-environment-variables)

## 🎯 Overview

Flow is a comprehensive queue management solution for healthcare facilities. It enables patients to join virtual queues, receive real-time updates on their position, and get notified when it's their turn — all without physically waiting at the clinic.

### Problem Statement

- Patients waste hours waiting in clinic queues
- No visibility into wait times or queue position
- Clinics struggle to manage patient flow efficiently

### Solution

- Digital token-based queue system
- Real-time updates via WebSocket
- Role-based access for patients, staff, and admins
- Scalable architecture supporting multiple clinics

## ✨ Features

### 🔐 Authentication & Authorization

- **JWT-based authentication** with access & refresh token rotation
- **Secure session management** with device tracking (user agent, IP)
- **Role-Based Access Control (RBAC)** - Patient, Staff, Admin
- **Password hashing** with bcrypt (salt rounds: 10)
- **Auto-generated profile pictures** using DiceBear API

### 🏥 Clinic Management

- Create and manage multiple clinic profiles
- Support for various specializations (General Practice, Pediatrics, Dermatology, etc.)
- Staff assignment and management
- Configurable opening hours
- Clinic images and logo upload via Cloudinary

### 📋 Queue System

- **Daily queue initialization** with configurable max capacity
- **Automatic token numbering** with atomic transactions
- **Real-time queue status** broadcasting
- **Token lifecycle management**: WAITING → CALLED → IN_PROGRESS → COMPLETED/SKIPPED

### ⚡ Real-Time Features

- **Socket.IO integration** for instant updates
- **Room-based architecture** for efficient broadcasting
- **Patient notifications** when their token is called
- **Live queue status updates** for all connected clients

### 🔄 Background Processing

- **BullMQ** powered job queue for async operations
- **Concurrent image processing** (10 workers)
- **Automatic database updates** on job completion

### 🚀 Performance Optimizations

- **Redis caching** for user profiles and queue status
- **Database indexing** on frequently queried columns
- **Transaction-based operations** ensuring data consistency
- **Connection pooling** via Prisma

## 🛠 Tech Stack

| Category             | Technology         |
| -------------------- | ------------------ |
| **Runtime**          | Node.js 20+        |
| **Language**         | TypeScript 5.9     |
| **Framework**        | Express 5.x        |
| **Database**         | PostgreSQL         |
| **ORM**              | Prisma 6.x         |
| **Cache/Queue**      | Redis (ioredis)    |
| **Real-time**        | Socket.IO 4.x      |
| **Job Queue**        | BullMQ 5.x         |
| **Validation**       | Zod 4.x            |
| **Authentication**   | JWT (jsonwebtoken) |
| **File Upload**      | Cloudinary         |
| **Password Hashing** | bcryptjs           |
| **Containerization** | Docker & Compose   |

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Mobile App                               │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY                                │
│                    (Express 5.x)                                │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐  │
│  │   Auth API   │  Clinic API  │  Queue API   │  Token API   │  │
│  └──────────────┴──────────────┴──────────────┴──────────────┘  │
└─────────────────────┬───────────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
┌──────────────┐ ┌──────────┐ ┌──────────────┐
│  Socket.IO   │ │  BullMQ  │ │    Redis     │
│  (Real-time) │ │  (Jobs)  │ │   (Cache)    │
└──────────────┘ └──────────┘ └──────────────┘
        │             │             │
        └─────────────┼─────────────┘
                      ▼
              ┌──────────────┐
              │  PostgreSQL  │
              │   (Prisma)   │
              └──────────────┘
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- Redis 7+
- Cloudinary account (for image uploads)
- Docker & Docker Compose (optional, for containerized deployment)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/flow-backend.git
cd flow-backend

# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Build the project
npm run build

# Start the server
npm run dev
```

## 🐳 Docker Deployment

The project is fully containerized using Docker with multi-stage builds for optimized production images.

### Docker Image

The Dockerfile uses a multi-stage build approach:

1. **Builder Stage**: Installs dependencies, generates Prisma client, and compiles TypeScript
2. **Runner Stage**: Contains only production dependencies and compiled code for a smaller image footprint

```dockerfile
# Build image locally
docker build -t flow-backend .

# Run container
docker run -p 8080:8080 --env-file .env flow-backend
```

### Docker Compose

The easiest way to run the entire stack is with Docker Compose:

```bash
# Start all services (backend, image worker, redis)
docker compose up -d

# View logs
docker compose logs -f

# Stop all services
docker compose down

# Stop and remove volumes
docker compose down -v
```

### Services Overview

| Service        | Container Name | Port   | Description                        |
| -------------- | -------------- | ------ | ---------------------------------- |
| `flow-backend` | flow-backend   | `8080` | Main API server with Socket.IO     |
| `image-worker` | image-worker   | -      | BullMQ worker for image processing |
| `redis`        | redis          | `6379` | Redis for caching and job queues   |

### Docker Compose Configuration

```yaml
version: "3.8"

services:
  redis:
    image: redis:7
    container_name: redis
    ports:
      - "6379:6379"
    networks:
      - flow-network
    volumes:
      - redis_data:/data
    restart: unless-stopped

  flow-backend:
    image: manpreet3033/flow-backend
    container_name: flow-backend
    command: npm run dev
    ports:
      - "8080:8080"
    networks:
      - flow-network
    env_file:
      - .env
    restart: unless-stopped
    depends_on:
      - redis

  image-worker:
    image: manpreet3033/flow-backend
    container_name: image-worker
    command: npm run image:worker
    networks:
      - flow-network
    env_file:
      - .env
    restart: unless-stopped
    depends_on:
      - redis

volumes:
  redis_data:

networks:
  flow-network:
    driver: bridge
```

### Environment Setup for Docker

Ensure your `.env` file contains the correct configuration:

```env
# For Docker Compose, use service names for internal networking
REDIS_URL=redis://redis:6379

# External PostgreSQL (or add postgres service to docker-compose)
DATABASE_URL=postgresql://user:password@host:5432/flow_db
```

> 💡 **Tip**: When running with Docker Compose, services can communicate using their service names (e.g., `redis` instead of `localhost`).

## 📚 API Documentation

### Base URL

```
http://localhost:3000/api
```

### API Overview

| Method   | Endpoint                      | Auth Required | Role        | Description                    |
| -------- | ----------------------------- | ------------- | ----------- | ------------------------------ |
| `GET`    | `/health`                     | ❌            | Public      | Health check                   |
| `POST`   | `/api/auth/register`          | ❌            | Public      | Register new user              |
| `POST`   | `/api/auth/login`             | ❌            | Public      | Login user                     |
| `POST`   | `/api/auth/logout`            | ❌            | Public      | Logout & revoke refresh token  |
| `POST`   | `/api/auth/refresh-token`     | ❌            | Public      | Refresh access token           |
| `GET`    | `/api/auth/me`                | ✅            | Any         | Get current user profile       |
| `PUT`    | `/api/auth/me`                | ✅            | Any         | Update user profile            |
| `PUT`    | `/api/auth/update-password`   | ✅            | Any         | Update user password           |
| `POST`   | `/api/clinic`                 | ✅            | Admin       | Create new clinic              |
| `GET`    | `/api/clinic`                 | ✅            | Any         | Get clinics (with geo-filter)  |
| `GET`    | `/api/clinic/:clinicId`       | ✅            | Any         | Get clinic by ID               |
| `PATCH`  | `/api/clinic/:clinicId`       | ✅            | Admin       | Update clinic                  |
| `POST`   | `/api/clinic/:clinicId/staff` | ✅            | Admin       | Add staff to clinic            |
| `GET`    | `/api/clinic/:clinicId/staff` | ✅            | Admin/Staff | Get clinic staff members       |
| `POST`   | `/api/queues/init/:clinicId`  | ✅            | Admin/Staff | Initialize daily queue         |
| `GET`    | `/api/queues/:clinicId`       | ✅            | Any         | Get queue by clinic ID (today) |
| `GET`    | `/api/queues/:queueId/status` | ✅            | Any         | Get queue status               |
| `PATCH`  | `/api/queues/:queueId/status` | ✅            | Admin/Staff | Activate/deactivate queue      |
| `POST`   | `/api/tokens`                 | ✅            | Patient     | Generate token for queue       |
| `GET`    | `/api/tokens/:patientId`      | ✅            | Patient     | Get patient's waiting token    |
| `DELETE` | `/api/tokens/:tokenId`        | ✅            | Patient     | Delete own token               |

---

### Health Check

```http
GET /health
```

**Response:**

```json
{
  "health": "ok",
  "timestamp": "2025-12-30T10:00:00.000Z",
  "version": "1.0.0",
  "message": "Server is running"
}
```

---

### 🔐 Authentication Endpoints

#### Register a new user

```http
POST /api/auth/register
Content-Type: application/json
```

**Request Body:**

| Field             | Type     | Required | Validation            |
| ----------------- | -------- | -------- | --------------------- |
| `firstName`       | `string` | ✅       | Min 3 characters      |
| `lastName`        | `string` | ✅       | Min 3 characters      |
| `email`           | `string` | ✅       | Valid email format    |
| `password`        | `string` | ✅       | Min 6 characters      |
| `confirmPassword` | `string` | ✅       | Must match `password` |

**Example:**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "confirmPassword": "securePassword123"
}
```

#### Login

```http
POST /api/auth/login
Content-Type: application/json
```

**Request Body:**

| Field        | Type     | Required | Validation                                   |
| ------------ | -------- | -------- | -------------------------------------------- |
| `email`      | `string` | ✅       | Valid email format                           |
| `password`   | `string` | ✅       | Min 6 characters                             |
| `deviceInfo` | `object` | ❌       | `{ userAgent: string }` for session tracking |

**Example:**

```json
{
  "email": "john@example.com",
  "password": "securePassword123",
  "deviceInfo": {
    "userAgent": "Mozilla/5.0..."
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "PATIENT",
      "clinicId": null,
      "profilePicture": "https://..."
    },
    "accessToken": "eyJhbG...",
    "refreshToken": "abc123..."
  }
}
```

#### Get Current User Profile

```http
GET /api/auth/me
Authorization: Bearer <access_token>
```

> 🚀 **Cached:** Response is cached in Redis for 24 hours

#### Refresh Access Token

```http
POST /api/auth/refresh-token
Content-Type: application/json
```

**Request Body:**

| Field          | Type     | Required | Description                                  |
| -------------- | -------- | -------- | -------------------------------------------- |
| `refreshToken` | `string` | ✅       | Valid refresh token from login               |
| `deviceInfo`   | `object` | ❌       | `{ userAgent: string }` for session tracking |

**Example:**

```json
{
  "refreshToken": "abc123...",
  "deviceInfo": {
    "userAgent": "Mozilla/5.0..."
  }
}
```

#### Logout

```http
POST /api/auth/logout
Content-Type: application/json
```

**Request Body:**

| Field          | Type     | Required | Description             |
| -------------- | -------- | -------- | ----------------------- |
| `refreshToken` | `string` | ✅       | Refresh token to revoke |

**Example:**

```json
{
  "refreshToken": "abc123..."
}
```

#### Update Profile

```http
PUT /api/auth/me
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Request Body:**

| Field            | Type     | Required | Validation       |
| ---------------- | -------- | -------- | ---------------- |
| `firstName`      | `string` | ❌       | Min 3 characters |
| `lastName`       | `string` | ❌       | Min 3 characters |
| `profilePicture` | `file`   | ❌       | Image file       |

> 💡 **Note:** Profile picture is optional. If provided, it will be processed asynchronously via BullMQ and uploaded to Cloudinary.

**Example:**

```json
{
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": null
}
```

#### Update Password

```http
PUT /api/auth/update-password
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**

| Field                | Type     | Required | Validation               |
| -------------------- | -------- | -------- | ------------------------ |
| `oldPassword`        | `string` | ✅       | Min 6 characters         |
| `newPassword`        | `string` | ✅       | Min 6 characters         |
| `confirmNewPassword` | `string` | ✅       | Must match `newPassword` |

**Example:**

```json
{
  "oldPassword": "currentPassword123",
  "newPassword": "newSecurePassword456",
  "confirmNewPassword": "newSecurePassword456"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "PATIENT",
    "clinicId": null,
    "profilePicture": "https://..."
  }
}
```

> ⚠️ **Validation Rules:**
>
> - Old password must match the current password
> - New password must be different from the old password
> - New password and confirm password must match

---

### 🏥 Clinic Endpoints

#### Create a Clinic (Admin Only)

```http
POST /api/clinic
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Request Body:**

| Field          | Type     | Required | Validation / Description                                                                                             |
| -------------- | -------- | -------- | -------------------------------------------------------------------------------------------------------------------- |
| `name`         | `string` | ✅       | Min 1 character                                                                                                      |
| `latitude`     | `number` | ✅       | Clinic's latitude coordinate                                                                                         |
| `longitude`    | `number` | ✅       | Clinic's longitude coordinate                                                                                        |
| `address`      | `string` | ❌       | Street address                                                                                                       |
| `phone`        | `string` | ❌       | Must be exactly 10 digits                                                                                            |
| `email`        | `string` | ❌       | Valid email format                                                                                                   |
| `website`      | `string` | ❌       | Valid URL                                                                                                            |
| `description`  | `string` | ❌       | Clinic description                                                                                                   |
| `logo`         | `file`   | ❌       | Image file (processed via BullMQ → Cloudinary)                                                                       |
| `images`       | `file[]` | ❌       | Multiple image files                                                                                                 |
| `openingHours` | `json`   | ❌       | `{"start": "09:00", "end": "17:00"}` (default: 09:00-17:00)                                                          |
| `type`         | `enum`   | ❌       | One of: `GENERAL_PRACTICE`, `PEDIATRICS`, `DERMATOLOGY`, `PSYCHIATRY`, `GYNECOLOGY`, `ORTHOPEDICS`, `ENT`, `DENTIST` |

**Example:**

```json
{
  "name": "City Health Clinic",
  "address": "123 Main Street",
  "latitude": 40.7128,
  "longitude": -74.006,
  "phone": "1234567890",
  "email": "contact@cityclinic.com",
  "type": "GENERAL_PRACTICE",
  "openingHours": "{\"start\": \"09:00\", \"end\": \"17:00\"}"
}
```

#### Get All Clinics (with Geolocation & Pagination)

```http
GET /api/clinic
Authorization: Bearer <access_token>
```

**Query Parameters:**

| Parameter   | Type     | Required | Default | Description                                                                                                                         |
| ----------- | -------- | -------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `latitude`  | `number` | ❌       | -       | User's current latitude (for proximity search)                                                                                      |
| `longitude` | `number` | ❌       | -       | User's current longitude (for proximity search)                                                                                     |
| `radius`    | `number` | ❌       | -       | Search radius in kilometers                                                                                                         |
| `query`     | `string` | ❌       | -       | Search clinics by name (case-insensitive)                                                                                           |
| `type`      | `enum`   | ❌       | -       | Filter by clinic type: `GENERAL_PRACTICE`, `PEDIATRICS`, `DERMATOLOGY`, `PSYCHIATRY`, `GYNECOLOGY`, `ORTHOPEDICS`, `ENT`, `DENTIST` |
| `page`      | `number` | ❌       | `1`     | Page number for pagination                                                                                                          |
| `limit`     | `number` | ❌       | `10`    | Number of results per page                                                                                                          |

**Example Requests:**

```http
# Get all clinics with pagination
GET /api/clinic?page=1&limit=20

# Find clinics within 5km radius of user location
GET /api/clinic?latitude=40.7128&longitude=-74.0060&radius=5&page=1&limit=10

# Search clinics by name
GET /api/clinic?query=city%20health&page=1&limit=10

# Filter by clinic type
GET /api/clinic?type=DENTIST&page=1&limit=10

# Combined: Find dentists within 10km, sorted by distance
GET /api/clinic?latitude=40.7128&longitude=-74.0060&radius=10&type=DENTIST&page=1&limit=10
```

> 🚀 **Cached:** Results are cached in Redis for 15 minutes (unique cache key per filter combination)
>
> 📍 **Geolocation:** When `latitude`, `longitude`, and `radius` are provided, uses Haversine formula to calculate distances and returns clinics sorted by proximity with `distance_km` field

**Response (with pagination):**

```json
{
  "success": true,
  "data": {
    "clinics": [
      {
        "id": "uuid",
        "name": "City Health Clinic",
        "address": "123 Main Street",
        "latitude": 40.7128,
        "longitude": -74.006,
        "phone": "1234567890",
        "email": "contact@cityclinic.com",
        "type": "GENERAL_PRACTICE",
        "distance_km": 0.5
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalCount": 47,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

**Pagination Object:**

| Field         | Type      | Description                             |
| ------------- | --------- | --------------------------------------- |
| `page`        | `number`  | Current page number                     |
| `limit`       | `number`  | Results per page                        |
| `totalCount`  | `number`  | Total number of matching clinics        |
| `totalPages`  | `number`  | Total number of pages                   |
| `hasNextPage` | `boolean` | Whether there are more pages after this |
| `hasPrevPage` | `boolean` | Whether there are pages before this     |

#### Get Clinic by ID

```http
GET /api/clinic/:clinicId
Authorization: Bearer <access_token>
```

**Path Parameters:**

| Parameter  | Type   | Required | Validation |
| ---------- | ------ | -------- | ---------- |
| `clinicId` | `uuid` | ✅       | Valid UUID |

> 🚀 **Cached:** Response is cached in Redis for 24 hours

#### Update Clinic (Admin Only)

```http
PATCH /api/clinic/:clinicId
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Path Parameters:**

| Parameter  | Type   | Required | Validation |
| ---------- | ------ | -------- | ---------- |
| `clinicId` | `uuid` | ✅       | Valid UUID |

**Request Body:**

All fields are optional. Only include the fields you want to update.

| Field          | Type     | Required | Validation / Description                                                                                             |
| -------------- | -------- | -------- | -------------------------------------------------------------------------------------------------------------------- |
| `name`         | `string` | ❌       | Min 1 character                                                                                                      |
| `address`      | `string` | ❌       | Street address                                                                                                       |
| `latitude`     | `number` | ❌       | Clinic's latitude coordinate                                                                                         |
| `longitude`    | `number` | ❌       | Clinic's longitude coordinate                                                                                        |
| `phone`        | `string` | ❌       | Must be exactly 10 digits                                                                                            |
| `email`        | `string` | ❌       | Valid email format                                                                                                   |
| `website`      | `string` | ❌       | Valid URL                                                                                                            |
| `description`  | `string` | ❌       | Clinic description                                                                                                   |
| `openingHours` | `json`   | ❌       | `{"start": "09:00", "end": "17:00"}` (JSON object with start and end times)                                          |
| `type`         | `enum`   | ❌       | One of: `GENERAL_PRACTICE`, `PEDIATRICS`, `DERMATOLOGY`, `PSYCHIATRY`, `GYNECOLOGY`, `ORTHOPEDICS`, `ENT`, `DENTIST` |

**Example:**

```json
{
  "name": "Updated Clinic Name",
  "address": "456 New Street",
  "latitude": 40.758,
  "longitude": -73.9855,
  "phone": "9876543210",
  "email": "newemail@clinic.com",
  "type": "PEDIATRICS",
  "openingHours": {
    "start": "08:00",
    "end": "18:00"
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Clinic updated successfully",
  "data": null
}
```

#### Add Staff to Clinic (Admin Only)

```http
POST /api/clinic/:clinicId/staff
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Path Parameters:**

| Parameter  | Type   | Required | Validation |
| ---------- | ------ | -------- | ---------- |
| `clinicId` | `uuid` | ✅       | Valid UUID |

**Request Body:**

| Field    | Type   | Required | Validation                  |
| -------- | ------ | -------- | --------------------------- |
| `userId` | `uuid` | ✅       | Valid UUID of existing user |

> ⚠️ **Note:** User must not be already assigned to another clinic and cannot be an ADMIN

**Example:**

```json
{
  "userId": "user-uuid-here"
}
```

#### Get Clinic Staff Members (Admin/Staff Only)

```http
GET /api/clinic/:clinicId/staff
Authorization: Bearer <access_token>
```

**Path Parameters:**

| Parameter  | Type   | Required | Validation |
| ---------- | ------ | -------- | ---------- |
| `clinicId` | `uuid` | ✅       | Valid UUID |

> 🚀 **Cached:** Response is cached in Redis for 24 hours

---

### 📋 Queue Endpoints

#### Initialize Daily Queue (Admin/Staff Only)

```http
POST /api/queues/init/:clinicId
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Path Parameters:**

| Parameter  | Type   | Required | Validation |
| ---------- | ------ | -------- | ---------- |
| `clinicId` | `uuid` | ✅       | Valid UUID |

**Request Body:**

| Field          | Type     | Required | Default | Description                          |
| -------------- | -------- | -------- | ------- | ------------------------------------ |
| `maxQueueSize` | `number` | ❌       | `50`    | Maximum number of tokens for the day |

> ⚠️ **Note:** Only one queue can be created per clinic per day. Queue times are derived from clinic's `openingHours`.

**Example:**

```json
{
  "maxQueueSize": 100
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "queue-uuid",
    "clinicId": "clinic-uuid",
    "queueDate": "2025-12-30T00:00:00.000Z",
    "currentTokenNo": 0,
    "maxQueueSize": 100,
    "startTime": "2025-12-30T09:00:00.000Z",
    "endTime": "2025-12-30T17:00:00.000Z",
    "isActive": true
  }
}
```

#### Get Queue by Clinic ID

```http
GET /api/queues/:clinicId
Authorization: Bearer <access_token>
```

**Path Parameters:**

| Parameter  | Type   | Required | Validation |
| ---------- | ------ | -------- | ---------- |
| `clinicId` | `uuid` | ✅       | Valid UUID |

> ⚠️ **Note:** Returns the queue for the current date (UTC). If no queue exists for today, returns an error.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "queue-uuid",
    "clinicId": "clinic-uuid",
    "queueDate": "2025-12-30T00:00:00.000Z",
    "currentTokenNo": 0,
    "isActive": true,
    "createdAt": "2025-12-30T01:00:00.000Z",
    "updatedAt": "2025-12-30T01:00:00.000Z",
    "maxQueueSize": 50,
    "startTime": "2025-12-30T13:00:00.000Z",
    "endTime": "2025-12-30T22:00:00.000Z"
  }
}
```

> 💡 **Note:** Times are stored in UTC. Opening hours are converted from EST (UTC-5) to UTC for storage.

#### Get Queue Status

```http
GET /api/queues/:queueId/status
Authorization: Bearer <access_token>
```

**Path Parameters:**

| Parameter | Type   | Required | Validation |
| --------- | ------ | -------- | ---------- |
| `queueId` | `uuid` | ✅       | Valid UUID |

> 🚀 **Cached:** Response is cached in Redis for 15 minutes (invalidated on token updates)

**Response:**

```json
{
  "success": true,
  "data": {
    "queueId": "uuid",
    "currentTokenNo": 5,
    "waitingCount": 12,
    "startTime": "2025-12-30T09:00:00.000Z",
    "endTime": "2025-12-30T17:00:00.000Z"
  }
}
```

#### Activate/Deactivate Queue (Admin/Staff Only)

```http
PATCH /api/queues/:queueId/status
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Path Parameters:**

| Parameter | Type   | Required | Validation |
| --------- | ------ | -------- | ---------- |
| `queueId` | `uuid` | ✅       | Valid UUID |

**Request Body:**

| Field      | Type      | Required | Description                               |
| ---------- | --------- | -------- | ----------------------------------------- |
| `isActive` | `boolean` | ✅       | `true` to activate, `false` to deactivate |

> ⚠️ **Note:** When a queue is deactivated (`isActive: false`), patients cannot generate new tokens for that queue. Existing tokens remain valid.

**Example:**

```json
{
  "isActive": true
}
```

**Response:**

```json
{
  "success": true,
  "message": "Queue activated successfully",
  "data": {
    "id": "queue-uuid",
    "clinicId": "clinic-uuid",
    "queueDate": "2025-12-30T00:00:00.000Z",
    "currentTokenNo": 5,
    "maxQueueSize": 50,
    "isActive": true,
    "startTime": "2025-12-30T09:00:00.000Z",
    "endTime": "2025-12-30T17:00:00.000Z",
    "createdAt": "2025-12-30T01:00:00.000Z",
    "updatedAt": "2025-12-30T10:30:00.000Z"
  }
}
```

> 💡 **Note:** Queue status cache is automatically cleared when the queue is activated/deactivated.

---

### 🎫 Token Endpoints

#### Generate Token for Queue (Patient Only)

```http
POST /api/tokens
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**

| Field     | Type   | Required | Validation                              |
| --------- | ------ | -------- | --------------------------------------- |
| `queueId` | `uuid` | ✅       | Valid UUID of an active queue for today |

> ⚠️ **Validation Rules:**
>
> - Patient cannot have multiple active (WAITING) tokens in the same queue
> - Queue must exist and be active for the current date
> - Token numbers are auto-incremented atomically within a transaction

**Example:**

```json
{
  "queueId": "queue-uuid"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "token-uuid",
    "queueId": "queue-uuid",
    "patientId": "patient-uuid",
    "tokenNumber": 15,
    "status": "WAITING",
    "createdAt": "2025-12-30T10:30:00.000Z"
  }
}
```

**Token Status Flow:**

```
WAITING → CALLED → COMPLETED
    ↓
  SKIPPED
```

#### Get Patient's Token (Patient Only)

```http
GET /api/tokens/:patientId
Authorization: Bearer <access_token>
```

**Path Parameters:**

| Parameter   | Type   | Required | Validation                |
| ----------- | ------ | -------- | ------------------------- |
| `patientId` | `uuid` | ✅       | Valid UUID of the patient |

> ⚠️ **Note:** Returns the patient's current WAITING token (if any), ordered by token number (lowest first). Returns `null` if no waiting token exists.

**Response:**

```json
{
  "success": true,
  "message": "Token fetched successfully",
  "data": {
    "id": "token-uuid",
    "queueId": "queue-uuid",
    "patientId": "patient-uuid",
    "tokenNumber": 15,
    "status": "WAITING",
    "createdAt": "2025-12-30T10:30:00.000Z"
  }
}
```

> 💡 **Note:** If the patient has no waiting tokens, the `data` field will be `null`.

#### Delete Token (Patient Only)

```http
DELETE /api/tokens/:tokenId
Authorization: Bearer <access_token>
```

**Path Parameters:**

| Parameter | Type   | Required | Validation               |
| --------- | ------ | -------- | ------------------------ |
| `tokenId` | `uuid` | ✅       | Valid UUID of your token |

> ⚠️ **Validation Rules:**
>
> - Patient can only delete their own tokens
> - Token must exist and belong to the authenticated patient
> - All subsequent tokens in the queue will be renumbered (token numbers decremented by 1)
> - Queue status update is broadcasted to all connected clients via WebSocket

**Response:**

```json
{
  "success": true,
  "message": "Token deleted successfully",
  "data": null
}
```

> 🔔 **WebSocket Event:** After deletion, `queue:status_update` event is emitted to all clients in the queue room with the updated queue status.

---

## 🔌 WebSocket Events

### Connection

Connect to the WebSocket server with authentication:

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
  auth: {
    token: "your-access-token",
  },
});
```

### Client → Server Events

| Event                  | Payload                            | Description                            |
| ---------------------- | ---------------------------------- | -------------------------------------- |
| `join-queue`           | `queueId: string`                  | Join a queue room to receive updates   |
| `leave-queue`          | `queueId: string`                  | Leave a queue room                     |
| `queue:call_next`      | `queueId: string`                  | Call the next patient in queue (Staff) |
| `queue:skip_token`     | `queueId: string, tokenId: string` | Skip a patient's token (Staff)         |
| `queue:complete_token` | `queueId: string, tokenId: string` | Mark token as completed (Staff)        |

### Server → Client Events

| Event                        | Payload       | Description                        |
| ---------------------------- | ------------- | ---------------------------------- |
| `join-queue`                 | `undefined`   | Confirmation of joining queue room |
| `join-queue-error`           | `string`      | Error while joining queue          |
| `leave-queue`                | `undefined`   | Confirmation of leaving queue room |
| `queue:status_update`        | `QueueStatus` | Real-time queue status update      |
| `queue:empty`                | `string`      | Queue has no more waiting tokens   |
| `queue:your_token_called`    | `Token`       | Patient's token has been called    |
| `queue:your_token_skipped`   | `Token`       | Patient's token has been skipped   |
| `queue:your_token_completed` | `Token`       | Patient's token has been completed |
| `queue:call_next_error`      | `string`      | Error calling next token           |
| `queue:skip_token_error`     | `string`      | Error skipping token               |
| `queue:complete_token_error` | `string`      | Error completing token             |

### Example Usage

```javascript
// Join a queue room
socket.emit("join-queue", "queue-uuid");

// Listen for status updates
socket.on("queue:status_update", (status) => {
  console.log("Current token:", status.currentTokenNo);
  console.log("Waiting count:", status.waitingCount);
});

// Listen for your token being called (as patient)
socket.on("queue:your_token_called", (token) => {
  console.log("Your turn! Token number:", token.tokenNumber);
});

// Staff: Call next patient
socket.emit("queue:call_next", "queue-uuid");

// Staff: Complete current token
socket.emit("queue:complete_token", "queue-uuid", "token-uuid");
```

---

## 🗄 Database Schema

### Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│     User     │       │ DoctorClinic │       │    Queue     │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id           │       │ id           │       │ id           │
│ email        │       │ name         │       │ clinicId     │──┐
│ password     │       │ address      │       │ queueDate    │  │
│ firstName    │       │ latitude     │       │ currentToken │  │
│ lastName     │       │ longitude    │       │ maxQueueSize │  │
│ role         │       │ phone        │       │ startTime    │  │
│ clinicId ────┼──────▶│ type         │◀──────│ endTime      │  │
│ profilePic   │       │ openingHours │       │ isActive     │  │
│ isActive     │       │ logo         │       └──────────────┘  │
└──────────────┘       │ images       │              │          │
       │               └──────────────┘              │          │
       │                                             ▼          │
       │               ┌──────────────┐       ┌──────────────┐  │
       │               │StaffActivity │       │    Token     │  │
       │               ├──────────────┤       ├──────────────┤  │
       │               │ id           │       │ id           │  │
       ├──────────────▶│ staffId      │       │ queueId ─────┼──┘
       │               │ tokenId ─────┼──────▶│ patientId    │
       │               │ action       │       │ tokenNumber  │
       │               │ createdAt    │       │ status       │
       │               └──────────────┘       │ calledAt     │
       │                                      │ completedAt  │
       │               ┌──────────────┐       │ skippedAt    │
       │               │   Session    │       └──────────────┘
       │               ├──────────────┤
       └──────────────▶│ id           │
                       │ userId       │
                       │ refreshToken │
                       │ userAgent    │
                       │ ipAddress    │
                       │ expiresAt    │
                       │ isRevoked    │
                       └──────────────┘
```

### Enums

```typescript
enum Role {
  PATIENT
  STAFF
  ADMIN
}

enum TokenStatus {
  WAITING
  CALLED
  IN_PROGRESS
  COMPLETED
  SKIPPED
}

enum StaffAction {
  CALL
  SKIP
  COMPLETE
}

enum DoctorType {
  GENERAL_PRACTICE
  PEDIATRICS
  DERMATOLOGY
  PSYCHIATRY
  GYNECOLOGY
  ORTHOPEDICS
  ENT
  DENTIST
}
```

---

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
# Server
PORT=
DATABASE_URL=
DATABASE_DIRECT_URL=
JWT_PRIVATE_KEY= #RSA Private Key
JWT_PUBLIC_KEY= #RSA Public Key
JWT_EXPIRES_IN=
CLOUDINARY_URL=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_CLOUD_NAME=
REDIS_URL=
```

---

## 📁 Project Structure

```
├── Dockerfile           # Multi-stage Docker build
├── docker-compose.yml   # Docker Compose orchestration
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── middlewares/     # Express middlewares
│   ├── prisma/          # Database schema & migrations
│   ├── queues/          # BullMQ job definitions
│   ├── redis/           # Redis client configuration
│   ├── routes/          # API route definitions
│   ├── schemas/         # Zod validation schemas
│   ├── services/        # Business logic layer
│   ├── socket/          # Socket.IO handlers
│   │   └── handlers/    # Event handlers
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   ├── app.ts           # Express app initialization
│   ├── server.ts        # HTTP server setup
│   └── index.ts         # Application entry point
```

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/Manpreet-Singh-Kamboj">Manpreet Singh</a>
</p>
