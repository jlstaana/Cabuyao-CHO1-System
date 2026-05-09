<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable {
    use HasApiTokens, HasFactory, Notifiable;
    protected $fillable = ['name', 'email', 'password', 'role', 'first_login', 'is_active'];
    protected $hidden = ['password', 'remember_token'];
    protected function casts(): array { return ['email_verified_at' => 'datetime', 'password' => 'hashed', 'first_login' => 'boolean', 'is_active' => 'boolean']; }
    public function patient() { return $this->hasOne(Patient::class); }
    public function doctor() { return $this->hasOne(Doctor::class); }
    public function staff() { return $this->hasOne(Staff::class); }
}
