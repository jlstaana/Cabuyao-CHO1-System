const fs = require('fs');
let file = fs.readFileSync('backend/routes/console.php', 'utf-8');

const scheduleCode = `
use Illuminate\Support\Facades\Schedule;
use App\Models\Consultation;

// Auto-Cancel missed consultations (Scheduled but past 2 hours)
Schedule::call(function () {
    Consultation::where('status', 'Scheduled')
        ->where('scheduled_at', '<', now()->subHours(2))
        ->update(['status' => 'Missed']);
})->hourly();
`;

if (!file.includes('Auto-Cancel missed')) {
    file += '\n' + scheduleCode;
    fs.writeFileSync('backend/routes/console.php', file);
    console.log('Added auto-cancel to console.php');
}
