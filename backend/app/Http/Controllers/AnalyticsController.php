<?php
namespace App\Http\Controllers;
use App\Models\{AuditLog, Consultation, ConsultationForm, Doctor, Medicine, Patient, Prescription, PrescriptionItem, User};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller {
    public function stats(Request $request) {
        $query = Consultation::query();
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('consultations.created_at', [$request->start_date, $request->end_date]);
        } else {
            $query->whereBetween('consultations.created_at', [now()->startOfMonth(), now()->endOfMonth()]);
        }
        if ($request->has('doctor_id')) {
            $query->where('doctor_id', $request->doctor_id);
        }
        if ($request->has('age_group') && $request->age_group !== '') {
            $query->whereHas('patient', function($q) use ($request) {
                $q->where('category', $request->age_group);
            });
        }
        if ($request->has('barangay') && $request->barangay !== '') {
            $query->whereHas('patient', function($q) use ($request) {
                $q->where('address', 'like', $request->barangay . '%');
            });
        }

        $consultationVolume = (clone $query)->select(DB::raw('DATE(consultations.created_at) as date'), DB::raw('count(*) as count'))
            ->groupBy('date')->orderBy('date')->get();

        
        
        $tomorrowStr = \Carbon\Carbon::tomorrow()->englishDayOfWeek;
        $tomorrowDoctors = \App\Models\Doctor::with(['user', 'availability' => function($q) use ($tomorrowStr) {
            $q->where('day_of_week', $tomorrowStr);
        }])->get()->filter(function($doctor) {
            return $doctor->availability->isNotEmpty();
        })->map(function($doctor) {
            return [
                'name' => $doctor->user->name,
                'schedule' => $doctor->availability->map(function($a) {
                    return \Carbon\Carbon::parse($a->start_time)->format('g:i A') . ' - ' . \Carbon\Carbon::parse($a->end_time)->format('g:i A');
                })->join(', ')
            ];
        })->values();

        $peakHoursData = (clone $query)
            ->whereNotNull('consultations.scheduled_at')
            ->get(['scheduled_at'])
            ->groupBy(function($date) {
                return \Carbon\Carbon::parse($date->scheduled_at)->format('H');
            })
            ->map(function($row, $hour) {
                $h = (int)$hour;
                $ampm = $h >= 12 ? 'PM' : 'AM';
                $displayHour = $h % 12;
                if ($displayHour === 0) $displayHour = 12;
                return [
                    'hour_key' => $hour,
                    'hour' => $displayHour . ':00 ' . $ampm,
                    'count' => $row->count()
                ];
            })
            ->sortBy('hour_key')
            ->values()
            ->map(function($item) {
                unset($item['hour_key']);
                return $item;
            });

        $categories = Medicine::whereNotNull('category')->where('category', '!=', '')->distinct()->pluck('category')->values();
        $doctorsList = Doctor::with('user')->get()->map(function($d) {
            return [
                'id' => $d->id,
                'name' => $d->user ? $d->user->name : 'Unknown Doctor'
            ];
        })->values();
        $ageGroups = Patient::whereNotNull('category')->where('category', '!=', '')->distinct()->pluck('category')->values();
        $barangays = Patient::whereNotNull('address')
            ->where('address', '!=', '')
            ->pluck('address')
            ->map(function($address) {
                $parts = explode(',', $address);
                return trim($parts[0]);
            })
            ->filter()
            ->unique()
            ->values();

        $byStatus = (clone $query)->select('status', DB::raw('count(*) as total'))->groupBy('status')->get();
        $byDoctor = (clone $query)
            ->leftJoin('doctors', 'consultations.doctor_id', '=', 'doctors.id')
            ->leftJoin('users', 'doctors.user_id', '=', 'users.id')
            ->select(DB::raw("COALESCE(users.name, 'Unassigned') as name"), DB::raw('count(*) as total'))
            ->groupBy('users.name')
            ->orderByDesc('total')
            ->limit(10)
            ->get();

        $topDiseasesQuery = ConsultationForm::whereNotNull('diagnosis')
            ->whereHas('consultation', function($q) use ($request) {
                if ($request->has('start_date') && $request->has('end_date')) {
                    $q->whereBetween('consultations.created_at', [$request->start_date, $request->end_date]);
                } else {
                    $q->whereBetween('consultations.created_at', [now()->startOfMonth(), now()->endOfMonth()]);
                }
                if ($request->has('doctor_id') && $request->doctor_id !== '') {
                    $q->where('doctor_id', $request->doctor_id);
                }
                if ($request->has('age_group') && $request->age_group !== '') {
                    $q->whereHas('patient', function($pq) use ($request) {
                        $pq->where('category', $request->age_group);
                    });
                }
                if ($request->has('barangay') && $request->barangay !== '') {
                    $q->whereHas('patient', function($pq) use ($request) {
                        $pq->where('address', 'like', $request->barangay . '%');
                    });
                }
            });

        $topDiseases = $topDiseasesQuery->select('diagnosis', DB::raw('count(*) as total'))
            ->groupBy('diagnosis')->orderByDesc('total')->limit(10)->get();

        $activeMedicinesQuery = Medicine::with('batches')->where('status', true);
        if ($request->has('category') && $request->category !== '') {
            $activeMedicinesQuery->where('category', $request->category);
        }
        $activeMedicines = $activeMedicinesQuery->get();
        
        $lowStockMedicines = $activeMedicines->filter(function ($medicine) {
            return $medicine->total_stock <= 20;
        })->groupBy(function($medicine) {
            return $medicine->category ?: 'Uncategorized';
        })->map(function ($group, $category) {
            return [
                'category' => $category,
                'count' => $group->count()
            ];
        })->sortByDesc('count')->values();

        $lowStockCount = $activeMedicines->filter(function ($medicine) {
            return $medicine->total_stock <= 20;
        })->count();

        $totalConsultations = (clone $query)->count();
        $completedConsultations = (clone $query)->where('status', 'Completed')->count();
        $scheduledConsultations = (clone $query)->whereIn('status', ['Scheduled'])->count();

        $patientCountQuery = Patient::where('archived', false);
        if ($request->has('age_group') && $request->age_group !== '') {
            $patientCountQuery->where('category', $request->age_group);
        }
        if ($request->has('barangay') && $request->barangay !== '') {
            $patientCountQuery->where('address', 'like', $request->barangay . '%');
        }
        $registeredPatientsCount = $patientCountQuery->count();

        $doctorCountQuery = Doctor::query();
        if ($request->has('doctor_id') && $request->doctor_id !== '') {
            $doctorCountQuery->where('id', $request->doctor_id);
        }
        $activeDoctorsCount = $doctorCountQuery->count();

        // Epidemiological Analytics: Patient Demographics (Age Group/Category)
        $byAgeGroup = (clone $query)
            ->join('patients', 'consultations.patient_id', '=', 'patients.id')
            ->select(DB::raw("COALESCE(patients.category, 'Unknown') as category"), DB::raw('count(*) as total'))
            ->groupBy('patients.category')
            ->orderByDesc('total')
            ->get();

        // Epidemiological Analytics: Geographic Distribution (Barangay)
        // Note: SQLite doesn't support SUBSTRING_INDEX, so we extract in PHP
        $consultationsWithAddress = (clone $query)
            ->join('patients', 'consultations.patient_id', '=', 'patients.id')
            ->select('patients.address')
            ->whereNotNull('patients.address')
            ->where('patients.address', '!=', '')
            ->get();

        $byBarangay = $consultationsWithAddress
            ->map(function ($row) {
                $parts = explode(',', $row->address);
                return trim($parts[0]);
            })
            ->countBy()
            ->map(function ($count, $barangay) {
                return (object)['barangay' => $barangay, 'total' => $count];
            })
            ->sortByDesc('total')
            ->take(15)
            ->values();

        $recentLogs = AuditLog::with('user:id,name,role')
            ->latest()
            ->limit(20)
            ->get()
            ->map(function ($log) {
                return [
                    'action' => $log->action,
                    'description' => $log->description,
                    'ip_address' => $log->ip_address,
                    'user' => $log->user?->name,
                    'role' => $log->user?->role,
                    'created_at' => $log->created_at,
                ];
            });

        $prescriptionsQuery = Prescription::query();
        if ($request->has('start_date') && $request->has('end_date')) {
            $prescriptionsQuery->whereBetween('created_at', [$request->start_date, $request->end_date]);
        } else {
            $prescriptionsQuery->whereBetween('created_at', [now()->startOfMonth(), now()->endOfMonth()]);
        }
        if ($request->has('category') && $request->category !== '') {
            $prescriptionsQuery->whereHas('items.medicine', function($q) use ($request) {
                $q->where('category', $request->category);
            });
        }

                $recentConsultations = \App\Models\Consultation::with(['doctor.user', 'patient.user'])
            ->latest('updated_at')
            ->limit(10)
            ->get()
            ->map(function ($c) {
                $patientName = $c->patient?->user?->name ?? 'Unknown';
                $nameParts = explode(' ', trim($patientName));
                if (count($nameParts) > 1) {
                    $initial = strtoupper(substr($nameParts[0], 0, 1));
                    $lastName = array_pop($nameParts);
                    $formattedName = $initial . '. ' . $lastName;
                } else {
                    $formattedName = $patientName;
                }
                
                return [
                    'id' => $c->id,
                    'status' => $c->status,
                    'doctor' => $c->doctor?->user?->name ?? 'Unassigned',
                    'patient' => $formattedName,
                    'time' => $c->updated_at->diffForHumans(),
                    'raw_time' => $c->updated_at,
                ];
            });

        return response()->json([
            'summary' => [
                'total_consultations' => $totalConsultations,
                'completed_consultations' => $completedConsultations,
                'scheduled_consultations' => $scheduledConsultations,
                'registered_patients' => $registeredPatientsCount,
                'active_doctors' => $activeDoctorsCount,
                'active_medicines' => $activeMedicines->count(),
                'low_stock_count' => $lowStockCount,
                'prescriptions_issued' => $prescriptionsQuery->count(),
            ],
            'time_based_volume' => $consultationVolume,
            'consultations_by_status' => $byStatus,
            'consultations_by_doctor' => $byDoctor,
            'top_diseases' => $topDiseases,
            'demographics_by_age' => $byAgeGroup,
            'cases_by_barangay' => $byBarangay,
            'low_stock_medicines' => $lowStockMedicines,
            'recent_logs' => $recentLogs,
            'recent_consultations' => $recentConsultations,
            'tomorrow_doctors' => $tomorrowDoctors,
            'peak_hours' => $peakHoursData,
            'categories' => $categories,
            'doctors' => $doctorsList,
            'age_groups' => $ageGroups,
            'barangays' => $barangays,
        ]);
    }
}
