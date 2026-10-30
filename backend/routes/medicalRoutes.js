const router = require('express').Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const Report = require('../models/Report');
const {
  parseLabReport,
  parseLabReportFromImage,
  checkContraindications,
} = require('../services/geminiService');

// ── Multer: store files in memory (no disk writes) ────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Upload a PDF or image.`));
    }
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/medical/parse-report
// Accepts:
//   (a) multipart/form-data with a "file" field (PDF or image), OR
//   (b) application/json with { userId, reportText }
//
// Returns: { biomarkers: Array, safetyAnalysis: string }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/parse-report', upload.single('file'), async (req, res) => {
  try {
    const userId = req.body.userId || 'anonymous';
    let parsed;

    if (req.file) {
      // ── File upload path ──────────────────────────────────────────────────
      const { mimetype, buffer } = req.file;

      if (mimetype === 'application/pdf') {
        // PDF → extract text → send text to Gemini
        const pdfData = await pdfParse(buffer);
        const extractedText = pdfData.text;
        if (!extractedText || extractedText.trim().length < 20) {
          return res.status(400).json({
            error: 'PDF appears to be image-based (scanned). Please upload a JPEG/PNG image instead.',
          });
        }
        parsed = await parseLabReport(extractedText);
      } else {
        // Image (JPEG / PNG / WEBP) → send base64 directly to Gemini vision
        const base64 = buffer.toString('base64');
        parsed = await parseLabReportFromImage(base64, mimetype);
      }
    } else {
      // ── Plain text path (backward-compatible) ─────────────────────────────
      const { reportText } = req.body;
      if (!reportText || !reportText.trim()) {
        return res.status(400).json({ error: 'Provide either a file upload or reportText.' });
      }
      parsed = await parseLabReport(reportText);
    }

    // Persist to MongoDB
    await Report.create({
      userId,
      rawText: req.file ? `[File upload: ${req.file.originalname}]` : req.body.reportText,
      biomarkers: parsed.biomarkers,
    }).catch(() => { /* non-fatal — still return AI result */ });

    // Return shape the frontend expects
    return res.status(201).json({
      biomarkers:     parsed.biomarkers,
      safetyAnalysis: parsed.safetyAnalysis,
    });

  } catch (err) {
    console.error('[parse-report] Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/medical/check-safety
// ─────────────────────────────────────────────────────────────────────────────
router.post('/check-safety', async (req, res) => {
  try {
    const { userId, labParameters } = req.body;
    const activeMeds = await require('../models/Medication').find({ userId, activeStatus: true });
    const result = await checkContraindications(labParameters, activeMeds);
    res.json(result);
  } catch (err) {
    console.error('[check-safety] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
