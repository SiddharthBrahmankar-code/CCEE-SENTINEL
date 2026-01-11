# Tesseract OCR Installation Guide for Windows

## Quick Installation

### Option 1: Download Installer (Recommended)
1. Download Tesseract installer from: https://github.com/UB-Mannheim/tesseract/wiki
2. Install to default location: `C:\Program Files\Tesseract-OCR\`
3. Add to PATH or update script

### Option 2: Chocolatey
```powershell
choco install tesseract
```

### Option 3: Scoop
```powershell
scoop install tesseract
```

## After Installation

1. Verify installation:
```powershell
tesseract --version
```

2. Run the analysis:
```powershell
python tesseract_ocr_analysis.py
```

## If Tesseract is Not in PATH

Edit line 19 in `tesseract_ocr_analysis.py`:
```python
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
```

## Expected Output

The script will generate:
- `analysis/questions_by_module.json` - Questions grouped by module
- `analysis/module_statistics.json` - Statistical analysis
- `analysis/TESSERACT_REPORT.md` - Human-readable report
- `analysis/*_tesseract.txt` - Raw OCR text

## Processing Time

- ~2-3 seconds per page
- Total time: ~5-10 minutes for all PDFs
