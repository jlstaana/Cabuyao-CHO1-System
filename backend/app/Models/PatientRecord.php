<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class PatientRecord extends Model {
    protected $fillable = ['patient_id', 'medical_history'];
    public function patient() { return $this->belongsTo(Patient::class); }
}
