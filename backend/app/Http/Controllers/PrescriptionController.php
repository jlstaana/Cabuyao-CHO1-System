<?php
namespace App\Http\Controllers;
use App\Models\{Consultation, Prescription};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
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
        $request->validate([
            'consultation_id' => 'required|exists:consultations,id',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.medicine_id' => 'required|exists:medicines,id',
            'items.*.dosage' => 'nullable|string',
            'items.*.frequency' => 'nullable|string',
            'items.*.duration' => 'nullable|string',
            'items.*.instructions' => 'nullable|string',
            'doctor_signature_svg' => 'required|string|max:200000',
        ]);

        $doctor = $request->user()->doctor;
        if (!$doctor) {
            throw ValidationException::withMessages(['doctor' => ['Only doctors can generate prescriptions.']]);
        }

        $prescription = DB::transaction(function () use ($request, $doctor) {
            $consultation = Consultation::lockForUpdate()->findOrFail($request->consultation_id);
            if ($consultation->doctor_id && (int) $consultation->doctor_id !== (int) $doctor->id) {
                throw ValidationException::withMessages(['consultation_id' => ['This consultation is assigned to another doctor.']]);
            }

            $prescription = Prescription::firstOrNew(['consultation_id' => $consultation->id]);

            if ($prescription->exists) {
                $prescription->items()->delete();
            }

            $prescription->fill([
                'patient_id' => $consultation->patient_id,
                'doctor_id' => $doctor->id,
                'notes' => $request->notes,
                'doctor_signature_svg' => $request->doctor_signature_svg,
            ]);
            $prescription->save();

            foreach ($request->items as $item) {
                $prescription->items()->create($item);
            }

            $consultation->update([
                'doctor_id' => $doctor->id,
                'status' => 'Completed',
            ]);

            return $prescription;
        });

        return response()->json($prescription->load('items.medicine', 'patient.user', 'doctor.user'));
    }
    public function download($id) {
        $prescription = Prescription::with(['items.medicine', 'patient.user', 'doctor.user'])->findOrFail($id);
        $doctorSignatureSvg = $prescription->doctor_signature_svg;
        $doctorSignatureSrc = $doctorSignatureSvg
            ? 'data:image/svg+xml;base64,' . base64_encode($doctorSignatureSvg)
            : null;
        $pdf = Pdf::loadView('pdf.prescription', compact('prescription', 'doctorSignatureSrc'));
        return $pdf->download("prescription_{$id}.pdf");
    }
}
