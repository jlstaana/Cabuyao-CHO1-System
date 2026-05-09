<?php
namespace App\Http\Controllers;
use App\Models\{User, Doctor, Staff};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminController extends Controller {
    public function createDoctor(Request $request) {
        $request->validate(['name' => 'required', 'email' => 'required|email|unique:users', 'specialization' => 'required', 'license_no' => 'required|unique:doctors']);
        $password = Str::random(8);
        $user = User::create(['name' => $request->name, 'email' => $request->email, 'password' => Hash::make($password), 'role' => 'Doctor']);
        Doctor::create(['user_id' => $user->id, 'specialization' => $request->specialization, 'license_no' => $request->license_no, 'active_until' => $request->active_until]);
        return response()->json(['message' => 'Doctor created', 'temp_password' => $password, 'user' => $user]);
    }
    public function createStaff(Request $request) {
        $request->validate(['name' => 'required', 'email' => 'required|email|unique:users', 'department' => 'required']);
        $password = Str::random(8);
        $user = User::create(['name' => $request->name, 'email' => $request->email, 'password' => Hash::make($password), 'role' => 'Staff']);
        Staff::create(['user_id' => $user->id, 'department' => $request->department]);
        return response()->json(['message' => 'Staff created', 'temp_password' => $password, 'user' => $user]);
    }
}
