# Installing Poppler for pdf2image

## Issue
The analysis requires **Poppler** to convert PDF pages to images for OCR processing.

## Quick Install Options

### Option 1: Download Portable Poppler (No Admin Required)

1. Download from: https://github.com/oschwartz10612/poppler-windows/releases/
2. Download the latest Release (zip file, e.g., `Release-25.12.0-0.zip`)
3. Extract to: `C:\poppler` or any folder you prefer
4. Add to PATH or configure in script

**After extraction**, you'll have: `C:\poppler\Library\bin\`

### Option 2: Chocolatey (Requires Admin)

Open PowerShell **as Administrator** and run:
```powershell
choco install poppler -y
```

### Option 3: Conda (If you use Anaconda/Miniconda)

```bash
conda install -c conda-forge poppler
```

## Configure the Script

### If Poppler is NOT in PATH:

Edit `tesseract_ocr_analysis.py` and add after line 20:

```python
# Add poppler path for pdf2image
import os
os.environ["PATH"] += os.pathsep + r'C:\poppler\Library\bin'
```

Replace `C:\poppler\Library\bin` with your actual poppler bin path.

## Verify Installation

After installation, test:
```powershell
pdfinfo -v
```

Should show: `pdfinfo version X.XX.X`

## Then Run Analysis

```powershell
cd "d:\CCEE site\data\PYQ"
python tesseract_ocr_analysis.py
```

---

## Quick Download Links

- **Poppler Windows**: https://github.com/oschwartz10612/poppler-windows/releases/latest
- **Direct Download**: https://github.com/oschwartz10612/poppler-windows/releases/download/v25.12.0-0/Release-25.12.0-0.zip

Extract and you're ready to go!
