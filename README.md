# Kind Hands — Volunteer Management System

A full-stack mobile application that connects volunteers with organizations, streamlines opportunity management, fundraising, and contribution tracking — all in one platform.

---

## Team Details

**Group Number:** 07 — WE-DS-01-G07

| Student ID | Name | Module Responsibility |
|---|---|---|
| IT24102588 | Joshwel S. | Feedback Management |
| IT24104388 | Peiris D.R.D.D. | Application Management |
| IT24101789 | Dias D.T.D. | Favorites Management |
| IT24101553 | Wickramarachchi D.S. | Donation Management |
| IT24610815 | Balawathgama P.M.R.I.S. | Opportunity Management |
| IT24101466 | Akeeth W.K.A. | User Contributions Management |

---

## Table of Contents

- [Team Details](#team-details)
- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Screens](#screens)

---

## Overview

**Kind Hands** is a volunteer management platform built with React Native (Expo) and Node.js. Volunteers can discover and apply for opportunities, log contributions, donate to fundraising campaigns, and earn points through a gamification system. Organizations can manage applications, verify hours, and build a trusted publisher profile. Admins have full platform oversight.

---

## Features

### For Volunteers
- Browse and filter volunteering opportunities by category, location, and date
- Apply with a cover letter, motivation, and supporting photo
- Track application statuses and volunteering history
- Log contribution hours with proof images
- Save opportunities to personal favourite lists
- Donate to fundraising campaigns with receipt upload
- Earn points and set personal volunteering goals
- Follow organizations and get a personalized feed
- Rate and comment on opportunities and publishers

### For Organizations / Publishers
- Create and manage volunteer opportunities with banner images
- Review, approve, reject, and group applications
- Create and manage fundraising campaigns
- Verify or reject volunteer contribution submissions
- View publisher profile with community ratings and reviews

### Platform-Wide
- Real-time notification system (14 event types)
- Threaded comments and nested publisher reviews
- Like / dislike voting on opportunities, comments, and reviews
- Admin dashboard with platform-wide analytics
- User feedback / bug report system with admin replies

---

## Tech Stack

### Frontend
| Technology | Version |
|---|---|
| React Native | 0.83.2 |
| Expo | 55.0.8 |
| React | 19.2.0 |
| React Navigation (Stack + Bottom Tabs) | 6.x |
| Axios | 1.6.0 |
| AsyncStorage | 2.2.0 |
| Expo Image Picker | 55.0.13 |

### Backend
| Technology | Version |
|---|---|
| Node.js | — |
| Express | 5.2.1 |
| MongoDB + Mongoose | 9.3.0 |
| JSON Web Token | 9.0.3 |
| bcryptjs | 3.0.3 |
| Multer | 2.1.1 |
| dotenv | 17.3.1 |

### Infrastructure
| Service | Purpose |
|---|---|
| MongoDB Atlas | Cloud database |
| Render.com | Backend API hosting |
| Expo EAS | Mobile app builds |

---

## Project Structure

```
volunteer-management-system/
├── backend/
│   ├── controllers/        # Business logic (19 controllers)
│   ├── middleware/         # JWT auth middleware
│   ├── models/             # Mongoose schemas (19 models)
│   ├── routes/             # Express route definitions (19 modules)
│   ├── uploads/            # Multer file storage
│   ├── server.js           # Entry point
│   └── .env                # Environment variables
│
└── frontend/
    ├── assets/             # Images and icons
    ├── components/         # Shared UI components
    ├── context/            # AuthContext, ThemeContext
    ├── screens/            # 36 screens organized by feature
    │   ├── auth/
    │   ├── opportunity/
    │   ├── application/
    │   ├── donation/
    │   ├── feedback/
    │   ├── favourites/
    │   ├── impact/
    │   ├── profile/
    │   ├── publisher/
    │   ├── contribution/
    │   └── notifications/
    ├── api.js              # Axios instance with JWT interceptor
    └── App.js              # Root navigator
```

---

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI — `npm install -g expo-cli`
- MongoDB Atlas account
- Android / iOS device or emulator (or Expo Go app)

---

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd volunteer-management-system/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create the `.env` file** (see [Environment Variables](#environment-variables))

4. **Start the server**
   ```bash
   # Development (with auto-reload)
   npm run dev

   # Production
   npm start
   ```

   The API will run at `http://localhost:5000`

---

### Frontend Setup

1. **Navigate to the frontend directory**
   ```bash
   cd volunteer-management-system/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Update the API base URL** in `api.js` to point to your backend (local or deployed)

4. **Start the Expo dev server**
   ```bash
   npm start
   ```

5. **Run on a device**
   ```bash
   npm run android   # Android
   npm run ios       # iOS
   npm run web       # Web browser
   ```

---

## Environment Variables

Create a `.env` file inside the `backend/` directory:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>
JWT_SECRET=your_jwt_secret_key
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_admin_password
```

> The admin account is automatically seeded into the database on server startup using `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

---

## API Reference

The REST API is organized into 19 route modules with 102 endpoints total.

**Base URL:** `https://volunteer-management-system-myg0.onrender.com`

| Module | Base Path | Endpoints |
|---|---|---|
| Authentication | `/api/auth` | 5 |
| Opportunities | `/api/opportunities` | 7 |
| Applications | `/api/applications` | 7 |
| Application Groups | `/api/application-groups` | 8 |
| Fundraisers | `/api/fundraisers` | 10 |
| Donations | `/api/donations` | 7 |
| Contributions | `/api/contributions` | 9 |
| Feedback | `/api/feedback` | 5 |
| Comments | `/api/comments` | 4 |
| Votes | `/api/votes` | 2 |
| Favourites | `/api/favourites` | 6 |
| Follows | `/api/follows` | 4 |
| Publisher | `/api/publisher` | 7 |
| Opportunity Ratings | `/api/opportunity-ratings` | 3 |
| Notifications | `/api/notifications` | 3 |
| Points | `/api/points` | 4 |
| Goals | `/api/goals` | 4 |
| User Feedback | `/api/user-feedback` | 6 |
| Admin | `/api/admin` | 1 |

> See `API_Endpoint_Table.html` for the full endpoint reference with methods, auth requirements, and file upload details.

**Authentication:** All protected routes require a Bearer token in the `Authorization` header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Screens

The app includes **36 screens** across 10 feature areas:

| Area | Screens |
|---|---|
| Auth | Login, Register |
| Opportunities | List, Detail, Create, Creator Detail, My Created, Manage Applications, Manage Fundraisers, All Creator Applications |
| Applications | Apply, My Applications |
| Donations | Donate, Fundraiser List, My Donations, My Fundraisers, Create Fundraiser, Manage Fundraiser |
| Feedback | Submit Feedback, Feedback View, Admin Feedback |
| Impact | Impact Overview, Ongoing Opportunities, Past Volunteering |
| Favourites | Favourites List, Favourite Detail |
| Publisher | Find Publishers, Publisher Profile, Publisher Comments |
| Profile | Profile, Edit Profile, Change Password, My Likes & Comments |
| Other | All Contributions, Notifications |

---

