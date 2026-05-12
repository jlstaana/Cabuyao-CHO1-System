<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class VitalSign extends Model {
    protected $fillable = ['consultation_id', 'height', 'weight', 'blood_pressure', 'heart_rate', 'temperature', 'respiratory', 'oxygen'];
    public function consultation() { return $this->belongsTo(Consultation::class); }
}
