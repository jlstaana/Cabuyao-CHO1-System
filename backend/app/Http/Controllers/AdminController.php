<?php
namespace App\Http\Controllers;
use App\Models\{User, Doctor, Staff, AuditLog};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminController extends Controller {
    public function getUsers() {
        return response()->json(User::with(['doctor', 'staff', 'patient'])->get());
    }
    public function createDoctor(Request $request) {
        $request->validate([
            'name' => 'required',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:8',
            'specialization' => 'required',
            'license_no' => 'nullable|unique:doctors,license_no',
            'expires_at' => 'nullable|date',
            'access_type' => 'nullable|in:permanent,visiting',
            'availability_days' => 'nullable|array',
            'availability_days.*' => 'in:Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i|after:start_time',
        ]);
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'Doctor',
            'first_login' => true,
            'is_active' => true,
            'email_verified_at' => now(),
        ]);
        $doctor = Doctor::create([
            'user_id' => $user->id,
            'specialization' => $request->specialization,
            'license_no' => $request->license_no ?: 'VIS-' . str_pad($user->id, 6, '0', STR_PAD_LEFT),
            'active_until' => $request->expires_at,
            'doctor_type' => $request->access_type === 'visiting' ? 'Visiting' : 'Resident',
        ]);
        foreach ($request->availability_days ?: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as $day) {
            $doctor->availability()->create([
                'day_of_week' => $day,
                'start_time' => $request->start_time ?: '08:00',
                'end_time' => $request->end_time ?: '17:00',
            ]);
        }
        AuditLog::create(['user_id' => $request->user()->id, 'action' => "Created Doctor $user->email", 'description' => "Admin created a new doctor account.", 'ip_address' => $request->ip()]);
        return response()->json(['message' => 'Doctor created', 'user' => $user]);
    }
    public function createStaff(Request $request) {
        $request->validate([
            'name' => 'required',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:8',
            'department' => 'required',
        ]);
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'Staff',
            'first_login' => true,
            'is_active' => true,
            'email_verified_at' => now(),
        ]);
        Staff::create(['user_id' => $user->id, 'department' => $request->department]);
        AuditLog::create(['user_id' => $request->user()->id, 'action' => "Created Staff $user->email", 'description' => "Admin created a new staff account.", 'ip_address' => $request->ip()]);
        return response()->json(['message' => 'Staff created', 'user' => $user]);
    }

    public function deactivateUser(Request $request, User $user) {
        if ((int) $request->user()->id === (int) $user->id) {
            return response()->json(['message' => 'You cannot archive your own account.'], 422);
        }

        if ($user->email === 'admin@cabuyao.gov.ph') {
            return response()->json(['message' => 'The default system admin account cannot be archived.'], 422);
        }

        if ($user->role === 'Admin' && User::where('role', 'Admin')->where('is_active', true)->count() <= 1) {
            return response()->json(['message' => 'At least one active admin account is required.'], 422);
        }

        $user->update(['is_active' => false]);
        if ($user->patient) {
            $user->patient->update(['archived' => true]);
        }

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => "Archived User $user->email",
            'description' => "Admin archived the user account.",
            'ip_address' => $request->ip(),
        ]);

        return response()->json(['message' => 'Account archived', 'user' => $user->load(['doctor', 'staff', 'patient'])]);
    }

    public function reactivateUser(Request $request, User $user) {
        $user->update(['is_active' => true]);
        if ($user->patient) {
            $user->patient->update(['archived' => false]);
        }

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => "Reactivated User $user->email",
            'description' => "Admin reactivated the user account.",
            'ip_address' => $request->ip(),
        ]);

        return response()->json(['message' => 'Account reactivated', 'user' => $user->load(['doctor', 'staff', 'patient'])]);
    }
}
