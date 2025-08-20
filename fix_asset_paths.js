// fix_asset_paths.js
const fs = require('fs');
const path = require('path');

const buildPath = path.join(__dirname, 'build');

function fixAssetPaths(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      fixAssetPaths(filePath);
    } else if (file.endsWith('.html') || file.endsWith('.js') || file.endsWith('.css')) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Reemplazar rutas de assets para GitHub Pages
      content = content.replace(/(src|href)="\/(static\/[^"]*\.(css|js|png|jpg|jpeg|gif|ico))"/g, '$1="./$2"');
      content = content.replace(/url\(\/\//g, 'url(//');
      content = content.replace(/url\(\/(static\/[^)]*)\)/g, 'url(./$1)');
      
      fs.writeFileSync(filePath, content, 'utf8');
    }
  });
}

if (fs.existsSync(buildPath)) {
  console.log('Fixando rutas de assets para GitHub Pages...');
  fixAssetPaths(buildPath);
  console.log('¡Rutas fixeadas correctamente!');
} else {
  console.log('Carpeta build no encontrada. Ejecuta npm run build primero.');
}