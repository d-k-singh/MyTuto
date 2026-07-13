# MyTuto – AI-Powered Education Marketplace

## Project Overview

MyTuto is an AI-powered education marketplace (EduConnect) connecting students with tutors. It comprises a React.js web application and a React Native mobile app, both backed by a shared Laravel REST API.

---

## Technology Stack

### Frontend (Web)

- **Framework:** React.js + TypeScript
- **Styling:** Tailwind CSS
- **SSR / SEO:** Next.js (Server-Side Rendering)

### Mobile (iOS & Android)

- **Framework:** React Native + TypeScript
- **Toolchain:** Expo (managed workflow)
- Platform-specific native modules where required

### Shared Business Logic

- Laravel backend exposes a unified REST API consumed by both the React.js web frontend and React Native mobile app
- Shared API client library (TypeScript) used across web and mobile

---

## Backend

| Concern | Technology |
|---|---|
| **API Framework** | Laravel (PHP 8.x) |
| **API Style** | RESTful + GraphQL endpoints |
| **Authentication** | Laravel Sanctum (API auth) |
| **Background Jobs** | Laravel Queues |
| **Admin Panel** | Laravel Nova or Filament (P2) |
| **LMS Core** | Custom Laravel LMS modules (P2) |

---

## AI / ML Engine

- **Language:** Python
- **Frameworks:** scikit-learn / TensorFlow
- **Vector Search:** Pinecone or pgvector
- **Embedding Service:** OpenAI Embeddings API or self-hosted model (teacher–student NLP matching)

---

## Databases

| Type | Technology |
|---|---|
| **Relational** | MySQL 8.x (user profiles, transactions, course catalogue) |
| **ORM** | Laravel Eloquent |
| **Migrations** | Laravel Migrations |
| **Search** | Elasticsearch (teacher discovery and search) |

---

## Infrastructure & Storage

| Layer | Technology |
|---|---|
| **Cloud** | AWS or Azure |
| **Container Orchestration** | Kubernetes |
| **Infrastructure as Code** | Terraform |
| **Object Storage** | AWS S3 or Azure Blob Storage (videos, documents) |
| **CDN** | CloudFront or Azure CDN (video delivery, mobile asset caching) |

---

## Authentication & Identity

- **Auth Provider:** Auth0 or AWS Cognito
- **Protocol:** OAuth 2.0 / OIDC with MFA
- **Biometric:** Device SDK integration
- **KYC / KYE:** Onfido or Jumio (webhook-driven status updates; mobile SDK for document scanning)

---

## Payments & Commerce

- **Global Payments:** Stripe (CP purchase checkout, teacher payout APIs)
- **Mobile Wallets:** Apple Pay (iOS) + Google Pay (Android)

---

## Notifications & Communication

| Channel | Technology |
|---|---|
| **Push (Android)** | Firebase Cloud Messaging (FCM) |
| **Push (iOS)** | Apple Push Notification service (APNs) |
| **Email** | SendGrid (transactional + marketing) |

---

## Monitoring & Analytics

| Concern | Technology |
|---|---|
| **Mobile Crash Reporting** | Firebase Crashlytics (iOS & Android) |
| **Mobile Analytics** | Firebase Analytics or Amplitude |

---

## CI/CD & Code Quality

- **CI/CD:** GitHub Actions or GitLab CI
- **Code Style:** Laravel Pint
- **Backend Testing:** PHPUnit + Pest
- **Mobile Build Automation:** Fastlane
- **Code Quality:** SonarQube

---

## Integration Points

| Service | Technology / Notes |
|---|---|
| **Identity Verification** | Onfido / Jumio — webhook-driven; mobile SDK for in-app document scanning |
| **Payment Gateway** | Stripe — checkout & payout; Apple Pay & Google Pay integration |
| **Push Notifications** | FCM (Android) + APNs (iOS) |
| **Email** | SendGrid — transactional and marketing emails |
| **Video Storage** | AWS S3 + CloudFront — upload, storage, and streaming |
| **NLP / Embeddings** | OpenAI Embeddings API or self-hosted model for teacher–student matching |
| **App Store Deployment** | Apple App Store Connect API + Google Play Developer API |

---

## Phase 2 (P2) Features

| Feature | Technology |
|---|---|
| **Virtual Classroom** | WebRTC-based live video (Daily.co or Agora.io); Liveblocks or Tldraw for interactive whiteboard |
| **AI Language Translation** | Google Cloud Translation API or DeepL API; real-time subtitles via WebVTT |
| **AI Voice Cloning** | ElevenLabs API or Azure Cognitive Speech Services |
| **AI Tutor / Doubt-Solving** | OpenAI GPT-4o API with RAG over course content |
| **Auto Note & Transcript** | OpenAI Whisper API (speech-to-text); GPT-4o (summarisation & key-point extraction) |
| **AI Assessment & Grading** | GPT-4o for descriptive grading; Turnitin API or Copyleaks for plagiarism detection |
| **Gamification Engine** | Custom Laravel service + Redis (real-time leaderboard & XP tracking) |
| **Digital Certificates** | Laravel PDF generation (DomPDF / Snappy); QR code via SimpleSoftwareIO/simple-qrcode |
| **Career Module / Job Board** | LinkedIn API for profile sync; custom Laravel job board module |
| **Mobile Offline Learning** | React Native with local SQLite (Expo SQLite) + file system caching (Expo FileSystem) |
