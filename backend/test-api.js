const http = require('http');

const payload = JSON.stringify({
  userId: 'test',
  reportText: 'ACUTE REPORT: White Blood Cells: 8.4 K/uL, Potassium: 5.9 mEq/L, Creatinine: 2.45 mg/dL, eGFR: 24 mL/min, Active: Lisinopril 10mg, Metformin 500mg'
});

const req = http.request('http://localhost:5000/api/medical/parse-report', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('RESPONSE:', JSON.stringify(JSON.parse(body), null, 2));
  });
});

req.on('error', (e) => console.error(e));
req.write(payload);
req.end();
