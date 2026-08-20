const fs = require('fs');
let file = fs.readFileSync('backend/app/Http/Controllers/ConsultationController.php', 'utf-8');

const regex = /public function index\(Request \$request\) \{[\s\S]*?\$query->whereHas\('patient', fn \(\$patientQuery\) => \$patientQuery->where\('archived', false\)\);/;

const hideClutter = `
        // Hide cluttered/old consultations from the main dashboard queue
        if (!$request->has('show_all')) {
            $query->whereIn('status', ['Pending', 'Scheduled']);
        }
`;

if (file.match(regex) && !file.includes('Hide cluttered/old consultations')) {
    file = file.replace(regex, `$&` + '\n' + hideClutter);
    fs.writeFileSync('backend/app/Http/Controllers/ConsultationController.php', file);
    console.log('Added UI Clutter filter');
} else {
    console.log('Failed or already applied');
}
