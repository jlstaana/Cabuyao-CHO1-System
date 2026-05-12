<?php

namespace App\Http\Controllers;

use App\Models\{AuditLog, Doctor};
use Illuminate\Http\Request;

class DoctorController extends Controller
{
    private const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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
        return response()->json($request->user()->load('doctor.availability'));
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

    private function minutes(string $time): int
    {
        [$hours, $minutes] = array_map('intval', explode(':', substr($time, 0, 5)));
        return ($hours * 60) + $minutes;
    }

    private function hasScheduleConflict(array $entries): bool
    {
        $byDay = [];
        foreach ($entries as $entry) {
            $byDay[$entry['day_of_week']][] = [
                'start' => $this->minutes($entry['start_time']),
                'end' => $this->minutes($entry['end_time']),
            ];
        }

        foreach ($byDay as $slots) {
            usort($slots, fn ($a, $b) => $a['start'] <=> $b['start']);
            for ($i = 1; $i < count($slots); $i++) {
                if ($slots[$i]['start'] < $slots[$i - 1]['end']) {
                    return true;
                }
            }
        }

        return false;
    }

    public function updateAvailability(Request $request)
    {
        if ($request->user()->role !== 'Doctor' || !$request->user()->doctor) {
            return response()->json(['message' => 'Only doctors can update availability settings.'], 403);
        }

        $data = $request->validate([
            'doctor_type' => 'required|in:Resident,Visiting',
            'availability' => 'required|array|min:1',
            'availability.*.day_of_week' => 'required|in:' . implode(',', self::DAYS),
            'availability.*.start_time' => 'required|date_format:H:i',
            'availability.*.end_time' => 'required|date_format:H:i',
        ]);

        $doctor = $request->user()->doctor()->with('availability')->first();
        $entries = collect($data['availability'])
            ->map(fn ($entry) => [
                'day_of_week' => $entry['day_of_week'],
                'start_time' => substr($entry['start_time'], 0, 5),
                'end_time' => substr($entry['end_time'], 0, 5),
            ])
            ->values()
            ->all();

        $hasInvalidTime = collect($entries)->contains(fn ($entry) => $this->minutes($entry['end_time']) <= $this->minutes($entry['start_time']));
        if ($hasInvalidTime) {
            return response()->json([
                'message' => 'Invalid schedule. End time must be later than start time.',
            ], 422);
        }

        if ($this->hasScheduleConflict($entries)) {
            return response()->json([
                'message' => 'Schedule conflict found. Previous schedule was kept.',
            ], 409);
        }

        if ($data['doctor_type'] === 'Visiting') {
            $days = collect($entries)->pluck('day_of_week')->unique();
            $hasLongSlot = collect($entries)->contains(fn ($entry) => ($this->minutes($entry['end_time']) - $this->minutes($entry['start_time'])) > 240);
            if ($days->count() > 3 || $hasLongSlot) {
                return response()->json([
                    'message' => 'Invalid schedule. Visiting doctors are limited to 3 days per week and 4 hours per time slot.',
                ], 422);
            }
        }

        $doctor->availability()->delete();
        foreach ($entries as $entry) {
            $doctor->availability()->create($entry);
        }
        $doctor->update(['doctor_type' => $data['doctor_type']]);

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'Updated Doctor Availability',
            'description' => "Updated {$data['doctor_type']} doctor schedule.",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'message' => "{$data['doctor_type']} doctor availability saved.",
            'doctor' => $doctor->fresh(['availability', 'user:id,name,is_active']),
        ]);
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

    public function availableDoctors()
    {
        $now = now();
        $day = $now->format('l');
        $time = $now->format('H:i:s');

        $doctors = Doctor::with(['user:id,name,is_active', 'availability'])
            ->whereHas('user', fn ($q) => $q->where('is_active', true))
            ->where(function ($q) {
                $q->whereNull('active_until')->orWhere('active_until', '>=', now());
            })
            ->get()
            ->map(function (Doctor $doctor) use ($day, $time) {
                $isOnSchedule = $doctor->availability->isEmpty() || $doctor->availability->contains(function ($slot) use ($day, $time) {
                    return $slot->day_of_week === $day
                        && $slot->start_time <= $time
                        && $slot->end_time >= $time;
                });

                return [
                    'id' => $doctor->id,
                    'user_id' => $doctor->user_id,
                    'name' => $doctor->user?->name,
                    'specialization' => $this->canonicalSpecialization($doctor->specialization),
                    'doctor_type' => $doctor->doctor_type ?: 'Resident',
                    'is_active' => (bool) $doctor->user?->is_active,
                    'is_available_now' => $isOnSchedule,
                    'availability' => $doctor->availability->map(fn ($slot) => [
                        'day_of_week' => $slot->day_of_week,
                        'start_time' => substr($slot->start_time, 0, 5),
                        'end_time' => substr($slot->end_time, 0, 5),
                    ])->values(),
                ];
            });

        return response()->json($doctors);
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
