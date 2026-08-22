const fs = require('fs');
let file = fs.readFileSync('backend/routes/console.php', 'utf-8');

file = file.replace(/use IlluminateSupportFacadesSchedule;/g, 'use Illuminate\\Support\\Facades\\Schedule;');
file = file.replace(/use AppModelsConsultation;/g, 'use App\\Models\\Consultation;');

fs.writeFileSync('backend/routes/console.php', file);
console.log('Fixed console.php syntax error');
