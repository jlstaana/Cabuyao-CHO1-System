<?php
namespace App\Http\Controllers;
use App\Models\{Consultation, VitalSign, MedicalImage, ConsultationForm};
use Illuminate\Http\Request;

class ConsultationController extends Controller {
    public function index(Request $request) {
        $user = $request->user();
        $query = Consultation::with(['patient.user', 'doctor.user', 'vitalSigns', 'medicalImages', 'form']);
        if ($user->role === 'Patient') {
            $query->where('patient_id', $user->patient->id);
        } elseif ($user->role === 'Doctor') {
            $query->where('doctor_id', $user->doctor->id)->orWhereNull('doctor_id');
        }
        return response()->json($query->orderBy('created_at', 'desc')->get());
    }
    public function requestConsultation(Request $request) {
        $c = Consultation::create(['patient_id' => $request->user()->patient->id, 'status' => 'Pending']);
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
        $c->update(['status' => $request->status, 'scheduled_at' => $request->scheduled_at]);
        if ($request->status === 'Approved' && $request->has('doctor_id')) {
            $c->update(['doctor_id' => $request->doctor_id]);
        }
        return response()->json($c);
    }
    public function complete(Request $request, $id) {
        $c = Consultation::findOrFail($id);
        $c->update(['status' => 'Completed', 'doctor_id' => $request->user()->doctor->id]);
        ConsultationForm::create(['consultation_id' => $id, 'symptoms' => $request->symptoms, 'diagnosis' => $request->diagnosis, 'notes' => $request->notes]);
        return response()->json($c->load('form'));
    }
}
