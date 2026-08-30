# 🏥 Cabuyao CHO-1 Telehealth & Health Information Management System

![System Status](https://img.shields.io/badge/Status-Active_Development-brightgreen)
![Laravel](https://img.shields.io/badge/Backend-Laravel_10-red)
![React](https://img.shields.io/badge/Frontend-React_19_(Vite)-blue)
![Database](https://img.shields.io/badge/Database-SQLite-blue)

A modern, comprehensive web-based **Teleconsultation, E-Prescription, and Descriptive Analytics** platform designed exclusively for the Cabuyao City Health Office (CHO-1). This system bridges the healthcare accessibility gap by enabling secure remote medical consultations, robust patient record management, and data-driven administrative analytics.

---

## 🌟 Key Features

### 👩‍⚕️ Telehealth & Virtual Consultations
- **Flat Chronological Queue:** Attic-clean, chronological scheduled queue list displaying active appointments sequentially for doctors.
- **Smart Doctor Matching:** Patients can view doctor schedules and explicitly request consultations by specialization (e.g., General Medicine, Cardiology, Pulmonology).
- **WebRTC Video (Jitsi):** Real-time, browser-native high-quality video calling for scheduled appointments.
- **Active Room Protection Guardrail:** Enforces active call session tracking (storing `active_teleconsultation_id` in localStorage) and disables cross-entry buttons on other appointments to prevent multi-room conflicts.

### 📝 Compliant E-Prescription System (FDA / DDB / PRC Compliant)
- **Canvas-based E-Signatures:** Doctors generate realistic fountain-pen signatures digitally.
- **Dynamic Physician Credentials:** Automatically renders doctor credentials—including Board PRC, PTR, and S2 license numbers—on generated PDFs.
- **Dangerous Drugs Warning (RA 9165):** Injects a highlighted warning disclaimer footer stating that electronic prescriptions are invalid for dispensing regulated or dangerous substances requiring yellow forms.
- **Authenticity QR Code & Hash Block:** Embeds a secure vector SVG verification QR code (remotely loaded to bypass local GD extension requirements) and a SHA-256 verification hash at the prescription footer.
- **Government-Standard PDFs:** Automated generation of A5-sized E-Prescriptions using `barryvdh/dompdf` matching official municipal layouts.
- **PhilHealth YAKAP Integration:** A pre-loaded database of essential medications complete with stock tracking, program filters (e.g., TB-DOTS, maternal health), and generic names.

### 🏥 Patient Health Records (PHR)
- **Demographic Profiles:** Dynamic patient profile configuration requiring biological sex/gender fields (`Male`, `Female`) during registration and profile updates.
- **E-Prescriptions Tab Switcher:** Integrates a designated `Prescriptions` tab next to clinical notes inside the Patient Records dashboard, featuring a quick-activation switcher button to jump to downloadable PDFs.
- **Decoupled Medical Gallery:** Patients maintain a persistent, global medical gallery for X-Rays, Lab Results, and Medical Certificates.

### 📊 Descriptive Analytics & System Monitoring
- **Admin Insights Dashboard:** Real-time descriptive analytics tabs visualizing demographics (population health by Barangay, age, and sex), generic medicine usage, and system service utilization rates.
- **Dynamic Activity Log Toggles:** Interactive administrative audit trail displaying chronological system logs, filterable dynamically via category toggles (Authentication, Patient Records, Medicine Database, Telehealth).
- **Emergency Suspension Staffing:** Allows administrators to toggle emergency force mode (Team A vs. Team B + Standby C) to enforce skeletal staffing and filter slot availability dynamically during Malacañang work suspensions.

---

## 🛠️ Technology Stack

**Frontend Framework:**
- **React 19** via **Vite** (with Enforced HMR Polling for dev server sync)
- **Tailwind CSS v4** (Modern, responsive utility-first styling)
- **Zustand** (State management)
- **Lucide React** (UI iconography)

**Backend Architecture:**
- **Laravel 10** (PHP 8.2+)
- **Laravel Sanctum** (Stateful API Authentication)
- **DomPDF** (Server-side PDF rendering for prescriptions)
- **SQLite** (Database layer)

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
5. Run migrations and the comprehensive mock data seeders (which set up Patient genders and Doctor S2 licenses): 
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
3. Start the Vite development server: 
   ```bash
   npm run dev
   ```

---

## 👥 Development & Contributions
Developed as a Capstone Project to modernize public healthcare infrastructure and digital coordination for Cabuyao City.

*Built with ❤️ for the Cabuyao community.*