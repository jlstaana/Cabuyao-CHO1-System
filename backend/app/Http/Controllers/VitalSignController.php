<?php

namespace App\Http\Controllers;

use App\Models\VitalSign;
use App\Models\Patient;
use Illuminate\Http\Request;

class VitalSignController extends Controller
{
    /**
     * Get all vital signs for the authenticated patient.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'Patient' || !$user->patient) {
            return response()->json(['message' => 'Unauthorized. Vital signs access is restricted to patients.'], 403);
        }

        $vitals = VitalSign::where('patient_id', $user->patient->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($vitals);
    }

    /**
     * Store a newly created vital sign for the authenticated patient.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'Patient' || !$user->patient) {
            return response()->json(['message' => 'Unauthorized. Vital signs access is restricted to patients.'], 403);
        }

        $data = $request->validate([
            'height' => 'nullable|string|max:50',
            'weight' => 'nullable|string|max:50',
            'blood_pressure' => 'nullable|string|max:50',
            'heart_rate' => 'nullable|string|max:50',
            'temperature' => 'nullable|string|max:50',
            'respiratory' => 'nullable|string|max:50',
            'oxygen' => 'nullable|string|max:50',
        ]);

        $vital = VitalSign::create([
            'patient_id'     => $user->patient->id,
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

        \App\Models\AuditLog::create([
            'user_id'     => $user->id,
            'action'      => 'Vital Signs Recorded',
            'description' => "Recorded vital signs: " . (implode(', ', $vitalsSummary) ?: 'Initial reading'),
            'ip_address'  => $request->ip(),
        ]);

        return response()->json(['message' => 'Vital signs recorded successfully', 'data' => $vital], 201);
    }
}
