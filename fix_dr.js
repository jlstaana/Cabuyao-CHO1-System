const fs = require('fs');
const path = require('path');

function walkSync(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkSync(dirPath, callback) : callback(dirPath);
  });
}

const fixDrPrefix = (filePath) => {
  if (filePath.endsWith('.jsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix `Dr. ${something}` -> `Dr. ${(something || '').replace(/^Dr\.\s*/i, '')}`
    let newContent = content.replace(/Dr\.\s*\$\{([a-zA-Z0-9_.\?]+)\}/g, (match, p1) => {
      return `Dr. \${(${p1} || '').replace(/^Dr\\.\\s*/i, '')}`;
    });
    
    // Fix Dr. {something} -> Dr. {(something || '').replace(/^Dr\.\s*/i, '')}
    newContent = newContent.replace(/Dr\.\s*\{([a-zA-Z0-9_.\?]+)\}/g, (match, p1) => {
      return `Dr. {(${p1} || '').replace(/^Dr\\.\\s*/i, '')}`;
    });
    
    // Fix "Dr. " + user?.name?.split(' ')[0] in Overview.jsx
    newContent = newContent.replace(/Dr\.\s*\$\{user\?\.name\?\.split\(' '\)\[0\]\}/g, `Dr. \${(user?.name?.split(' ')[0] || '').replace(/^Dr\\.\\s*/i, '')}`);

    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent);
      console.log('Updated', filePath);
    }
  }
};

walkSync('frontend/src/pages', fixDrPrefix);
walkSync('frontend/src/layouts', fixDrPrefix);
