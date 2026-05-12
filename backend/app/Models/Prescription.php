<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Prescription extends Model {
    protected $fillable = ['consultation_id', 'patient_id', 'doctor_id', 'notes', 'doctor_signature_svg'];
    public function items() { return $this->hasMany(PrescriptionItem::class); }
    public function versions() { return $this->hasMany(PrescriptionVersion::class); }
    public function consultation() { return $this->belongsTo(Consultation::class); }
    public function patient() { return $this->belongsTo(Patient::class); }
    public function doctor() { return $this->belongsTo(Doctor::class); }
}
