<?php
namespace App\Http\Controllers;
use App\Models\{Consultation, PrescriptionItem};
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

        $prescQuery = PrescriptionItem::join('prescriptions', 'prescription_items.prescription_id', '=', 'prescriptions.id')
            ->join('medicines', 'prescription_items.medicine_id', '=', 'medicines.id');

        if ($request->has('medicine_category')) {
            $prescQuery->where('medicines.category', $request->medicine_category);
        }

        $topMedicines = $prescQuery->select('medicines.name', 'medicines.category', DB::raw('count(*) as total'))
            ->groupBy('medicines.name', 'medicines.category')->orderByDesc('total')->limit(10)->get();

        return response()->json([
            'time_based_volume' => $consultationVolume,
            'consultations_by_status' => $byStatus,
            'top_medicines' => $topMedicines
        ]);
    }
}
