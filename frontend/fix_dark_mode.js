import fs from 'fs';
import path from 'path';

function replaceClasses(content) {
  let modified = content;
  
  // Mapping rules for dark mode refinement
  const mappings = [
    { regex: /(?<!-)bg-white(?!\w)/g, repl: "bg-surface" },
    { regex: /(?<!-)bg-slate-50(?!\w)/g, repl: "bg-background" },
    { regex: /(?<!-)text-slate-800(?!\w)/g, repl: "text-text" },
    { regex: /(?<!-)text-slate-900(?!\w)/g, repl: "text-text" },
    { regex: /(?<!-)border-slate-100(?!\w)/g, repl: "border-slate-200 dark:border-zinc-800" },
    { regex: /(?<!-)border-slate-200(?!\w)/g, repl: "border-slate-300 dark:border-zinc-800" },
    { regex: /(?<!-)text-slate-600(?!\w)/g, repl: "text-slate-600 dark:text-zinc-400" },
    { regex: /(?<!-)text-slate-500(?!\w)/g, repl: "text-slate-500 dark:text-zinc-500" },
    { regex: /(?<!-)text-slate-400(?!\w)/g, repl: "text-slate-400 dark:text-zinc-500" },
    { regex: /(?<!-)bg-slate-100(?!\w)/g, repl: "bg-slate-100 dark:bg-zinc-800/50" },
    { regex: /(?<!-)bg-slate-200(?!\w)/g, repl: "bg-slate-200 dark:bg-zinc-800" },
    { regex: /hover:bg-slate-50(?!\w)/g, repl: "hover:bg-slate-50 dark:hover:bg-zinc-800/50" },
    { regex: /hover:bg-slate-100(?!\w)/g, repl: "hover:bg-slate-100 dark:hover:bg-zinc-800" },
    { regex: /(?<!-)bg-sky-50(?!\w)/g, repl: "bg-sky-50 dark:bg-sky-900/30" },
    { regex: /(?<!-)bg-sky-100(?!\w)/g, repl: "bg-sky-100 dark:bg-sky-900/50" },
    { regex: /(?<!-)text-sky-700(?!\w)/g, repl: "text-sky-700 dark:text-sky-400" },
    { regex: /(?<!-)text-sky-600(?!\w)/g, repl: "text-sky-600 dark:text-sky-400" },
    { regex: /(?<!-)text-emerald-700(?!\w)/g, repl: "text-emerald-700 dark:text-emerald-400" },
    { regex: /(?<!-)bg-emerald-50(?!\w)/g, repl: "bg-emerald-50 dark:bg-emerald-900/30" },
    { regex: /(?<!-)border-emerald-100(?!\w)/g, repl: "border-emerald-100 dark:border-emerald-900/50" },
    { regex: /(?<!-)text-amber-700(?!\w)/g, repl: "text-amber-700 dark:text-amber-400" },
    { regex: /(?<!-)bg-amber-50(?!\w)/g, repl: "bg-amber-50 dark:bg-amber-900/30" },
    { regex: /(?<!-)border-amber-100(?!\w)/g, repl: "border-amber-100 dark:border-amber-900/50" },
    { regex: /(?<!-)text-rose-600(?!\w)/g, repl: "text-rose-600 dark:text-rose-400" },
    { regex: /(?<!-)text-rose-500(?!\w)/g, repl: "text-rose-500 dark:text-rose-400" },
    { regex: /(?<!-)bg-rose-50(?!\w)/g, repl: "bg-rose-50 dark:bg-rose-900/30" },
    { regex: /(?<!-)border-rose-100(?!\w)/g, repl: "border-rose-100 dark:border-rose-900/50" },
    { regex: /(?<!-)text-indigo-700(?!\w)/g, repl: "text-indigo-700 dark:text-indigo-400" },
    { regex: /(?<!-)bg-indigo-50(?!\w)/g, repl: "bg-indigo-50 dark:bg-indigo-900/30" },
    { regex: /(?<!-)border-indigo-100(?!\w)/g, repl: "border-indigo-100 dark:border-indigo-900/50" },
    { regex: /(?<!-)shadow-sm(?!\w)/g, repl: "shadow-sm dark:shadow-none" },
    { regex: /(?<!-)shadow-md(?!\w)/g, repl: "shadow-md dark:shadow-none" }
  ];

  mappings.forEach(mapping => {
    modified = modified.replace(mapping.regex, mapping.repl);
  });

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
console.log('Done!');
