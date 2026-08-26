<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model {
    protected $fillable = ['user_id', 'action', 'description', 'ip_address'];
    public function user() { return $this->belongsTo(User::class); }

    public static function getCategoryForAction($action)
    {
        $key = strtolower($action);
        if (str_contains($key, 'login') || str_contains($key, 'logout') || str_contains($key, 'password') || str_contains($key, 'unauthorized')) {
            return 'auth';
        }
        if (str_contains($key, 'system') || str_contains($key, 'startup') || str_contains($key, 'reboot') || str_contains($key, 'shutdown')) {
            return 'system';
        }
        if (str_contains($key, 'app') || str_contains($key, 'software') || str_contains($key, 'update') || str_contains($key, 'crash') || str_contains($key, 'service')) {
            return 'software';
        }
        if (str_contains($key, 'security') || str_contains($key, 'firewall') || str_contains($key, 'permission')) {
            return 'security';
        }
        if (str_contains($key, 'hardware') || str_contains($key, 'disk') || str_contains($key, 'cpu') || str_contains($key, 'connection')) {
            return 'hardware';
        }
        return 'other';
    }

    protected static function booted()
    {
        static::creating(function ($auditLog) {
            $category = static::getCategoryForAction($auditLog->action);
            if ($category === 'other' || $category === 'auth') {
                return true;
            }

            $path = storage_path('app/logging_config.json');
            if (file_exists($path)) {
                $config = json_decode(file_get_contents($path), true);
                if (isset($config[$category]) && !$config[$category]) {
                    return false;
                }
            }
            return true;
        });
    }
}
