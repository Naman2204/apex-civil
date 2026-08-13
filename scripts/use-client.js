const fs = require('fs');
const path = require('path');

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
};

const files = walk('./src/components');
files.forEach((file) => {
  const content = fs.readFileSync(file, 'utf-8');
  if (!content.startsWith('"use client";')) {
    fs.writeFileSync(file, '"use client";\n' + content);
  }
});
console.log('Added "use client" to ' + files.length + ' components.');
