const sharp = require('sharp');
console.log('Sharp Version:', require('sharp/package.json').version);
console.log('PDF Support:', sharp.format.pdf);

sharp({
    create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 255, g: 0, b: 0 }
    }
}).png().toBuffer().then(data => {
    console.log('PNG Test: OK');
}).catch(err => {
    console.error('PNG Test: Failed', err);
});
