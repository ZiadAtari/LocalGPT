const pdfParse = require('pdf-parse');
console.log('Type of pdfParse:', typeof pdfParse);
console.log('Is pdfParse a function?', typeof pdfParse === 'function');
console.log('pdfParse keys:', Object.keys(pdfParse));
if (pdfParse.default) {
    console.log('Type of pdfParse.default:', typeof pdfParse.default);
}

// Try to mock a buffer and call it if it's a function
if (typeof pdfParse === 'function') {
    console.log('pdfParse is a function, trying to call it...');
}
