<?php

namespace App\Http\Controllers;

use App\Models\VitalSign;
use App\Models\Patient;
use Illuminate\Http\Request;

class VitalSignController extends Controller
{
    /**
     * Get vital signs. Patients get their own; Doctor/Admin/Staff get selected or all patients.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        if ($user->role === 'Patient') {
            if (!$user->patient) {
                return response()->json([]);
            }
            $vitals = VitalSign::where('patient_id', $user->patient->id)
                ->orderBy('created_at', 'desc')
                ->get();
            return response()->json($vitals);
        }

        // Doctor, Admin, Staff
        $query = VitalSign::with(['patient.user'])->orderBy('created_at', 'desc');

        if ($request->filled('patient_id')) {
            $query->where('patient_id', $request->patient_id);
        }

        return response()->json($query->get());
    }

    /**
     * Store a newly created vital sign. Patients store for themselves; Staff/Doctor/Admin store for a patient.
     */
    public function store(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'patient_id' => 'nullable|integer|exists:patients,id',
            'height' => 'nullable|string|max:50',
            'weight' => 'nullable|string|max:50',
            'blood_pressure' => 'nullable|string|max:50',
            'heart_rate' => 'nullable|string|max:50',
            'temperature' => 'nullable|string|max:50',
            'respiratory' => 'nullable|string|max:50',
            'oxygen' => 'nullable|string|max:50',
        ]);

        $targetPatientId = null;

        if ($user->role === 'Patient') {
            if (!$user->patient) {
                return response()->json(['message' => 'Patient profile not found'], 404);
            }
            $targetPatientId = $user->patient->id;
        } else {
            // Staff, Doctor, Admin
            if (empty($data['patient_id'])) {
                return response()->json(['message' => 'Please select a patient'], 422);
            }
            $targetPatientId = $data['patient_id'];
        }

        $vital = VitalSign::create([
            'patient_id'     => $targetPatientId,
            'height'         => $data['height'] ?? null,
            'weight'         => $data['weight'] ?? null,
            'blood_pressure' => $data['blood_pressure'] ?? null,
            'heart_rate'     => $data['heart_rate'] ?? null,
            'temperature'    => $data['temperature'] ?? null,
            'respiratory'    => $data['respiratory'] ?? null,
            'oxygen'         => $data['oxygen'] ?? null,
        ]);

        // Log audit trail
        $vitalsSummary = [];
        if (!empty($data['blood_pressure'])) $vitalsSummary[] = "BP: {$data['blood_pressure']} mmHg";
        if (!empty($data['heart_rate']))     $vitalsSummary[] = "HR: {$data['heart_rate']} bpm";
        if (!empty($data['temperature']))    $vitalsSummary[] = "Temp: {$data['temperature']}°C";
        if (!empty($data['respiratory']))    $vitalsSummary[] = "RR: {$data['respiratory']}/min";
        if (!empty($data['oxygen']))         $vitalsSummary[] = "SpO2: {$data['oxygen']}%";
        if (!empty($data['weight']))         $vitalsSummary[] = "Weight: {$data['weight']} kg";

        $targetPatient = Patient::with('user')->find($targetPatientId);
        $patientName = $targetPatient?->user?->name ?? "Patient #{$targetPatientId}";

        \App\Models\AuditLog::create([
            'user_id'     => $user->id,
            'action'      => 'Vital Signs Recorded',
            'description' => "Recorded vital signs for {$patientName}: " . (implode(', ', $vitalsSummary) ?: 'Initial reading'),
            'ip_address'  => $request->ip(),
        ]);

        return response()->json(['message' => 'Vital signs recorded successfully', 'data' => $vital->load('patient.user')], 201);
    }
}
