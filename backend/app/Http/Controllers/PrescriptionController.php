<?php
namespace App\Http\Controllers;
use App\Models\{AuditLog, Consultation, Prescription, PrescriptionVersion};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Barryvdh\DomPDF\Facade\Pdf;

class PrescriptionController extends Controller {
    private function validatePrescriptionItems(Request $request): array {
        return $request->validate([
            'notes' => 'nullable|string|max:2000',
            'items' => 'required|array|min:1',
            'items.*.medicine_id' => 'required|exists:medicines,id',
            'items.*.dosage' => 'required|string|max:255',
            'items.*.frequency' => 'required|string|max:255',
            'items.*.duration' => 'nullable|string|max:255',
            'items.*.instructions' => 'nullable|string|max:2000',
        ]);
    }

    private function prescriptionSnapshot(Prescription $prescription): array {
        $prescription->loadMissing('items.medicine');
        return [
            'notes' => $prescription->notes,
            'doctor_signature_svg' => $prescription->doctor_signature_svg,
            'items' => $prescription->items->map(fn ($item) => [
                'medicine_id' => $item->medicine_id,
                'medicine_name' => $item->medicine?->name,
                'dosage' => $item->dosage,
                'frequency' => $item->frequency,
                'duration' => $item->duration,
                'instructions' => $item->instructions,
            ])->values()->all(),
        ];
    }

    public function index(Request $request) {
        $user = $request->user();
        if ($user->role === 'Patient') {
            return response()->json(Prescription::where('patient_id', $user->patient->id)->with('items.medicine', 'doctor.user', 'patient.user')->latest('updated_at')->get());
        }
        if ($user->role === 'Doctor') {
            return response()->json(Prescription::where('doctor_id', $user->doctor?->id)->with('items.medicine', 'patient.user', 'doctor.user')->latest('updated_at')->get());
        }
        return response()->json(Prescription::with('items.medicine', 'patient.user', 'doctor.user')->latest('updated_at')->get());
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

        $prescription->load('items.medicine', 'patient.user', 'doctor.user');

        $this->sendActivityAlert(
            $prescription->patient->user,
            'New E-Prescription Available',
            "Dr. {$prescription->doctor->user->name} has issued a new e-prescription for you.",
            "You can now view and download your e-prescription PDF from your dashboard.",
            url(config('app.url') . '/prescriptions')
        );

        return response()->json($prescription);
    }
    public function update(Request $request, $id) {
        $data = $this->validatePrescriptionItems($request);
        $doctor = $request->user()->doctor;
        if (!$doctor) {
            throw ValidationException::withMessages(['doctor' => ['Only doctors can update prescriptions.']]);
        }

        $prescription = DB::transaction(function () use ($id, $data, $request, $doctor) {
            $prescription = Prescription::with('items.medicine')->lockForUpdate()->findOrFail($id);
            if ((int) $prescription->doctor_id !== (int) $doctor->id) {
                throw ValidationException::withMessages(['prescription' => ['You can only update prescriptions you created.']]);
            }

            $nextVersion = ((int) $prescription->versions()->max('version')) + 1;
            PrescriptionVersion::create([
                'prescription_id' => $prescription->id,
                'version' => $nextVersion,
                'snapshot' => $this->prescriptionSnapshot($prescription),
                'updated_by' => $request->user()->id,
            ]);

            $prescription->update(['notes' => $data['notes'] ?? null]);
            $prescription->items()->delete();
            foreach ($data['items'] as $item) {
                $prescription->items()->create($item);
            }

            AuditLog::create([
                'user_id' => $request->user()->id,
                'action' => "Updated Prescription #{$prescription->id}",
                'description' => "Recorded previous prescription version {$nextVersion}.",
                'ip_address' => $request->ip(),
            ]);

            return $prescription;
        });

        $prescription->load('items.medicine', 'patient.user', 'doctor.user', 'versions');

        $this->sendActivityAlert(
            $prescription->patient->user,
            'E-Prescription Updated',
            "Dr. {$prescription->doctor->user->name} has updated your e-prescription.",
            "Please review the updated medicine list and dosage instructions.",
            url(config('app.url') . '/prescriptions')
        );

        return response()->json([
            'message' => 'Prescription updated. Patient has been notified.',
            'prescription' => $prescription,
        ]);
    }
    public function download(Request $request, $id) {
        $user = $request->user();
        $prescription = Prescription::with(['items.medicine', 'patient.user', 'doctor.user'])->findOrFail($id);

        if ($user->role === 'Patient' && (int) $prescription->patient_id !== (int) $user->patient?->id) {
            return response()->json(['message' => 'Unauthorized prescription download'], 403);
        }
        if ($user->role === 'Doctor' && (int) $prescription->doctor_id !== (int) $user->doctor?->id) {
            return response()->json(['message' => 'Unauthorized prescription download'], 403);
        }

        $doctorSignatureSvg = $prescription->doctor_signature_svg;
        $doctorSignatureSrc = null;

        if ($doctorSignatureSvg) {
            // Remove existing width/height from the <svg> opening tag
            $normalizedSvg = preg_replace('/(<svg[^>]*?)\s+width="[^"]*"/i', '$1', $doctorSignatureSvg);
            $normalizedSvg = preg_replace('/(<svg[^>]*?)\s+height="[^"]*"/i', '$1', $normalizedSvg);
            // Inject fixed dimensions — small enough to fit under the signature line
            $normalizedSvg = preg_replace('/(<svg)/i', '$1 width="140" height="28" preserveAspectRatio="xMidYMid meet"', $normalizedSvg, 1);
            $doctorSignatureSrc = $normalizedSvg; // Pass raw inline SVG, not base64
        }

        $pdf = Pdf::loadView('pdf.prescription', compact('prescription', 'doctorSignatureSrc'))->setPaper('a5', 'portrait');
        return $pdf->download("prescription_{$id}.pdf");
    }
}
