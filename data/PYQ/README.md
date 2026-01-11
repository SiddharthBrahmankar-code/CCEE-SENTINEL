# CCEE PYQ Analysis - Tesseract OCR

Extract and analyze CCEE previous year questions from PDF files, categorize by module for mock test generation.

## Quick Start

### 1. Install Tesseract OCR

**Option A - Automated (Windows):**
```powershell
.\install_tesseract.bat
```

**Option B - Manual:**
1. Download from: https://github.com/UB-Mannheim/tesseract/wiki
2. Install to `C:\Program Files\Tesseract-OCR\`
3. Add to PATH or update script line 19

**Option C - Chocolatey:**
```powershell
choco install tesseract -y
```

### 2. Install Python Dependencies

```powershell
pip install pytesseract pillow pdf2image
```

### 3. Run Analysis

```powershell
python tesseract_ocr_analysis.py
```

## What It Does

1. **PDF to Image Conversion**: Converts CCEE exam PDFs to high-resolution images (300 DPI)
2. **OCR Extraction**: Uses Tesseract to extract text from images
3. **Question Parsing**: Identifies questions, code snippets, and options
4. **Module Categorization**: Classifies questions into 8 CCEE modules using keyword matching
5. **Statistics Generation**: Computes module-wise statistics and characteristics
6. **JSON Output**: Generates structured data for mock test system

## Output Files

Located in `analysis/` directory:

- **questions_by_module.json** - Questions grouped by module (for mock tests)
- **module_statistics.json** - Question counts, code percentages, etc.
- **TESSERACT_REPORT.md** - Human-readable analysis report
- **\*_tesseract.txt** - Raw OCR extracted text (for debugging)

## Module Categories

1. DAC School TG ADS Using Java (Data Structures & Algorithms)
2. DAC School TG Aptitude & Communication
3. DAC School TG C++ Programming
4. DAC School TG COS & SDM (OS & Software Dev)
5. DAC School TG OOPJ with Java
6. DAC School TG Web Programming Technologies
7. DAC School TG Web-Based Java Programming
8. DAC School TG Database Technologies

## Features

✅ High-accuracy OCR for printed exam papers  
✅ Code snippet detection and preservation  
✅ Negative question identification  
✅ Module categorization with confidence scores  
✅ Comprehensive statistics generation  
✅ Mock test integration ready  

## Performance

- **Speed**: ~2-3 seconds per page
- **Accuracy**: 90-95% for printed text  
- **Processing**: ~5-10 minutes for complete analysis
- **Memory**: Moderate (batch processing)

## Troubleshooting

### "tesseract: command not found"
- Install Tesseract using one of the methods above
- Or uncomment line 19 in `tesseract_ocr_analysis.py` and set path

### "No module named 'pytesseract'"
```powershell
pip install pytesseract pillow pdf2image
```

### "PDF file not found"
- Check PDF paths in script (lines 21-24)
- Ensure PDFs exist in `data/PYQ/` directory

## Next Steps

After analysis completes:
1. Review `analysis/TESSERACT_REPORT.md` for overview
2. Check `analysis/module_statistics.json` for distribution
3. Use `analysis/questions_by_module.json` in mock test system
4. Manually verify sample questions for accuracy

## Files

- `tesseract_ocr_analysis.py` - Main analysis script
- `install_tesseract.bat` - Automated installer
- `TESSERACT_INSTALL.md` - Installation guide
- `README.md` - This file
