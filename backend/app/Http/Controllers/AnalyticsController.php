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

        $consultationVolume = (clone $query)->select(DB::raw('DATE(consultations.created_at) as date'), DB::raw('count(*) as count'))
            ->groupBy('date')->orderBy('date')->get();

        $byStatus = (clone $query)->select('status', DB::raw('count(*) as total'))->groupBy('status')->get();
        $byDoctor = (clone $query)
            ->leftJoin('doctors', 'consultations.doctor_id', '=', 'doctors.id')
            ->leftJoin('users', 'doctors.user_id', '=', 'users.id')
            ->select(DB::raw("COALESCE(users.name, 'Unassigned') as name"), DB::raw('count(*) as total'))
            ->groupBy('users.name')
            ->orderByDesc('total')
            ->limit(10)
            ->get();

        $topDiseasesQuery = ConsultationForm::whereNotNull('diagnosis');
        
        if ($request->has('start_date') && $request->has('end_date')) {
            $topDiseasesQuery->whereHas('consultation', function($q) use ($request) {
                $q->whereBetween('consultations.created_at', [$request->start_date, $request->end_date]);
            });
        }

        $topDiseases = $topDiseasesQuery->select('diagnosis', DB::raw('count(*) as total'))
            ->groupBy('diagnosis')->orderByDesc('total')->limit(10)->get();

        $activeMedicines = Medicine::with('batches')->where('status', true)->get();
        
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
        $pendingConsultations = (clone $query)->whereIn('status', ['Pending', 'Approved', 'Scheduled'])->count();

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

        return response()->json([
            'summary' => [
                'total_consultations' => $totalConsultations,
                'completed_consultations' => $completedConsultations,
                'pending_consultations' => $pendingConsultations,
                'registered_patients' => Patient::where('archived', false)->count(),
                'active_doctors' => Doctor::count(),
                'active_medicines' => Medicine::where('status', true)->count(),
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
        ]);
    }
}
