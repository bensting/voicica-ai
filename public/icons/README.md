# PWA Icons

This directory should contain PWA icons in the following sizes:
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

## Generate Icons

You can generate these icons from the `/public/icon.svg` file using:

### Option 1: Online Tools
- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator

### Option 2: Using Sharp (Node.js)
```bash
npm install -g sharp-cli
sharp -i ../icon.svg -o icon-72x72.png resize 72 72
sharp -i ../icon.svg -o icon-96x96.png resize 96 96
sharp -i ../icon.svg -o icon-128x128.png resize 128 128
sharp -i ../icon.svg -o icon-144x144.png resize 144 144
sharp -i ../icon.svg -o icon-152x152.png resize 152 152
sharp -i ../icon.svg -o icon-192x192.png resize 192 192
sharp -i ../icon.svg -o icon-384x384.png resize 384 384
sharp -i ../icon.svg -o icon-512x512.png resize 512 512
```

### Option 3: ImageMagick
```bash
convert ../icon.svg -resize 72x72 icon-72x72.png
convert ../icon.svg -resize 96x96 icon-96x96.png
convert ../icon.svg -resize 128x128 icon-128x128.png
convert ../icon.svg -resize 144x144 icon-144x144.png
convert ../icon.svg -resize 152x152 icon-152x152.png
convert ../icon.svg -resize 192x192 icon-192x192.png
convert ../icon.svg -resize 384x384 icon-384x384.png
convert ../icon.svg -resize 512x512 icon-512x512.png
```

## Temporary Solution
Until icons are generated, you can use the favicon.ico or temporarily remove icon references from manifest.json.