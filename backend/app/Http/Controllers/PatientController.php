<?php
namespace App\Http\Controllers;
use Illuminate\Http\Request;

class PatientController extends Controller {
    public function profile(Request $request) {
        return response()->json($request->user()->load('patient'));
    }
    public function updateProfile(Request $request) {
        if ($request->filled('name')) {
            $request->user()->update(['name' => $request->name]);
        }
        $patient = $request->user()->patient;
        $patient->update($request->only(['dob', 'address', 'contact_no']));
        return response()->json($request->user()->load('patient'));
    }
    public function history(Request $request) {
        return response()->json($request->user()->patient->consultations()->with('doctor.user', 'prescription')->get());
    }
}
