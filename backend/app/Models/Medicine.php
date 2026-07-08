<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Medicine extends Model {
    protected $fillable = ['name', 'generic_name', 'category', 'dosage_form', 'description', 'status', 'stock', 'expiration_date'];
    protected $casts = ['status' => 'boolean'];
}
