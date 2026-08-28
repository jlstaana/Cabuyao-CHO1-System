<?php
namespace App\Http\Controllers;
use App\Models\User;
use App\Models\Patient;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller {


    private function createVerificationCode(User $user): string {
        $code = (string) random_int(100000, 999999);
        $user->update([
            'email_verification_code_hash' => Hash::make($code),
            'email_verification_code_expires_at' => now()->addMinutes(15),
        ]);
        return $code;
    }

    private function sendVerificationCode(User $user, string $code): void {
        try {
            Mail::send('emails.auth-code', [
                'title' => 'Verify your email',
                'subtitle' => 'Use the verification code below to complete your Cabuyao CHO1 account registration.',
                'code' => $code
            ], function ($message) use ($user) {
                $message->to($user->email)->subject('Cabuyao CHO1 Account Verification');
            });
        } catch (\Throwable $e) {
            Log::warning('Unable to send verification email.', [
                'user_id' => $user->id,
                'email' => $user->email,
                'error' => $e->getMessage(),
            ]);
            if (config('app.debug')) {
                throw $e;
            }
        }
    }

    private function sendPasswordResetCode(User $user, string $code): void {
        try {
            Mail::send('emails.auth-code', [
                'title' => 'Reset your password',
                'subtitle' => 'We received a request to reset your password. Enter the code below to continue.',
                'code' => $code
            ], function ($message) use ($user) {
                $message->to($user->email)->subject('Cabuyao CHO1 Password Reset');
            });
        } catch (\Throwable $e) {
            Log::warning('Unable to send password reset email.', [
                'user_id' => $user->id,
                'email' => $user->email,
                'error' => $e->getMessage(),
            ]);
            if (config('app.debug')) {
                throw $e;
            }
        }
    }

    public function register(Request $request) {
        $request->merge(['email' => strtolower(trim((string) $request->email))]);
        $request->validate([
            'name' => 'required|string',
            'email' => 'required|email',
            'password' => 'required|min:8',
            'dob' => 'required|date',
            'contact_no' => 'required|string',
            'gender' => 'required|string|in:Male,Female',
            'category' => 'nullable|string|max:255'
        ]);
        $existingUser = User::where('email', $request->email)->first();
        if ($existingUser) {
            if ($existingUser->role === 'Patient' && !$existingUser->is_active && is_null($existingUser->email_verified_at)) {
                $code = $this->createVerificationCode($existingUser);
                $this->sendVerificationCode($existingUser, $code);
                return response()->json([
                    'message' => 'This email already has a pending registration. A new verification code was sent.',
                    'email' => $existingUser->email,
                ], 202);
            }
            if (!$existingUser->is_active && !is_null($existingUser->email_verified_at)) {
                throw ValidationException::withMessages(['email' => ['This account has been deactivated by an administrator. Please contact support.']]);
            }
            throw ValidationException::withMessages(['email' => ['Email is already registered.']]);
        }
        $user = User::create(['name' => $request->name, 'email' => $request->email, 'password' => Hash::make($request->password), 'role' => 'Patient', 'first_login' => true, 'is_active' => false]);
        Patient::create([
            'user_id' => $user->id,
            'dob' => $request->dob,
            'contact_no' => $request->contact_no,
            'address' => $request->address ?? '',
            'category' => $request->category,
            'gender' => $request->gender
        ]);
        $code = $this->createVerificationCode($user);
        $this->sendVerificationCode($user, $code);
        AuditLog::create(['user_id' => $user->id, 'action' => 'Register', 'description' => 'User registered a new patient account.', 'ip_address' => $request->ip()]);
        return response()->json([
            'message' => 'Registration submitted. Please enter the verification code sent to your email.',
            'email' => $user->email,
        ], 201);
    }
    public function verifyRegistration(Request $request) {
        $request->merge(['email' => strtolower(trim((string) $request->email))]);
        $request->validate(['email' => 'required|email', 'code' => 'required|string|size:6']);
        $user = User::where('email', $request->email)->where('role', 'Patient')->first();
        if (!$user) {
            throw ValidationException::withMessages(['email' => ['No pending patient account found.']]);
        }
        if ($user->is_active && $user->email_verified_at) {
            throw ValidationException::withMessages(['email' => ['Account is already verified. Please log in.']]);
        }
        if (!$user->email_verification_code_hash || !$user->email_verification_code_expires_at || now()->greaterThan($user->email_verification_code_expires_at)) {
            throw ValidationException::withMessages(['code' => ['Verification code has expired. Please request a new code.']]);
        }
        if (!Hash::check($request->code, $user->email_verification_code_hash)) {
            throw ValidationException::withMessages(['code' => ['Invalid verification code. Your account remains pending.']]);
        }
        $user->update([
            'is_active' => true,
            'email_verified_at' => now(),
            'email_verification_code_hash' => null,
            'email_verification_code_expires_at' => null,
        ]);
        AuditLog::create(['user_id' => $user->id, 'action' => 'Verify Registration', 'description' => 'User verified their email address.', 'ip_address' => $request->ip()]);
        return response()->json(['message' => 'Account verified successfully. You can now log in.']);
    }
    public function resendVerificationCode(Request $request) {
        $request->merge(['email' => strtolower(trim((string) $request->email))]);
        $request->validate(['email' => 'required|email']);
        $user = User::where('email', $request->email)->where('role', 'Patient')->first();
        if (!$user) {
            throw ValidationException::withMessages(['email' => ['No pending patient account found.']]);
        }
        if ($user->is_active && $user->email_verified_at) {
            throw ValidationException::withMessages(['email' => ['Account is already verified. Please log in.']]);
        }
        $code = $this->createVerificationCode($user);
        $this->sendVerificationCode($user, $code);
        return response()->json([
            'message' => 'A new verification code was sent.',
        ]);
    }
    public function login(Request $request) {
        $request->merge(['email' => strtolower(trim((string) $request->email))]);
        $request->validate(['email' => 'required|email', 'password' => 'required']);
        $user = User::where('email', $request->email)->first();
        if (!$user || !Hash::check($request->password, $user->password) || !$user->is_active) {
            throw ValidationException::withMessages(['email' => ['Invalid credentials or inactive account.']]);
        }
        AuditLog::create(['user_id' => $user->id, 'action' => 'Login', 'description' => 'User logged into the system.', 'ip_address' => $request->ip()]);
        return response()->json(['token' => $user->createToken('auth')->plainTextToken, 'user' => $user->load('doctor', 'patient')]);
    }
    public function forgotPassword(Request $request) {
        $request->validate(['email' => 'required|email']);
        $user = User::where('email', $request->email)->first();
        if (!$user || !$user->is_active) {
            throw ValidationException::withMessages(['email' => ['No active account found for this email.']]);
        }
        $code = (string) random_int(100000, 999999);
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $user->email],
            ['token' => Hash::make($code), 'created_at' => now()]
        );
        $this->sendPasswordResetCode($user, $code);
        return response()->json([
            'message' => 'Password reset code sent.',
        ]);
    }
    public function resetPassword(Request $request) {
        $request->validate([
            'email' => 'required|email',
            'code' => 'required|string|size:6',
            'password' => 'required|min:8|confirmed',
        ]);
        $reset = DB::table('password_reset_tokens')->where('email', $request->email)->first();
        if (!$reset || now()->diffInMinutes($reset->created_at) > 15 || !Hash::check($request->code, $reset->token)) {
            throw ValidationException::withMessages(['code' => ['Invalid or expired password reset code.']]);
        }
        $user = User::where('email', $request->email)->first();
        if (!$user || !$user->is_active) {
            throw ValidationException::withMessages(['email' => ['No active account found for this email.']]);
        }
        $user->update(['password' => Hash::make($request->password), 'first_login' => false]);
        DB::table('password_reset_tokens')->where('email', $request->email)->delete();
        AuditLog::create(['user_id' => $user->id, 'action' => 'Reset Password', 'description' => 'User reset their password using an email code.', 'ip_address' => $request->ip()]);
        return response()->json(['message' => 'Password reset successfully. You can now log in.']);
    }
    public function logout(Request $request) {
        $request->user()->currentAccessToken()->delete();
        AuditLog::create(['user_id' => $request->user()->id, 'action' => 'Logout', 'description' => 'User logged out of the system.', 'ip_address' => $request->ip()]);
        return response()->json(['message' => 'Logged out']);
    }
    public function changePassword(Request $request) {
        $request->validate(['old_password' => 'required', 'new_password' => 'required|min:8|different:old_password']);
        $user = $request->user();
        if (!Hash::check($request->old_password, $user->password)) return response()->json(['message' => 'Invalid old password'], 400);
        $user->update(['password' => Hash::make($request->new_password), 'first_login' => false]);
        AuditLog::create(['user_id' => $user->id, 'action' => 'Change Password', 'description' => 'User changed their account password.', 'ip_address' => $request->ip()]);
        return response()->json(['message' => 'Password changed successfully']);
    }

    public function completeOnboarding(Request $request) {
        $user = $request->user();
        $user->update(['first_login' => false]);
        AuditLog::create(['user_id' => $user->id, 'action' => 'Complete Onboarding Tutorial', 'description' => 'User completed the initial onboarding tutorial.', 'ip_address' => $request->ip()]);
        return response()->json(['message' => 'Onboarding completed', 'user' => $user->fresh()]);
    }

    public function updateProfilePicture(Request $request) {
        $request->validate([
            'profile_picture' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120',
        ]);

        $user = $request->user();
        
        if ($request->hasFile('profile_picture')) {
            $path = $request->file('profile_picture')->store('profiles', 'public');
            $user->update(['profile_picture' => $path]);
            AuditLog::create(['user_id' => $user->id, 'action' => 'Update Profile Picture', 'description' => 'User uploaded a new profile picture.', 'ip_address' => $request->ip()]);
        }

        return response()->json([
            'message' => 'Profile picture updated successfully',
            'user' => $user->fresh()
        ]);
    }
}
