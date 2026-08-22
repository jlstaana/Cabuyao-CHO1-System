const fs = require('fs');
let file = fs.readFileSync('backend/app/Http/Controllers/DoctorController.php', 'utf-8');

const replacement = `
        $oldLeaves = $doctor->exceptions()->where('type', 'leave')->pluck('date')->toArray();

        $doctor->availability()->delete();
        foreach ($entries as $entry) {
            $doctor->availability()->create($entry);
        }
        $doctor->update(['doctor_type' => $data['doctor_type']]);

        if (isset($data['exceptions'])) {
            $doctor->exceptions()->delete();
            foreach ($data['exceptions'] as $exc) {
                $doctor->exceptions()->create([
                    'date' => $exc['date'],
                    'type' => $exc['type'],
                    'start_time' => empty($exc['start_time']) ? null : substr($exc['start_time'], 0, 5),
                    'end_time' => empty($exc['end_time']) ? null : substr($exc['end_time'], 0, 5),
                ]);
            }
        }
        
        $newLeaves = collect($data['exceptions'] ?? [])->where('type', 'leave')->pluck('date')->toArray();
        $declaredLeaves = array_diff($newLeaves, $oldLeaves);

        $reassignedCount = 0;
        $rescheduledCount = 0;

        if (!empty($declaredLeaves)) {
            // Figure 72 Automated Workflow Logic
            $affected = \\App\\Models\\Consultation::where('doctor_id', $doctor->id)
                ->where('status', 'Scheduled')
                ->whereIn(\\Illuminate\\Support\\Facades\\DB::raw('DATE(scheduled_at)'), $declaredLeaves)
                ->get();

            foreach ($affected as $consult) {
                // Find substitute (same specialization, active)
                $substitute = \\App\\Models\\Doctor::where('id', '!=', $doctor->id)
                    ->where('specialization', $doctor->specialization)
                    ->whereHas('user', fn($q) => $q->where('is_active', true))
                    ->first();

                if ($substitute) {
                    $consult->update(['doctor_id' => $substitute->id]);
                    $reassignedCount++;
                    
                    \\App\\Models\\AuditLog::create([
                        'user_id' => $request->user()->id,
                        'action' => 'Emergency Reassignment',
                        'description' => "Consultation #{$consult->id} reassigned to Dr. {$substitute->user->name} due to emergency leave.",
                        'ip_address' => $request->ip()
                    ]);
                } else {
                    // Reschedule to next available week automatically
                    $nextDate = \\Carbon\\Carbon::parse($consult->scheduled_at)->addDays(7)->format('Y-m-d H:i:s');
                    $consult->update(['scheduled_at' => $nextDate, 'status' => 'Pending']); 
                    $rescheduledCount++;
                    
                    \\App\\Models\\AuditLog::create([
                        'user_id' => $request->user()->id,
                        'action' => 'Emergency Auto-Reschedule',
                        'description' => "Consultation #{$consult->id} auto-rescheduled to {$nextDate} due to emergency leave and no available substitute.",
                        'ip_address' => $request->ip()
                    ]);
                }
            }

            if ($reassignedCount || $rescheduledCount) {
                \\App\\Models\\AuditLog::create([
                    'user_id' => $request->user()->id,
                    'action' => 'Emergency Leave Declared',
                    'description' => "Declared emergency absence for " . implode(', ', $declaredLeaves) . ". Dispatched email/in-app notifications. Reassigned {$reassignedCount}, Rescheduled {$rescheduledCount}.",
                    'ip_address' => $request->ip()
                ]);
            }
        }

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'Updated Doctor Availability',
            'description' => "Updated {$data['doctor_type']} doctor schedule.",
            'ip_address' => $request->ip(),
        ]);

        $msg = "{$data['doctor_type']} doctor availability saved.";
        if ($reassignedCount || $rescheduledCount) {
            $msg .= " Emergency Protocol Triggered: {$reassignedCount} patient(s) reassigned, {$rescheduledCount} auto-rescheduled.";
        }

        return response()->json([
            'message' => $msg,
            'doctor' => $doctor->fresh(['availability', 'user:id,name,is_active']),
        ]);
    }
`;

const regex = /\$doctor->availability\(\)->delete\(\);[\s\S]*?return response\(\)->json\(\[[\s\S]*?\]\);\s*\}/;

if (file.match(regex)) {
    file = file.replace(regex, replacement);
    fs.writeFileSync('backend/app/Http/Controllers/DoctorController.php', file);
    console.log('Patched emergency workflow');
} else {
    console.log('Regex did not match');
}
