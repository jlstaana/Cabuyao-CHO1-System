<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Medicine extends Model {
    protected $fillable = [
        'name',
        'generic_name',
        'category',
        'dosage_form',
        'description',
        'status',
    ];

    protected $appends = ['total_stock'];

    public function batches()
    {
        return $this->hasMany(MedicineBatch::class);
    }

    public function getTotalStockAttribute()
    {
        return $this->batches()->sum('stock');
    }
    
    protected $casts = ['status' => 'boolean'];
}
