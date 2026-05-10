<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class MedicalImage extends Model {
    protected $fillable = ['consultation_id', 'patient_id', 'file_path', 'original_name', 'file_type', 'mime_type', 'document_type', 'notes', 'file_size'];
    public function consultation() { return $this->belongsTo(Consultation::class); }
}
