<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Doctor extends Model {
    protected $fillable = ['user_id', 'specialization', 'license_no', 'active_until', 'doctor_type', 'ptr_no'];
    protected $casts = ['active_until' => 'datetime'];
    public function user() { return $this->belongsTo(User::class); }
    public function availability() { return $this->hasMany(DoctorAvailability::class); }
    public function exceptions() { return $this->hasMany(DoctorScheduleException::class); }
    public function consultations() { return $this->hasMany(Consultation::class); }
}
