const fs = require('fs');
let file = fs.readFileSync('frontend/src/pages/dashboard/Consultations.jsx', 'utf8');
const replaces = JSON.parse(fs.readFileSync('replaces.json', 'utf8'));

let successCount = 0;
for (const r of replaces) {
    const target = r.args.TargetContent;
    const replacement = r.args.ReplacementContent;
    if (file.includes(target)) {
        file = file.replace(target, replacement);
        successCount++;
    } else {
        console.log("Failed to apply patch:", r.args.Instruction);
        // Try to apply it by just replacing without strict exact match if it was slight?
        // Actually, replace_file_content often has minor leading whitespace issues, let's just exact match first.
    }
}
fs.writeFileSync('frontend/src/pages/dashboard/Consultations.jsx', file);
console.log('Successfully applied', successCount, 'out of', replaces.length, 'patches.');
