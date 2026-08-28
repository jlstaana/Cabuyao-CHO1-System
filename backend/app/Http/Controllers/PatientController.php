<?php
namespace App\Http\Controllers;
use App\Models\{AuditLog, Patient, PatientRecord, PatientRecordVersion};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PatientController extends Controller {
    public function index(Request $request) {
        if (!in_array($request->user()->role, ['Admin', 'Staff', 'Doctor'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $patients = Patient::with([
            'user',
            'record',
            'consultations.doctor.user',
            'consultations.form',
            'consultations.vitalSigns',
            'consultations.prescription.items.medicine',
            'medicalImages'
        ])->get();
        return response()->json($patients);
    }
    public function profile(Request $request) {
        return response()->json($request->user()->load('patient'));
    }
    public function updateProfile(Request $request) {
        if ($request->filled('name')) {
            $request->user()->update(['name' => $request->name]);
        }
        $patient = $request->user()->patient;
        $patient->update($request->only(['dob', 'address', 'contact_no', 'category', 'gender']));
        return response()->json($request->user()->load('patient'));
    }
    public function history(Request $request) {
        return response()->json($request->user()->patient->consultations()->with(['doctor.user', 'form', 'vitalSigns', 'prescription.items.medicine'])->latest('created_at')->get());
    }
    public function prescriptions(Request $request, Patient $patient) {
        if (!in_array($request->user()->role, ['Admin', 'Staff', 'Doctor'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        return response()->json(
            $patient->prescriptions()->with('items.medicine', 'doctor.user', 'patient.user')->latest('created_at')->get()
        );
    }
    public function updateRecord(Request $request, Patient $patient) {
        if (!in_array($request->user()->role, ['Admin', 'Staff'])) {
            return response()->json(['message' => 'Only Health Officers or Admins can update patient records.'], 403);
        }

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'dob' => 'nullable|date|before:tomorrow',
            'contact_no' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:1000',
            'category' => 'nullable|string|max:255',
            'gender' => 'nullable|string|in:Male,Female',
            'medical_history' => 'nullable|string|max:5000',
        ]);

        $updated = DB::transaction(function () use ($patient, $data, $request) {
            $patient->loadMissing('user', 'record');

            PatientRecordVersion::create([
                'patient_id' => $patient->id,
                'snapshot' => [
                    'name' => $patient->user?->name,
                    'dob' => optional($patient->dob)->toDateString(),
                    'contact_no' => $patient->contact_no,
                    'address' => $patient->address,
                    'category' => $patient->category,
                    'gender' => $patient->gender,
                    'medical_history' => $patient->record?->medical_history,
                ],
                'updated_by' => $request->user()->id,
            ]);

            $patient->user?->update(['name' => $data['name']]);
            $patient->update([
                'dob' => $data['dob'] ?? null,
                'contact_no' => $data['contact_no'] ?? null,
                'address' => $data['address'] ?? null,
                'category' => $data['category'] ?? null,
                'gender' => $data['gender'] ?? null,
            ]);

            PatientRecord::updateOrCreate(
                ['patient_id' => $patient->id],
                ['medical_history' => $data['medical_history'] ?? null]
            );

            AuditLog::create([
                'user_id' => $request->user()->id,
                'action' => "Updated Patient Record #{$patient->id}",
                'description' => "Updated permitted patient information for {$data['name']}.",
                'ip_address' => $request->ip(),
            ]);

            return $patient->fresh(['user', 'record']);
        });

        return response()->json([
            'message' => 'Patient record updated successfully.',
            'patient' => $updated,
        ]);
    }
    public function archiveRecord(Request $request, Patient $patient) {
        if (!in_array($request->user()->role, ['Admin', 'Staff'])) {
            return response()->json(['message' => 'Only Health Officers or Admins can archive patient records.'], 403);
        }

        $data = $request->validate([
            'reason' => 'required|string|max:1000',
        ]);

        $patient->loadMissing('user', 'record', 'consultations');
        if ($patient->archived) {
            return response()->json(['message' => 'Archive not allowed. This patient record is already archived.'], 422);
        }

        $hasActiveConsultations = $patient->consultations()
            ->whereIn('status', ['Pending', 'Approved', 'Scheduled'])
            ->exists();
        if ($hasActiveConsultations) {
            return response()->json(['message' => 'Archive not allowed. Patient has active consultation requests or schedules.'], 422);
        }

        $archived = DB::transaction(function () use ($patient, $data, $request) {
            PatientRecordVersion::create([
                'patient_id' => $patient->id,
                'snapshot' => [
                    'name' => $patient->user?->name,
                    'dob' => optional($patient->dob)->toDateString(),
                    'contact_no' => $patient->contact_no,
                    'address' => $patient->address,
                    'category' => $patient->category,
                    'medical_history' => $patient->record?->medical_history,
                    'archived' => $patient->archived,
                    'archive_reason' => $data['reason'],
                ],
                'updated_by' => $request->user()->id,
            ]);

            $patient->update(['archived' => true]);

            AuditLog::create([
                'user_id' => $request->user()->id,
                'action' => "Archived Patient Record #{$patient->id}",
                'description' => "Reason: {$data['reason']}",
                'ip_address' => $request->ip(),
            ]);

            return $patient->fresh(['user', 'record']);
        });

        return response()->json([
            'message' => 'Patient record archived successfully.',
            'patient' => $archived,
        ]);
    }
}
