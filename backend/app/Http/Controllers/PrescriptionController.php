<?php
namespace App\Http\Controllers;
use App\Models\{Prescription, PrescriptionItem};
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;

class PrescriptionController extends Controller {
    public function index(Request $request) {
        $user = $request->user();
        if ($user->role === 'Patient') {
            return response()->json(Prescription::where('patient_id', $user->patient->id)->with('items.medicine', 'doctor.user')->get());
        }
        return response()->json(Prescription::with('items.medicine', 'patient.user', 'doctor.user')->get());
    }
    public function store(Request $request) {
        $p = Prescription::create(['consultation_id' => $request->consultation_id, 'patient_id' => $request->patient_id, 'doctor_id' => $request->user()->doctor->id, 'notes' => $request->notes]);
        foreach($request->items as $item) {
            $p->items()->create($item);
        }
        return response()->json($p->load('items'));
    }
    public function download($id) {
        $prescription = Prescription::with(['items.medicine', 'patient.user', 'doctor.user'])->findOrFail($id);
        $pdf = Pdf::loadHTML('<h1>E-Prescription for ' . $prescription->patient->user->name . '</h1><p>Doctor: ' . $prescription->doctor->user->name . '</p><ul>' . $prescription->items->map(fn($i) => "<li>{$i->medicine->name} - {$i->dosage} ({$i->frequency})</li>")->join('') . '</ul>');
        return $pdf->download("prescription_{$id}.pdf");
    }
}
