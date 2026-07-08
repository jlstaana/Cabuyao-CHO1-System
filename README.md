# 🏥 Cabuyao CHO-1 Telehealth & Health Information Management System

![System Status](https://img.shields.io/badge/Status-Active_Development-brightgreen)
![Laravel](https://img.shields.io/badge/Backend-Laravel_10-red)
![React](https://img.shields.io/badge/Frontend-React_19_(Vite)-blue)
![Database](https://img.shields.io/badge/Database-SQLite-blue)

A modern, comprehensive web-based **Teleconsultation, E-Prescription, and Descriptive Analytics** platform designed exclusively for the Cabuyao City Health Office (CHO-1). This system bridges the healthcare accessibility gap by enabling secure remote medical consultations, robust patient record management, and data-driven administrative analytics.

---

## 🌟 Key Features

### 👩‍⚕️ Telehealth & Virtual Consultations
- **Smart Doctor Matching:** Patients can view doctor schedules and explicitly request consultations by specialization (e.g., General Medicine, Cardiology, Pulmonology).
- **Secure WebRTC Video:** Real-time, browser-native high-quality video calling for scheduled appointments.
- **Dynamic Availability:** Doctors can configure active working days, shift hours, and capacity caps (Resident vs. Visiting Doctor profiles).

### 📝 Advanced E-Prescription System (New!)
- **Canvas-based E-Signatures:** Doctors generate realistic fountain-pen signatures digitally.
- **Government-Standard PDFs:** Automated generation of A5-sized E-Prescriptions using `barryvdh/dompdf` matching official government layouts.
- **PhilHealth YAKAP Integration:** A pre-loaded, realistic database of 142 essential medicines complete with stock tracking, expiration warnings, and generic names.

### 🏥 Patient Health Records (PHR)
- **Decoupled Medical Gallery:** Patients maintain a persistent, global medical gallery for X-Rays, Lab Results, and Medical Certificates.
- **Vital Signs Tracking:** Monitor critical health metrics (Blood Pressure, Heart Rate, SpO2, Temperature, Respiratory Rate, Weight) longitudinally.

### 📊 Descriptive Analytics & Reports (New!)
- **Admin Insights Dashboard:** Real-time descriptive analytics on consultation volume, user demographics, and system usage.
- **Archive Tracking:** Deep mapping of inactive/archived items (e.g., archived patients, inactive users, expired medicines) to ensure strict data auditing.

### 🔐 Security & Access Control
- **Role-Based Access Control (RBAC):** Strict middleware gating for **Admin**, **Staff**, **Doctor**, and **Patient** roles.
- **Two-Factor Authentication (2FA):** Secure Email OTP (One-Time Password) required during login and registration.
- **Hardened Architecture:** Protected against N+1 database querying bottlenecks and strictly validates to prevent Mass Assignment vulnerabilities.

---

## 🛠️ Technology Stack

**Frontend Framework:**
- **React 19** via **Vite** (with Enforced HMR Polling for blazing fast dev)
- **Tailwind CSS v4** (Modern, responsive utility-first styling)
- **Zustand** (Lightning-fast state management)
- **Lucide React** (Consistent UI iconography)

**Backend Architecture:**
- **Laravel 10** (PHP 8.2+)
- **Laravel Sanctum** (Stateful API Authentication)
- **DomPDF** (Server-side PDF rendering for prescriptions)
- **SQLite / MySQL** (Database layer)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- PHP (v8.2+)
- Composer

### Backend Setup
1. Navigate to the backend directory: 
   ```bash
   cd backend
   ```
2. Install PHP dependencies: 
   ```bash
   composer install
   ```
3. Copy environment variables: 
   ```bash
   cp .env.example .env
   ```
4. Generate the application key: 
   ```bash
   php artisan key:generate
   ```
5. Run migrations and the comprehensive mock data seeders: 
   ```bash
   php artisan migrate:fresh --seed
   ```
6. Start the API server: 
   ```bash
   php artisan serve
   ```

### Default Admin Credentials
*Use this account to access the administrative analytics and user management dashboard.*
- **Email:** `admin@cabuyao.gov.ph`
- **Password:** `password123`

### Frontend Setup
1. Navigate to the frontend directory: 
   ```bash
   cd frontend
   ```
2. Install JS dependencies: 
   ```bash
   npm install
   ```
3. Start the Vite development server (Hot Module Replacement enabled): 
   ```bash
   npm run dev
   ```

---

## 👥 Development & Contributions
Developed as a Capstone Project to modernize public healthcare infrastructure and digital coordination for Cabuyao City.

*Built with ❤️ for the Cabuyao community.*