<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class ConsultationForm extends Model {
    protected $fillable = ['consultation_id', 'symptoms', 'diagnosis', 'notes'];
    public function consultation() { return $this->belongsTo(Consultation::class); }
}
