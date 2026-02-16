try {
    const pdf = require('pdf-parse');
    console.error('REQUIRED:', pdf);
    console.error('TYPE:', typeof pdf);
} catch (e) {
    console.error('ERROR:', e.message);
}
