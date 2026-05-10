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
        $request->validate(['name' => 'required', 'email' => 'required|email|unique:users', 'specialization' => 'required']);
        $user = User::create(['name' => $request->name, 'email' => $request->email, 'password' => Hash::make('password123'), 'role' => 'Doctor', 'first_login' => true]);
        Doctor::create(['user_id' => $user->id, 'specialization' => $request->specialization, 'license_no' => $request->license_no ?? '']);
        AuditLog::create(['user_id' => $request->user()->id, 'action' => "Created Doctor $user->email", 'ip_address' => $request->ip()]);
        return response()->json(['message' => 'Doctor created', 'user' => $user]);
    }
    public function createStaff(Request $request) {
        $request->validate(['name' => 'required', 'email' => 'required|email|unique:users', 'department' => 'required']);
        $user = User::create(['name' => $request->name, 'email' => $request->email, 'password' => Hash::make('password123'), 'role' => 'Staff', 'first_login' => true]);
        Staff::create(['user_id' => $user->id, 'department' => $request->department]);
        AuditLog::create(['user_id' => $request->user()->id, 'action' => "Created Staff $user->email", 'ip_address' => $request->ip()]);
        return response()->json(['message' => 'Staff created', 'user' => $user]);
    }
}
