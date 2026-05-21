<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class VitalSign extends Model {
    protected $fillable = ['patient_id', 'consultation_id', 'height', 'weight', 'blood_pressure', 'heart_rate', 'temperature', 'respiratory', 'oxygen'];
    public function consultation() { return $this->belongsTo(Consultation::class); }
    public function patient() { return $this->belongsTo(Patient::class); }
}
