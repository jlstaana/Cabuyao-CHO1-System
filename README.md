# Cabuyao City Health Office (CHO 1) Teleconsultation System

A comprehensive, web-based teleconsultation and health information management system developed for the Cabuyao City Health Office. This platform bridges the gap between healthcare professionals and patients, enabling secure remote medical consultations, digital prescriptions, and robust patient record management.

## 🌟 Key Features

### 👩‍⚕️ Teleconsultation & Scheduling
- **Smart Doctor Assignment:** Patients can view doctor availability schedules and explicitly request consultations with specific doctors based on specialization (e.g., General Medicine, Cardiology, Pulmonology, etc.).
- **Live Video Consultations:** Integrated high-quality, secure WebRTC video calling directly within the browser for scheduled appointments.
- **Doctor Availability Management:** Doctors can configure their schedules, specifying working days, working hours, slot capacity, and their employment type (Resident vs. Visiting).

### 🏥 Patient Health Records (PHR)
- **Decoupled Medical Gallery:** Patients have a global, persistent medical gallery to upload X-Rays, Lab Results, and Medical Certificates prior to or independent of consultations.
- **Vital Signs Tracking:** Dedicated module for patients to log and monitor their vital signs (Blood Pressure, Heart Rate, Temperature, Respiratory, SpO2, Weight) over time.

### 💊 E-Prescription Management
- **Digital Prescriptions:** Doctors can seamlessly generate E-Prescriptions with digital signatures post-consultation.
- **Medicine Database:** Centralized inventory/database of available medicines integrated into the prescription workflow.

### 🔐 Security & Access Control
- **Role-Based Access Control (RBAC):** Distinct dashboards and permissions for **Admin**, **Staff**, **Doctor**, and **Patient** roles.
- **Two-Factor Authentication (2FA):** Secure Email OTP (One-Time Password) verification required during login and registration.
- **Account Lifecycle Management:** Admins can securely archive, suspend, or reactivate user accounts. 

### 📊 Dashboard & Analytics
- **Admin Analytics:** Comprehensive reporting on consultation volume, user demographics, and system usage.
- **Real-Time Notifications:** Dynamic, real-time alert system to keep doctors and patients updated on consultation statuses and new messages.

---

## 🛠️ Technology Stack

**Frontend:**
- React (Vite)
- Tailwind CSS (Styling & Responsive Design)
- Zustand (State Management)
- React Router (Navigation)
- Lucide React (Icons)
- WebRTC / Daily.co API (Video Conferencing)

**Backend:**
- Laravel (PHP Framework)
- MySQL (Database)
- Laravel Sanctum (API Authentication & Token Management)
- RESTful API Architecture

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- PHP (v8.2+)
- Composer
- MySQL

### Backend Setup
1. Navigate to the `backend` directory: `cd backend`
2. Install dependencies: `composer install`
3. Copy the environment file: `cp .env.example .env`
4. Generate application key: `php artisan key:generate`
5. Configure your database and mail (SMTP) settings in `.env`.
6. Run database migrations and seeders: `php artisan migrate:fresh --seed`
7. Start the local server: `php artisan serve`

### Frontend Setup
1. Navigate to the `frontend` directory: `cd frontend`
2. Install dependencies: `npm install`
3. Configure the environment variables (e.g., API URL) in `.env`.
4. Start the development server: `npm run dev`

---

## 👥 Contributors
Developed as a Capstone Project to modernize public healthcare access in Cabuyao City.