<?php

namespace App\Http\Controllers;

use App\Models\Doctor;
use Illuminate\Http\Request;

class DoctorController extends Controller
{
    private const DEFAULT_SPECIALIZATIONS = [
        'General Medicine',
        'Cardio',
        'Pulmo',
        'Mental',
        'Endo',
    ];

    private function canonicalSpecialization(?string $specialization): ?string
    {
        if (!$specialization) {
            return null;
        }

        $value = strtolower(trim($specialization));
        $aliases = [
            'general' => 'General Medicine',
            'general medicine' => 'General Medicine',
            'cardio' => 'Cardio',
            'cardiology' => 'Cardio',
            'cardiologist' => 'Cardio',
            'pulmo' => 'Pulmo',
            'pulmonology' => 'Pulmo',
            'pulmonologist' => 'Pulmo',
            'mental' => 'Mental',
            'mental health' => 'Mental',
            'psychiatry' => 'Mental',
            'psychology' => 'Mental',
            'endo' => 'Endo',
            'endocrinology' => 'Endo',
            'endocrinologist' => 'Endo',
        ];

        return $aliases[$value] ?? $specialization;
    }

    public function profile(Request $request)
    {
        return response()->json($request->user()->load('doctor'));
    }

    public function updateProfile(Request $request)
    {
        if ($request->filled('name')) {
            $request->user()->update(['name' => $request->name]);
        }

        $doctor = $request->user()->doctor;
        if ($doctor) {
            $doctor->update($request->only(['specialization', 'license_no']));
        }

        return response()->json($request->user()->load('doctor'));
    }

    public function specializations()
    {
        $existing = Doctor::query()
            ->whereHas('user', fn ($q) => $q->where('is_active', true))
            ->where(function ($q) {
                $q->whereNull('active_until')->orWhere('active_until', '>=', now());
            })
            ->pluck('specialization')
            ->map(fn ($specialization) => $this->canonicalSpecialization($specialization))
            ->filter();

        return response()->json(
            collect(self::DEFAULT_SPECIALIZATIONS)
                ->merge($existing)
                ->unique()
                ->values()
        );
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(Doctor $doctor)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Doctor $doctor)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Doctor $doctor)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Doctor $doctor)
    {
        //
    }
}
