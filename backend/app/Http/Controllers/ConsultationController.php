<?php
namespace App\Http\Controllers;
use App\Models\{Consultation, Doctor, VitalSign, MedicalImage, ConsultationForm};
use Illuminate\Http\Request;

class ConsultationController extends Controller {
    private function specializationTerms(string $specialization): array {
        $value = strtolower($specialization);
        $aliases = [
            'general' => ['general', 'general medicine'],
            'general medicine' => ['general', 'general medicine'],
            'cardio' => ['cardio', 'cardiology', 'cardiologist'],
            'cardiology' => ['cardio', 'cardiology', 'cardiologist'],
            'pulmo' => ['pulmo', 'pulmonology', 'pulmonologist'],
            'pulmonology' => ['pulmo', 'pulmonology', 'pulmonologist'],
            'mental' => ['mental', 'mental health', 'psychiatry', 'psychology'],
            'mental health' => ['mental', 'mental health', 'psychiatry', 'psychology'],
            'endo' => ['endo', 'endocrinology', 'endocrinologist'],
            'endocrinology' => ['endo', 'endocrinology', 'endocrinologist'],
        ];
        return $aliases[$value] ?? [$specialization];
    }

    private function matchingDoctor(?string $specialization, ?string $scheduledAt): ?Doctor {
        if (!$specialization) {
            return null;
        }

        $query = Doctor::with(['user', 'availability'])
            ->whereHas('user', fn ($q) => $q->where('is_active', true))
            ->where(function ($q) use ($specialization) {
                foreach ($this->specializationTerms($specialization) as $term) {
                    $q->orWhere('specialization', 'like', "%{$term}%");
                }
            })
            ->where(function ($q) {
                $q->whereNull('active_until')->orWhere('active_until', '>=', now());
            });

        $doctors = $query->get();
        if (!$scheduledAt) {
            return $doctors->first();
        }

        $requested = new \DateTime($scheduledAt);
        $day = $requested->format('l');
        $time = $requested->format('H:i:s');

        return $doctors->first(function ($doctor) use ($day, $time) {
            if ($doctor->availability->isEmpty()) {
                return true;
            }
            return $doctor->availability->contains(function ($slot) use ($day, $time) {
                return $slot->day_of_week === $day
                    && $slot->start_time <= $time
                    && $slot->end_time >= $time;
            });
        });
    }

    public function index(Request $request) {
        $user = $request->user();
        $query = Consultation::with(['patient.user', 'doctor.user', 'vitalSigns', 'medicalImages', 'form', 'prescription.items.medicine']);
        if ($user->role === 'Patient') {
            $query->where('patient_id', $user->patient->id);
        } elseif ($user->role === 'Doctor') {
            $doctor = $user->doctor;
            $query->where(function ($q) use ($doctor) {
                $q->where('doctor_id', $doctor->id)
                    ->orWhere(function ($inner) use ($doctor) {
                        $inner->whereNull('doctor_id')
                            ->where(function ($specializationQuery) use ($doctor) {
                                foreach ($this->specializationTerms($doctor->specialization) as $term) {
                                    $specializationQuery->orWhere('requested_specialization', 'like', "%{$term}%");
                                }
                            });
                    });
            });
        }
        return response()->json($query->orderBy('created_at', 'desc')->get());
    }
    public function requestConsultation(Request $request) {
        $request->validate([
            'requested_specialization' => 'required|string|max:255',
            'scheduled_at' => 'nullable|date',
        ]);

        $doctor = $this->matchingDoctor($request->requested_specialization, $request->scheduled_at);

        $c = Consultation::create([
            'patient_id' => $request->user()->patient->id,
            'doctor_id' => $doctor?->id,
            'requested_specialization' => $request->requested_specialization,
            'scheduled_at' => $request->scheduled_at,
            'status' => $doctor && $request->scheduled_at ? 'Scheduled' : 'Pending',
        ]);
        return response()->json($c);
    }
    public function recordVitals(Request $request, $id) {
        $v = VitalSign::updateOrCreate(['consultation_id' => $id], $request->all());
        return response()->json($v);
    }
    public function uploadImage(Request $request, $id) {
        $request->validate(['image' => 'required|mimes:jpg,png,pdf|max:10240']);
        $path = $request->file('image')->store('medical_images', 'public');
        $img = MedicalImage::create(['consultation_id' => $id, 'patient_id' => $request->user()->patient->id, 'file_path' => $path, 'file_type' => $request->file('image')->extension(), 'file_size' => $request->file('image')->getSize()]);
        return response()->json($img);
    }
    public function updateStatus(Request $request, $id) {
        $c = Consultation::findOrFail($id);
        $user = $request->user();

        if ($user->role === 'Patient' && (int) $c->patient_id !== (int) $user->patient->id) {
            return response()->json(['message' => 'Unauthorized consultation'], 403);
        }
        if ($user->role === 'Doctor' && $c->doctor_id && (int) $c->doctor_id !== (int) $user->doctor->id) {
            return response()->json(['message' => 'Unauthorized consultation'], 403);
        }

        $data = [
            'status' => $request->status,
        ];
        if ($request->filled('scheduled_at')) {
            $data['scheduled_at'] = $request->scheduled_at;
        }
        if ($request->filled('doctor_id') && in_array($user->role, ['Admin', 'Staff'])) {
            $data['doctor_id'] = $request->doctor_id;
        }
        if ($request->status === 'Cancelled') {
            $data['scheduled_at'] = null;
        }
        $c->update($data);
        return response()->json($c);
    }
    public function complete(Request $request, $id) {
        $c = Consultation::findOrFail($id);
        $c->update(['status' => 'Completed', 'doctor_id' => $request->user()->doctor->id]);
        ConsultationForm::updateOrCreate(
            ['consultation_id' => $id],
            ['symptoms' => $request->symptoms, 'diagnosis' => $request->diagnosis, 'notes' => $request->notes]
        );
        return response()->json($c->load('form', 'prescription.items.medicine'));
    }
}
