import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

var PUBLIC_DIR = path.join(__dirname, 'public');
var BACKUP_DIR = path.join(__dirname, 'public-originals');

console.log('PUBLIC_DIR:', PUBLIC_DIR);
console.log('BACKUP_DIR:', BACKUP_DIR);
console.log('PUBLIC_DIR exists:', fs.existsSync(PUBLIC_DIR));
console.log('BACKUP_DIR exists:', fs.existsSync(BACKUP_DIR));

// Ensure BACKUP_DIR exists
if (!fs.existsSync(BACKUP_DIR)) {
  try {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log('Created backup directory:', BACKUP_DIR);
  } catch (err) {
    console.error('Could not create backup directory:', BACKUP_DIR, err);
  }
}

// Recursively walk a directory and return all file paths
function walk(dir) {
  let results = [];
  try {
    if (!fs.existsSync(dir)) {
      console.error('Directory does not exist:', dir);
      return [];
    }
    for (const file of fs.readdirSync(dir)) {
      const full = path.join(dir, file);
      try {
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          results = results.concat(walk(full));
        } else if (stat.isFile()) {
          results.push(full);
        } else {
          console.log('Skipping non-file/non-dir:', full);
        }
      } catch (err) {
        console.error('Error stating file:', full, err);
      }
    }
  } catch (err) {
    console.error('Error walking directory:', dir, err);
  }
  return results;
}

// Generate a random string for obfuscation (first char is always a-zA-Z)
function randStr(len = 10) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const firstChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let str = '';
  str += firstChars.charAt(crypto.randomBytes(1)[0] % firstChars.length);
  for (let i = 1; i < len; ++i) {
    str += chars.charAt(crypto.randomBytes(1)[0] % chars.length);
  }
  return str;
}

// Backup original file if not already backed up
function backupFile(src, rel) {
  const dest = path.join(BACKUP_DIR, rel);
  if (!fs.existsSync(dest)) {
    try {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(src, dest);
      console.log(`Backed up: ${src} -> ${dest}`);
    } catch (err) {
      console.error('Error backing up file:', src, err);
    }
  } else {
    // console.log(`Backup already exists for: ${rel}`);
  }
}

// Obfuscate HTML: ids, classes, inline event handlers, attribute names
function obfuscateHTML(content, idMap, classMap, attrMap) {
  // IDs
  content = content.replace(/id\s*=\s*["']([\w-]+)["']/g, (m, id) => {
    if (!idMap[id]) idMap[id] = randStr();
    return `id="${idMap[id]}"`;
  });
  // Classes
  content = content.replace(/class\s*=\s*["']([^"']+)["']/g, (m, classes) => {
    const obf = classes.split(/\s+/).map(cls => {
      if (!classMap[cls]) classMap[cls] = randStr();
      return classMap[cls];
    }).join(' ');
    return `class="${obf}"`;
  });
  // Inline event handlers (e.g. onclick)
  content = content.replace(/on([a-z]+)\s*=\s*["']([^"']+)["']/gi, (m, evt, js) => {
    return `on${evt}="${obfuscateJS(js)}"`;
  });
  // Custom attributes (data-*)
  content = content.replace(/(data-[\w-]+)\s*=\s*["']([\w-]+)["']/g, (m, attr, val) => {
    if (!attrMap[attr]) attrMap[attr] = randStr();
    return `${attrMap[attr]}="${val}"`;
  });
  return content;
}

// Obfuscate CSS: class and id selectors
function obfuscateCSS(content, idMap, classMap) {
  // .class selectors
  content = content.replace(/\.([a-zA-Z_][\w-]*)/g, (m, cls) => {
    return classMap[cls] ? `.${classMap[cls]}` : m;
  });
  // #id selectors
  content = content.replace(/#([a-zA-Z_][\w-]*)/g, (m, id) => {
    return idMap[id] ? `#${idMap[id]}` : m;
  });
  return content;
}

