<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class PrescriptionVersion extends Model {
    protected $fillable = ['prescription_id', 'version', 'snapshot', 'updated_by'];
    protected $casts = ['snapshot' => 'array'];
    public function prescription() { return $this->belongsTo(Prescription::class); }
    public function updater() { return $this->belongsTo(User::class, 'updated_by'); }
}
