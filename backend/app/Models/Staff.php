<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Staff extends Model {
    protected $fillable = ['user_id', 'department'];
    public function user() { return $this->belongsTo(User::class); }
}
