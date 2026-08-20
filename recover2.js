const fs = require('fs');
const transcriptPath = 'C:\\Users\\Fresh\\.gemini\\antigravity\\brain\\339cbc7d-24b3-4e47-b10c-a340b090a4bf\\.system_generated\\logs\\transcript_full.jsonl';
const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n').filter(Boolean);

let found = false;
for (const line of lines.reverse()) {
  try {
    const obj = JSON.parse(line);
    if (obj.tool_calls) {
      for (const call of obj.tool_calls) {
        let str = JSON.stringify(call);
        if (str.includes('Consultations.jsx') && (str.includes('replace_file_content') || str.includes('node -e'))) {
          console.log(str.substring(0, 500));
          found = true;
          break;
        }
      }
    }
  } catch(e) {}
  if (found) break;
}
