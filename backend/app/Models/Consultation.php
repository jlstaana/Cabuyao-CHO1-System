<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Consultation extends Model {
    protected $fillable = ['patient_id', 'doctor_id', 'requested_specialization', 'status', 'scheduled_at'];
    protected $casts = ['scheduled_at' => 'datetime'];
    public function patient() { return $this->belongsTo(Patient::class); }
    public function doctor() { return $this->belongsTo(Doctor::class); }
    public function form() { return $this->hasOne(ConsultationForm::class); }
    public function vitalSigns() { return $this->hasOne(VitalSign::class); }
    public function medicalImages() { return $this->hasMany(MedicalImage::class); }
    public function prescription() { return $this->hasOne(Prescription::class); }
}
