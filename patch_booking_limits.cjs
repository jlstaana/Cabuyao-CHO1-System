const fs = require('fs');
let file = fs.readFileSync('backend/app/Http/Controllers/ConsultationController.php', 'utf-8');

const validationRegex = /\$data = \$request->validate\(\[[\s\S]*?\]\);/;

const limitsCode = `
        $patientId = $request->user()->patient->id;

        // 1. Penalty System: Check for 3 or more missed appointments this month
        $missedCount = Consultation::where('patient_id', $patientId)
            ->where('status', 'Missed')
            ->where('created_at', '>=', now()->startOfMonth())
            ->count();
            
        if ($missedCount >= 3) {
            return response()->json(['message' => 'Your account is temporarily restricted from booking online due to 3 or more missed appointments this month. Please contact the CHO.'], 403);
        }

        // 2. Booking Limits: Check for active/pending requests
        $activeCount = Consultation::where('patient_id', $patientId)
            ->whereIn('status', ['Pending', 'Scheduled'])
            ->count();
            
        if ($activeCount >= 2) {
            return response()->json(['message' => 'You cannot have more than 2 active or pending consultation requests at the same time.'], 403);
        }
`;

if (file.match(validationRegex) && !file.includes('Penalty System: Check for 3 or more missed')) {
    file = file.replace(validationRegex, `$&` + '\n' + limitsCode);
    fs.writeFileSync('backend/app/Http/Controllers/ConsultationController.php', file);
    console.log('Added booking limits and penalties');
} else {
    console.log('Could not find validation block or already applied.');
}
