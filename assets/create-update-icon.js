import { createCanvas } from 'canvas';
import fs from 'fs';

// Create a 22x22 canvas (standard macOS tray icon size @1x)
const canvas = createCanvas(22, 22);
const ctx = canvas.getContext('2d');

// Load the base icon
const baseIcon = fs.readFileSync('assets/menubarTemplate.png');
const img = new Image();
img.src = baseIcon;

// Draw base icon
ctx.drawImage(img, 0, 0, 22, 22);

// Add red notification dot
ctx.fillStyle = '#FF3B30'; // Apple's system red color
ctx.beginPath();
ctx.arc(17, 5, 3, 0, Math.PI * 2);
ctx.fill();

// Add white border for visibility
ctx.strokeStyle = 'white';
ctx.lineWidth = 0.5;
ctx.stroke();

// Save the image
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('assets/menubarUpdateTemplate.png', buffer);
fs.writeFileSync('assets/menubarUpdateTemplate@2x.png', buffer); // For retina

console.log('Update icon created!');
