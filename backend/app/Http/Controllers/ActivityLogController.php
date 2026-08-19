<?php
namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $query = AuditLog::with('user:id,name,role')->latest();

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
}
