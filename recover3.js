const fs = require('fs');
const transcriptPath = 'C:\\Users\\Fresh\\.gemini\\antigravity\\brain\\339cbc7d-24b3-4e47-b10c-a340b090a4bf\\.system_generated\\logs\\transcript_full.jsonl';
const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n').filter(Boolean);

let contents = [];

for (const line of lines) {
  try {
    const obj = JSON.parse(line);
    if (obj.tool_calls) {
      for (const call of obj.tool_calls) {
        let str = JSON.stringify(call);
        if (str.includes('Consultations.jsx') && (call.name === 'replace_file_content' || call.name === 'write_to_file' || call.name === 'run_command')) {
          contents.push(call);
        }
      }
    }
  } catch(e) {}
}

fs.writeFileSync('recover_log.json', JSON.stringify(contents, null, 2));
