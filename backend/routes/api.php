<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\{AuthController, PatientController, AdminController, ConsultationController, MedicineController, PrescriptionController, AnalyticsController};

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/auth/change-password', [AuthController::class, 'changePassword']);
    
    // Patient Profile & History
    Route::get('/patients/profile', [PatientController::class, 'profile']);
    Route::put('/patients/profile', [PatientController::class, 'updateProfile']);
    Route::get('/patients/history', [PatientController::class, 'history']);

    // Consultations
    Route::get('/consultations', [ConsultationController::class, 'index']);
    Route::post('/consultations/request', [ConsultationController::class, 'requestConsultation']);
    Route::post('/consultations/{id}/vitals', [ConsultationController::class, 'recordVitals']);
    Route::post('/consultations/{id}/images', [ConsultationController::class, 'uploadImage']);
    Route::put('/consultations/{id}/status', [ConsultationController::class, 'updateStatus']);
    Route::post('/consultations/{id}/complete', [ConsultationController::class, 'complete']);
    
    // Medicines & Prescriptions
    Route::get('/medicines', [MedicineController::class, 'index']);
    Route::post('/medicines', [MedicineController::class, 'store'])->middleware('role:Admin');
    Route::put('/medicines/{id}', [MedicineController::class, 'update'])->middleware('role:Admin');
    Route::delete('/medicines/{id}', [MedicineController::class, 'deactivate'])->middleware('role:Admin');
    
    Route::get('/prescriptions', [PrescriptionController::class, 'index']);
    Route::post('/prescriptions', [PrescriptionController::class, 'store']);
    Route::get('/prescriptions/{id}/download', [PrescriptionController::class, 'download']);

    // Admin Users
    Route::post('/admin/doctors', [AdminController::class, 'createDoctor'])->middleware('role:Admin');
    Route::post('/admin/staff', [AdminController::class, 'createStaff'])->middleware('role:Admin');

    // Analytics
    Route::get('/analytics/stats', [AnalyticsController::class, 'stats']);
});
