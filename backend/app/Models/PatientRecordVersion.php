<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class PatientRecordVersion extends Model {
    protected $fillable = ['patient_id', 'snapshot', 'updated_by'];
    protected $casts = ['snapshot' => 'array'];
    public function patient() { return $this->belongsTo(Patient::class); }
    public function updater() { return $this->belongsTo(User::class, 'updated_by'); }
}
