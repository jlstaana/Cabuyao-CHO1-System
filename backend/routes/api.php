<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\{AuthController, PatientController, AdminController, ConsultationController, MedicineController, PrescriptionController, AnalyticsController, DoctorController, ActivityLogController};

Route::middleware('throttle:60,1')->group(function () {
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/register/verify', [AuthController::class, 'verifyRegistration']);
    Route::post('/auth/register/resend-code', [AuthController::class, 'resendVerificationCode']);
    Route::post('/auth/login', [AuthController::class, 'login'])->name('login');
    Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (\Illuminate\Http\Request $request) {
        return $request->user();
    });
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/auth/change-password', [AuthController::class, 'changePassword']);
    Route::post('/auth/profile-picture', [AuthController::class, 'updateProfilePicture']);
    Route::post('/auth/onboarding-complete', [AuthController::class, 'completeOnboarding']);
    
    // Patient Profile & History
    Route::get('/patients', [PatientController::class, 'index'])->middleware('role:Admin,Staff,Doctor');
    Route::get('/patients/profile', [PatientController::class, 'profile']);
    Route::put('/patients/profile', [PatientController::class, 'updateProfile']);
    Route::get('/patients/{patient}/record', [PatientController::class, 'record']);
    Route::put('/patients/{patient}/record', [PatientController::class, 'updateRecord'])->middleware('role:Admin,Staff');
    Route::post('/patients/{patient}/archive', [PatientController::class, 'archiveRecord'])->middleware('role:Admin,Staff');
    Route::get('/patients/history', [PatientController::class, 'history']);
    Route::get('/history', [ConsultationController::class, 'history']);
    Route::get('/patients/{patient}/prescriptions', [PatientController::class, 'prescriptions']);
    Route::get('/doctor/profile', [DoctorController::class, 'profile']);
    Route::put('/doctor/profile', [DoctorController::class, 'updateProfile']);
    Route::put('/doctor/availability', [DoctorController::class, 'updateAvailability']);
    Route::get('/doctors/specializations', [DoctorController::class, 'specializations']);
    Route::get('/doctors/available', [DoctorController::class, 'availableDoctors']);

    // Consultations
    Route::get('/consultations', [ConsultationController::class, 'index']);
    Route::post('/consultations/request', [ConsultationController::class, 'requestConsultation']);
    Route::post('/consultations/{id}/vitals', [ConsultationController::class, 'recordVitals']);
    Route::get('/consultations/{id}/messages', [ConsultationController::class, 'messages']);
    Route::post('/consultations/{id}/messages', [ConsultationController::class, 'sendMessage']);
    
    // Patient Vitals
    Route::get('/vitals', [App\Http\Controllers\VitalSignController::class, 'index']);
    Route::post('/vitals', [App\Http\Controllers\VitalSignController::class, 'store']);
    
    // Medical Images (Patient Global Gallery)
    Route::get('/medical-images', [App\Http\Controllers\MedicalImageController::class, 'index']);
    Route::post('/medical-images', [App\Http\Controllers\MedicalImageController::class, 'store']);
    
    // Legacy routes
    Route::post('/consultations/{id}/images', [ConsultationController::class, 'uploadImage']);
    Route::get('/medical-images/{image}/download', [ConsultationController::class, 'downloadMedicalFile']);
    Route::put('/consultations/{id}/status', [ConsultationController::class, 'updateStatus']);
    Route::post('/consultations/{id}/status', [ConsultationController::class, 'updateStatus']);
    Route::post('/consultations/{id}/complete', [ConsultationController::class, 'complete']);
    
    // Medicines & Prescriptions
    Route::get('/medicines', [MedicineController::class, 'index']);
    Route::post('/medicines', [MedicineController::class, 'store'])->middleware('role:Admin,Staff');
    Route::put('/medicines/{id}', [MedicineController::class, 'update'])->middleware('role:Admin,Staff');
    Route::delete('/medicines/{id}', [MedicineController::class, 'deactivate'])->middleware('role:Admin,Staff');
    
    Route::post('/medicines/{id}/batches', [MedicineController::class, 'addBatch'])->middleware('role:Admin,Staff');
    Route::put('/medicines/{id}/batches/{batchId}', [MedicineController::class, 'updateBatch'])->middleware('role:Admin,Staff');
    Route::delete('/medicines/{id}/batches/{batchId}', [MedicineController::class, 'deleteBatch'])->middleware('role:Admin,Staff');
    
    Route::get('/prescriptions', [PrescriptionController::class, 'index']);
    Route::post('/prescriptions', [PrescriptionController::class, 'store']);
    Route::put('/prescriptions/{id}', [PrescriptionController::class, 'update']);
    Route::get('/prescriptions/{id}/download', [PrescriptionController::class, 'download']);

    // Admin Users
    Route::get('/admin/users', [AdminController::class, 'getUsers'])->middleware('role:Admin,Staff');
    Route::patch('/admin/users/{user}/deactivate', [AdminController::class, 'deactivateUser'])->middleware('role:Admin,Staff');
    Route::patch('/admin/users/{user}/reactivate', [AdminController::class, 'reactivateUser'])->middleware('role:Admin,Staff');
    Route::post('/admin/doctors', [AdminController::class, 'createDoctor'])->middleware('role:Admin');
    Route::post('/admin/staff', [AdminController::class, 'createStaff'])->middleware('role:Admin');

    // Analytics
    Route::get('/analytics/stats', [AnalyticsController::class, 'stats'])->middleware('role:Admin');

    // Activity Logs (Admin & Staff only)
    Route::get('/admin/activity-logs', [ActivityLogController::class, 'index'])->middleware('role:Admin,Staff');
});
