<?php
namespace App\Http\Controllers;
use App\Models\User;
use App\Models\Patient;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller {
    public function register(Request $request) {
        $request->validate(['name' => 'required', 'email' => 'required|email|unique:users', 'password' => 'required|min:8', 'dob' => 'required|date', 'contact_no' => 'required']);
        $user = User::create(['name' => $request->name, 'email' => $request->email, 'password' => Hash::make($request->password), 'role' => 'Patient', 'first_login' => false]);
        Patient::create(['user_id' => $user->id, 'dob' => $request->dob, 'contact_no' => $request->contact_no, 'address' => $request->address ?? '']);
        AuditLog::create(['user_id' => $user->id, 'action' => 'Register', 'ip_address' => $request->ip()]);
        return response()->json(['token' => $user->createToken('auth')->plainTextToken, 'user' => $user]);
    }
    public function login(Request $request) {
        $request->validate(['email' => 'required|email', 'password' => 'required']);
        $user = User::where('email', $request->email)->first();
        if (!$user || !Hash::check($request->password, $user->password) || !$user->is_active) {
            throw ValidationException::withMessages(['email' => ['Invalid credentials or inactive account.']]);
        }
        AuditLog::create(['user_id' => $user->id, 'action' => 'Login', 'ip_address' => $request->ip()]);
        return response()->json(['token' => $user->createToken('auth')->plainTextToken, 'user' => $user]);
    }
    public function logout(Request $request) {
        $request->user()->currentAccessToken()->delete();
        AuditLog::create(['user_id' => $request->user()->id, 'action' => 'Logout', 'ip_address' => $request->ip()]);
        return response()->json(['message' => 'Logged out']);
    }
    public function changePassword(Request $request) {
        $request->validate(['old_password' => 'required', 'new_password' => 'required|min:8|different:old_password']);
        $user = $request->user();
        if (!Hash::check($request->old_password, $user->password)) return response()->json(['message' => 'Invalid old password'], 400);
        $user->update(['password' => Hash::make($request->new_password), 'first_login' => false]);
        AuditLog::create(['user_id' => $user->id, 'action' => 'Change Password', 'ip_address' => $request->ip()]);
        return response()->json(['message' => 'Password changed successfully']);
    }
}
