const fs = require('fs');
const path = require('path');

// Simple script to create placeholder icon files
// These are just empty files to prevent 404 errors
// Replace with actual PNG icons later

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '../public/icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create placeholder text file for each icon
sizes.forEach(size => {
  const filename = `icon-${size}x${size}.png.placeholder`;
  const filepath = path.join(iconsDir, filename);
  const content = `Placeholder for ${size}x${size} icon. Replace with actual PNG image.`;

  fs.writeFileSync(filepath, content);
  console.log(`Created placeholder: ${filename}`);
});

console.log('\n✓ Placeholder files created in public/icons/');
console.log('⚠ Remember to replace these with actual PNG icons!');
console.log('  See public/icons/README.md for instructions.\n');