// Obfuscate JS: variable, function, class names (simple, robust for scraping)
// Now also replaces string literals matching ids/classes/attrs for DOM consistency
function obfuscateJS(content, jsMap = {}, idMap = {}, classMap = {}, attrMap = {}) {
  // Find variable, function, and class names (not perfect, but robust for scraping)
  const varFuncClassRegex = /\b(var|let|const|function|class)\s+([a-zA-Z_]\w*)/g;
  let m;
  while ((m = varFuncClassRegex.exec(content))) {
    const name = m[2];
    if (!jsMap[name]) {
      jsMap[name] = randStr();
    }
  }
  // Replace all identifiers
  Object.entries(jsMap).forEach(([orig, obf]) => {
    const re = new RegExp(`\\b${orig}\\b`, 'g');
    content = content.replace(re, obf);
  });

  // Replace string literals matching ids/classes/attrs
  // id: 'foo', "foo"
  content = content.replace(/(['"])([\w-]+)\1/g, (match, quote, str) => {
    if (idMap[str]) return `${quote}${idMap[str]}${quote}`;
    if (classMap[str]) return `${quote}${classMap[str]}${quote}`;
    if (attrMap[str]) return `${quote}${attrMap[str]}${quote}`;
    return match;
  });

  return content;
}

// Main obfuscation process
function obfuscatePublic() {
  if (!fs.existsSync(PUBLIC_DIR)) {
    console.error('Public directory does not exist:', PUBLIC_DIR);
    return;
  }
  if (!fs.existsSync(BACKUP_DIR)) {
    try {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
      console.log('Created backup directory:', BACKUP_DIR);
    } catch (err) {
      console.error('Could not create backup directory:', BACKUP_DIR, err);
      return;
    }
  }
  const files = walk(PUBLIC_DIR);

  if (files.length === 0) {
    console.error('No files found in PUBLIC_DIR. Nothing to obfuscate.');
    return;
  }

  let foundTargetFiles = 0;
  let backedUp = 0;
  let obfuscated = 0;

  // Only backup and obfuscate .html and .js files
  for (const file of files) {
    const rel = path.relative(PUBLIC_DIR, file);
    const ext = path.extname(file).toLowerCase();
    if (!['.html', '.js'].includes(ext)) {
      continue;
    }
    foundTargetFiles++;
    try {
      backupFile(file, rel);
      backedUp++;
    } catch (err) {
      console.error('Backup failed for:', file, err);
    }
    let content;
    try {
      content = fs.readFileSync(file, 'utf8');
    } catch (err) {
      console.error('Error reading file for obfuscation:', file, err);
      continue;
    }
    // Encode content in base64
    const b64 = Buffer.from(content, 'utf8').toString('base64');
    let obfContent = '';
    if (ext === '.html') {
      obfContent =
        `<script>
(function(){
  const d=document;
  const b64='${b64}';
  const dec=atob(b64);
  d.open();d.write(dec);d.close();
})();
</script>`;
    } else if (ext === '.js') {
      obfContent =
        `(function(){
  const b64='${b64}';
  const dec=atob(b64);
  (0,eval)(dec);
})();`;
    }
    try {
      fs.writeFileSync(file, obfContent, 'utf8');
      obfuscated++;
      console.log(`Obfuscated (base64): ${rel}`);
    } catch (err) {
      console.error('Error writing obfuscated file:', file, err);
    }
  }

  console.log(`Summary: Found ${files.length} files, ${foundTargetFiles} target files (.html/.js), backed up ${backedUp}, obfuscated ${obfuscated}.`);
}

// Restore originals
function restorePublic() {
  if (!fs.existsSync(BACKUP_DIR)) {
    console.error('No backup found.');
    return;
  }
  const files = walk(BACKUP_DIR);
  if (files.length === 0) {
    console.error('No backup files found in BACKUP_DIR.');
    return;
  }
  for (const file of files) {
    const rel = path.relative(BACKUP_DIR, file);
    const dest = path.join(PUBLIC_DIR, rel);
    try {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(file, dest);
      console.log(`Restored: ${rel}`);
    } catch (err) {
      console.error('Error restoring file:', file, err);
    }
  }
}

// CLI usage: node hide.js [obfuscate|restore]
if (process.argv[1] && process.argv[1].endsWith('hide.js')) {
  const cmd = process.argv[2];
  console.log('Command:', cmd);
  if (cmd === 'restore') restorePublic();
  else obfuscatePublic();
}
