<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Prescription extends Model {
    protected $fillable = ['consultation_id', 'patient_id', 'doctor_id', 'notes'];
    public function items() { return $this->hasMany(PrescriptionItem::class); }
    public function consultation() { return $this->belongsTo(Consultation::class); }
}
