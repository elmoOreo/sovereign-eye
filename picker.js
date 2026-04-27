const express = require('express');
const app = express();
const path = require('path');

// --- Configuration ---
const PORT = 5050; // Switched from 5000 to avoid macOS AirPlay conflict
const IMAGE_NAME = 'roi_master_2880.jpg';

app.use('/images', express.static(__dirname));

app.get('/', (req, res) => {
    res.send(`
        <html>
        <body style="margin:0; background:#1a1a1a; color:#eee; font-family:system-ui, sans-serif; display:flex; flex-direction:column; align-items:center;">
            <div style="padding:20px; text-align:center;">
                <h2 style="margin:0;">ROI Selector</h2>
                <p id="coords">Click <b>Top-Left</b> of the box, then <b>Bottom-Right</b></p>
            </div>
            <div style="position:relative; border:2px solid #444; line-height:0;">
                <img id="mapper" src="/images/${IMAGE_NAME}" style="cursor:crosshair; max-width:90vw;">
                <div id="box" style="position:absolute; border:2px solid #00ff00; pointer-events:none; display:none; background:rgba(0,255,0,0.1);"></div>
            </div>
            <script>
                let points = [];
                const img = document.getElementById('mapper');
                const box = document.getElementById('box');
                const display = document.getElementById('coords');
                
                img.onclick = (e) => {
                    const rect = img.getBoundingClientRect();
                    // Calculate coordinates relative to the actual image pixels
                    const scaleX = img.naturalWidth / rect.width;
                    const scaleY = img.naturalHeight / rect.height;
                    
                    const x = Math.round((e.clientX - rect.left) * scaleX);
                    const y = Math.round((e.clientY - rect.top) * scaleY);
                    
                    points.push({x, y});
                    
                    if (points.length === 1) {
                        display.innerHTML = "Now click <b>Bottom-Right</b> corner...";
                    } else if (points.length === 2) {
                        const left = Math.min(points[0].x, points[1].x);
                        const top = Math.min(points[0].y, points[1].y);
                        const width = Math.abs(points[1].x - points[0].x);
                        const height = Math.abs(points[1].y - points[0].y);
                        
                        const roi = { left, top, width, height };
                        display.innerHTML = \`<b>ROI Found!</b> Copy this:<br><pre style="background:#000; padding:10px; margin-top:10px;">\${JSON.stringify(roi, null, 2)}</pre>\`;
                        
                        // Draw visual feedback
                        box.style.display = 'block';
                        box.style.left = (left / scaleX) + 'px';
                        box.style.top = (top / scaleY) + 'px';
                        box.style.width = (width / scaleX) + 'px';
                        box.style.height = (height / scaleY) + 'px';
                        points = []; 
                    }
                };
            </script>
        </body>
        </html>
    `);
});

const server = app.listen(PORT, () => {
    console.log(`[+] Calibration tool live at http://localhost:${PORT}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`[-] Port ${PORT} is busy. Try changing the PORT variable.`);
    } else {
        console.error(`[-] Server error:`, err);
    }
});