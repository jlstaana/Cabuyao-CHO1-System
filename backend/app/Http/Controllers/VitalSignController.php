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
            return response()->json(['message' => 'Unauthorized'], 403);
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
            return response()->json(['message' => 'Unauthorized'], 403);
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

        $vital = VitalSign::create(array_merge($data, [
            'patient_id' => $user->patient->id,
            // consultation_id can remain null because it's optional now
        ]));

        return response()->json(['message' => 'Vital signs recorded successfully', 'data' => $vital], 201);
    }
}
