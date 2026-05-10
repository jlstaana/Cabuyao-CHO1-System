<?php
namespace App\Http\Controllers;
use App\Models\{AuditLog, Consultation, Doctor, Medicine, Patient, Prescription, PrescriptionItem};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller {
    public function stats(Request $request) {
        $query = Consultation::query();
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('created_at', [$request->start_date, $request->end_date]);
        }
        if ($request->has('doctor_id')) {
            $query->where('doctor_id', $request->doctor_id);
        }

        $consultationVolume = (clone $query)->select(DB::raw('DATE(created_at) as date'), DB::raw('count(*) as count'))
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

        $prescQuery = PrescriptionItem::join('prescriptions', 'prescription_items.prescription_id', '=', 'prescriptions.id')
            ->join('medicines', 'prescription_items.medicine_id', '=', 'medicines.id');

        if ($request->has('medicine_category')) {
            $prescQuery->where('medicines.category', $request->medicine_category);
        }

        $topMedicines = $prescQuery->select('medicines.name', 'medicines.category', DB::raw('count(*) as total'))
            ->groupBy('medicines.name', 'medicines.category')->orderByDesc('total')->limit(10)->get();
        $totalConsultations = (clone $query)->count();
        $completedConsultations = (clone $query)->where('status', 'Completed')->count();
        $pendingConsultations = (clone $query)->whereIn('status', ['Pending', 'Approved', 'Scheduled'])->count();
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

        return response()->json([
            'summary' => [
                'total_consultations' => $totalConsultations,
                'completed_consultations' => $completedConsultations,
                'pending_consultations' => $pendingConsultations,
                'completion_rate' => $totalConsultations ? round(($completedConsultations / $totalConsultations) * 100, 1) : 0,
                'registered_patients' => Patient::where('archived', false)->count(),
                'active_doctors' => Doctor::count(),
                'active_medicines' => Medicine::where('status', true)->count(),
                'prescriptions_issued' => Prescription::count(),
            ],
            'time_based_volume' => $consultationVolume,
            'consultations_by_status' => $byStatus,
            'consultations_by_doctor' => $byDoctor,
            'top_medicines' => $topMedicines,
            'recent_logs' => $recentLogs,
        ]);
    }
}
