<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Patient extends Model {
    protected $fillable = ['user_id', 'dob', 'address', 'contact_no', 'archived', 'category', 'gender'];
    protected $casts = ['archived' => 'boolean', 'dob' => 'date'];
    public function user() { return $this->belongsTo(User::class); }
    public function record() { return $this->hasOne(PatientRecord::class); }
    public function recordVersions() { return $this->hasMany(PatientRecordVersion::class); }
    public function consultations() { return $this->hasMany(Consultation::class); }
    public function prescriptions() { return $this->hasMany(Prescription::class); }
    public function medicalImages() { return $this->hasMany(MedicalImage::class); }
}
