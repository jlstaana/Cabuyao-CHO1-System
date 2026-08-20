const fs = require('fs');
let file = fs.readFileSync('frontend/src/pages/dashboard/Consultations.jsx', 'utf8');
const replaces = JSON.parse(fs.readFileSync('replaces.json', 'utf8'));

let successCount = 0;
for (const r of replaces) {
    const target = r.args.TargetContent.replace(/\r\n/g, '\n');
    const replacement = r.args.ReplacementContent.replace(/\r\n/g, '\n');
    
    // Normalize file endings for matching
    let nFile = file.replace(/\r\n/g, '\n');
    
    if (nFile.includes(target)) {
        // Need to replace in the original file while keeping endings?
        // Or just keep the file normalized to \n.
        file = nFile.replace(target, replacement);
        successCount++;
    } else {
        console.log("Failed to apply patch:", r.args.Instruction);
        console.log("Target:", target);
    }
}
fs.writeFileSync('frontend/src/pages/dashboard/Consultations.jsx', file);
console.log('Successfully applied', successCount, 'out of', replaces.length, 'patches.');
