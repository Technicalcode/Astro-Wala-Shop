const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

let count = 0;
walkDir(path.join(__dirname, 'src'), function(filePath) {
  if (filePath.endsWith('.jsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if the file has <img 
    // Need to avoid double adding loading="lazy"
    // Also consider <img\n
    // Let's replace <img with <img loading="lazy" only if loading="lazy" is not in the same tag.
    
    // A simpler regex to match <img ... > and inject loading="lazy" if not present
    let newContent = content.replace(/<img([^>]*)>/g, (match, p1) => {
      if (p1.includes('loading="lazy"')) {
        return match;
      }
      count++;
      return `<img loading="lazy"${p1}>`;
    });
    
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, 'utf8');
    }
  }
});
console.log(`Updated ${count} image tags.`);
