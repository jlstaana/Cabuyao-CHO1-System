<?php
namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $query = AuditLog::with('user:id,name,role')->latest();

        $path = storage_path('app/logging_config.json');
        $config = [];
        if (file_exists($path)) {
            $config = json_decode(file_get_contents($path), true) ?: [];
        }

        foreach (['system', 'software', 'security', 'hardware'] as $cat) {
            if (isset($config[$cat]) && !$config[$cat]) {
                $query->where(function ($q) use ($cat) {
                    if ($cat === 'system') {
                        $q->where('action', 'NOT LIKE', '%system%')
                          ->where('action', 'NOT LIKE', '%startup%')
                          ->where('action', 'NOT LIKE', '%reboot%')
                          ->where('action', 'NOT LIKE', '%shutdown%');
                    } elseif ($cat === 'software') {
                        $q->where('action', 'NOT LIKE', '%app%')
                          ->where('action', 'NOT LIKE', '%software%')
                          ->where('action', 'NOT LIKE', '%update%')
                          ->where('action', 'NOT LIKE', '%crash%')
                          ->where('action', 'NOT LIKE', '%service%');
                    } elseif ($cat === 'security') {
                        $q->where('action', 'NOT LIKE', '%security%')
                          ->where('action', 'NOT LIKE', '%firewall%')
                          ->where('action', 'NOT LIKE', '%permission%');
                    } elseif ($cat === 'hardware') {
                        $q->where('action', 'NOT LIKE', '%hardware%')
                          ->where('action', 'NOT LIKE', '%disk%')
                          ->where('action', 'NOT LIKE', '%cpu%')
                          ->where('action', 'NOT LIKE', '%connection%');
                    }
                });
            }
        }

        if ($request->filled('search')) {
            $q = $request->search;
            $query->where(function ($sub) use ($q) {
                $sub->where('action', 'LIKE', "%{$q}%")
                    ->orWhere('description', 'LIKE', "%{$q}%")
                    ->orWhere('ip_address', 'LIKE', "%{$q}%")
                    ->orWhereHas('user', fn($u) => $u->where('name', 'LIKE', "%{$q}%"));
            });
        }

        if ($request->filled('role')) {
            $query->whereHas('user', fn($u) => $u->where('role', $request->role));
        }

        if ($request->filled('category')) {
            $cat = $request->category;
            $query->where(function ($sub) use ($cat) {
                if ($cat === 'auth') {
                    $sub->where('action', 'LIKE', '%login%')
                        ->orWhere('action', 'LIKE', '%logout%')
                        ->orWhere('action', 'LIKE', '%password%')
                        ->orWhere('action', 'LIKE', '%unauthorized%');
                } elseif ($cat === 'system') {
                    $sub->where('action', 'LIKE', '%system%')
                        ->orWhere('action', 'LIKE', '%startup%')
                        ->orWhere('action', 'LIKE', '%reboot%')
                        ->orWhere('action', 'LIKE', '%shutdown%');
                } elseif ($cat === 'software') {
                    $sub->where('action', 'LIKE', '%app%')
                        ->orWhere('action', 'LIKE', '%software%')
                        ->orWhere('action', 'LIKE', '%update%')
                        ->orWhere('action', 'LIKE', '%crash%')
                        ->orWhere('action', 'LIKE', '%service%');
                } elseif ($cat === 'security') {
                    $sub->where('action', 'LIKE', '%security%')
                        ->orWhere('action', 'LIKE', '%firewall%')
                        ->orWhere('action', 'LIKE', '%permission%');
                } elseif ($cat === 'hardware') {
                    $sub->where('action', 'LIKE', '%hardware%')
                        ->orWhere('action', 'LIKE', '%disk%')
                        ->orWhere('action', 'LIKE', '%cpu%')
                        ->orWhere('action', 'LIKE', '%connection%');
                }
            });
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $logs = $query->paginate(25)->through(function ($log) {
            return [
                'id'          => $log->id,
                'action'      => $log->action,
                'description' => $log->description,
                'ip_address'  => $log->ip_address,
                'user'        => $log->user?->name,
                'role'        => $log->user?->role,
                'created_at'  => $log->created_at,
            ];
        });

        return response()->json($logs);
    }

    public function getLoggingConfig(Request $request)
    {
        $path = storage_path('app/logging_config.json');
        if (!file_exists($path)) {
            $default = [
                'system' => true,
                'software' => true,
                'security' => true,
                'hardware' => true,
            ];
            if (!is_dir(dirname($path))) {
                mkdir(dirname($path), 0755, true);
            }
            file_put_contents($path, json_encode($default, JSON_PRETTY_PRINT));
            return response()->json($default);
        }
        $config = json_decode(file_get_contents($path), true);
        return response()->json($config ?: [
            'system' => true,
            'software' => true,
            'security' => true,
            'hardware' => true,
        ]);
    }

    public function updateLoggingConfig(Request $request)
    {
        $path = storage_path('app/logging_config.json');
        $config = [
            'system' => (bool)$request->input('system', true),
            'software' => (bool)$request->input('software', true),
            'security' => (bool)$request->input('security', true),
            'hardware' => (bool)$request->input('hardware', true),
        ];
        if (!is_dir(dirname($path))) {
            mkdir(dirname($path), 0755, true);
        }
        file_put_contents($path, json_encode($config, JSON_PRETTY_PRINT));
        return response()->json($config);
    }
}
