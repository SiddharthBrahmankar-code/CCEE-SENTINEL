# 🎯 CCEE SENTINEL - Quick Start Guide

## Current Status
✅ **Application is Running**
- Frontend: http://localhost:5173 (Cyber-themed UI working)
- Backend: http://localhost:4000 (PDF processor ready)
- Dropdowns implemented (Module → Topic selection)

## ⚠️ Why Are Dropdowns Empty?

The system needs to process your PDF files to extract modules and topics. This requires:

### 1. Add Your Gemini API Key
**File**: `d:/CCEE site/server/.env`

```env
PORT=4000
GEMINI_API_KEY=your_actual_key_here  # ← Replace this!
```

Get a free key: https://makersuite.google.com/app/apikey

### 2. Ensure PDFs Are in Place
Check that your PDFs exist in:
- `d:/CCEE site/data/Syllabus/*.pdf` (9 files detected ✅)
- `d:/CCEE site/data/PYQ/*.pdf` (2 files detected ✅)

### 3. Restart the Server
After adding the API key:

```bash
# Stop the current server (Ctrl+C)
cd server
npm run dev
```

**Watch for**: `📚 Processing PDFs...` → `✅ Processed N modules`

## 🧪 How to Test

Once modules are processed:

### Notes Generation
1. Go to http://localhost:5173/notes
2. Select a Module from dropdown
3. Select a Topic
4. Click "GENERATE NOTES"
5. AI will create trap-aware study material

### Mock Tests
1. Go to http://localhost:5173/mock
2. Select Module → Topic
3. Choose Difficulty
4. Click "START SIMULATION"
5. Take the test and see trap analysis

## 📊 What Happens Behind the Scenes

1. **Server Startup**: Scans `/data/Syllabus/` folder
2. **PDF Extraction**: Reads each PDF's text content
3. **AI Analysis**: Gemini extracts module names and topics
4. **Storage**: Saves to `data/processed/modules.json`
5. **API Serving**: Provides modules to frontend dropdowns

## 🔍 Verification

**Check if processing worked**:
```bash
cat data/processed/modules.json
```

Should show JSON with your modules and topics.

## ❓ Troubleshooting

**Problem**: Still showing 0 modules after restart
- **Check**: Is the API key valid? (should start with `AIza...`)
- **Check**: Are PDFs readable? (not corrupted/encrypted)
- **Solution**: Check server logs for errors

**Problem**: Notes/Mock generation fails
- **Error**: "Failed to generate..."
- **Cause**: API key issue or rate limiting
- **Solution**: Verify API key, check quota

---

**Everything is working correctly - just needs the API key to activate! 🚀**
