<?php

namespace App\Http\Controllers;

use App\Models\{AuditLog, Consultation, Doctor};
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

    private function slotCapacityForDoctor(Doctor $doctor): int
    {
        return str_contains(strtolower((string) $doctor->specialization), 'general') ? 35 : 18;
    }

    private function bookedSlotsForDoctor(Doctor $doctor)
    {
        $capacity = $this->slotCapacityForDoctor($doctor);
        $bookings = [];

        // Use eager loaded relation if available, otherwise fallback to query
        $consultations = $doctor->relationLoaded('consultations') 
            ? $doctor->consultations 
            : Consultation::query()
                ->where('doctor_id', $doctor->id)
                ->where('status', 'Scheduled')
                ->whereNotNull('scheduled_at')
                ->where('scheduled_at', '>=', now()->subMinutes(15))
                ->orderBy('scheduled_at')
                ->get(['scheduled_at']);

        $consultations->each(function (Consultation $consultation) use ($doctor, &$bookings, $capacity) {
                $scheduledAt = $consultation->scheduled_at;
                $day = $scheduledAt->format('l');
                $time = $scheduledAt->format('H:i:s');

                $slot = $doctor->availability->first(function ($slot) use ($day, $time) {
                    return $slot->day_of_week === $day
                        && $slot->start_time <= $time
                        && $slot->end_time >= $time;
                });

                if (!$slot) {
                    return;
                }

                $key = implode('|', [$scheduledAt->toDateString(), $slot->day_of_week, substr($slot->start_time, 0, 5), substr($slot->end_time, 0, 5)]);
                $bookings[$key] ??= [
                    'date' => $scheduledAt->toDateString(),
                    'day_of_week' => $slot->day_of_week,
                    'start_time' => substr($slot->start_time, 0, 5),
                    'end_time' => substr($slot->end_time, 0, 5),
                    'booked_count' => 0,
                    'capacity' => $capacity,
                ];
                $bookings[$key]['booked_count']++;
            });

        return collect($bookings)
            ->map(function ($slot) {
                $slot['remaining'] = max($slot['capacity'] - $slot['booked_count'], 0);
                $slot['is_full'] = $slot['remaining'] <= 0;
                return $slot;
            })
            ->values();
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
            'exceptions' => 'nullable|array',
            'exceptions.*.date' => 'required|date_format:Y-m-d',
            'exceptions.*.type' => 'required|in:leave,extra_slot',
            'exceptions.*.start_time' => 'nullable|date_format:H:i',
            'exceptions.*.end_time' => 'nullable|date_format:H:i',
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
            return response()->json(['message' => 'Invalid time range: End time must be after start time.'], 422);
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

        
        $oldLeaves = $doctor->exceptions()->where('type', 'leave')->pluck('date')->toArray();

        $doctor->availability()->delete();
        foreach ($entries as $entry) {
            $doctor->availability()->create($entry);
        }
        $doctor->update(['doctor_type' => $data['doctor_type']]);

        if (isset($data['exceptions'])) {
            $doctor->exceptions()->delete();
            foreach ($data['exceptions'] as $exc) {
                $doctor->exceptions()->create([
                    'date' => $exc['date'],
                    'type' => $exc['type'],
                    'start_time' => empty($exc['start_time']) ? null : substr($exc['start_time'], 0, 5),
                    'end_time' => empty($exc['end_time']) ? null : substr($exc['end_time'], 0, 5),
                ]);
            }
        }
        
        $newLeaves = collect($data['exceptions'] ?? [])->where('type', 'leave')->pluck('date')->toArray();
        $declaredLeaves = array_diff($newLeaves, $oldLeaves);

        $reassignedCount = 0;
        $rescheduledCount = 0;

        if (!empty($declaredLeaves)) {
            // Figure 72 Automated Workflow Logic
            $affected = \App\Models\Consultation::where('doctor_id', $doctor->id)
                ->where('status', 'Scheduled')
                ->whereIn(\Illuminate\Support\Facades\DB::raw('DATE(scheduled_at)'), $declaredLeaves)
                ->get();

            foreach ($affected as $consult) {
                // Find substitute (same specialization, active)
                $substitute = \App\Models\Doctor::where('id', '!=', $doctor->id)
                    ->where('specialization', $doctor->specialization)
                    ->whereHas('user', fn($q) => $q->where('is_active', true))
                    ->first();

                if ($substitute) {
                    $consult->update(['doctor_id' => $substitute->id]);
                    $reassignedCount++;
                    
                    \App\Models\AuditLog::create([
                        'user_id' => $request->user()->id,
                        'action' => 'Emergency Reassignment',
                        'description' => "Consultation #{$consult->id} reassigned to Dr. {$substitute->user->name} due to emergency leave.",
                        'ip_address' => $request->ip()
                    ]);
                } else {
                    // Reschedule to next available week automatically
                    $nextDate = \Carbon\Carbon::parse($consult->scheduled_at)->addDays(7)->format('Y-m-d H:i:s');
                    $consult->update(['scheduled_at' => $nextDate, 'status' => 'Pending']); 
                    $rescheduledCount++;
                    
                    \App\Models\AuditLog::create([
                        'user_id' => $request->user()->id,
                        'action' => 'Emergency Auto-Reschedule',
                        'description' => "Consultation #{$consult->id} auto-rescheduled to {$nextDate} due to emergency leave and no available substitute.",
                        'ip_address' => $request->ip()
                    ]);
                }
            }

            if ($reassignedCount || $rescheduledCount) {
                \App\Models\AuditLog::create([
                    'user_id' => $request->user()->id,
                    'action' => 'Emergency Leave Declared',
                    'description' => "Declared emergency absence for " . implode(', ', $declaredLeaves) . ". Dispatched email/in-app notifications. Reassigned {$reassignedCount}, Rescheduled {$rescheduledCount}.",
                    'ip_address' => $request->ip()
                ]);
            }
        }

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'Updated Doctor Availability',
            'description' => "Updated {$data['doctor_type']} doctor schedule.",
            'ip_address' => $request->ip(),
        ]);

        $msg = "{$data['doctor_type']} doctor availability saved.";
        if ($reassignedCount || $rescheduledCount) {
            $msg .= " Emergency Protocol Triggered: {$reassignedCount} patient(s) reassigned, {$rescheduledCount} auto-rescheduled.";
        }

        return response()->json([
            'message' => $msg,
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

        $doctors = Doctor::with([
            'user:id,name,is_active', 
            'availability',
            'exceptions',
            'consultations' => function ($q) {
                $q->where('status', 'Scheduled')
                  ->whereNotNull('scheduled_at')
                  ->where('scheduled_at', '>=', now()->subMinutes(15))
                  ->orderBy('scheduled_at')
                  ->select(['id', 'doctor_id', 'scheduled_at', 'status']);
            }
        ])
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
                    'slot_capacity' => $this->slotCapacityForDoctor($doctor),
                    'availability' => $doctor->availability->map(fn ($slot) => [
                        'day_of_week' => $slot->day_of_week,
                        'start_time' => substr($slot->start_time, 0, 5),
                        'end_time' => substr($slot->end_time, 0, 5),
                    ])->values(),
                    'booked_slots' => $this->bookedSlotsForDoctor($doctor),
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
