<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Medicine extends Model {
    protected $fillable = ['name', 'category', 'dosage_form', 'unit', 'stock_quantity', 'description', 'status'];
    protected $casts = ['status' => 'boolean'];
}
