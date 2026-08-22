const fs = require('fs');
let file = fs.readFileSync('backend/routes/console.php', 'utf-8');

file = file.replace(/use Illuminate\\Support\\Facades\\Schedule;\s*/g, '');
file = file.replace(/use App\\Models\\Consultation;\s*/g, '');
file = file.replace(/Consultation::where/g, '\\App\\Models\\Consultation::where');

fs.writeFileSync('backend/routes/console.php', file);
console.log('Fixed console.php syntax error again');
