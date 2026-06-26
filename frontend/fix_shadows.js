import fs from 'fs';
import path from 'path';

function replaceClasses(content) {
  let modified = content;
  
  const mappings = [
    { regex: /(?<!-)shadow-lg(?!\w)/g, repl: "shadow-lg dark:shadow-none" },
    { regex: /(?<!-)shadow-xl(?!\w)/g, repl: "shadow-xl dark:shadow-none" },
    { regex: /(?<!-)shadow-2xl(?!\w)/g, repl: "shadow-2xl dark:shadow-none" },
    { regex: /(?<!-)shadow-inner(?!\w)/g, repl: "shadow-inner dark:shadow-none" }
  ];

  mappings.forEach(mapping => {
    // Only replace if dark:shadow-none isn't already directly next to it
    // Actually, we can just replace and then clean up duplicates
    modified = modified.replace(mapping.regex, mapping.repl);
  });
  
  // Clean up any double dark:shadow-none that might have occurred
  modified = modified.replace(/dark:shadow-none\s+dark:shadow-none/g, 'dark:shadow-none');

  return modified;
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const newContent = replaceClasses(content);
      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent);
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

processDirectory('./src');
console.log('Done fixing shadows!');
