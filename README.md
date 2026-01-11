# CCEE SENTINEL 🚀

AI-Powered Exam Intelligence System for CCEE (CDAC Common Entrance Exam) Preparation

![CCEE SENTINEL](file:///C:/Users/brahm/.gemini/antigravity/brain/71b0cb60-3bdf-4661-b98c-8c27bc520a03/landing_page_1766402190123.png)

## 🎯 Overview

CCEE SENTINEL is a high-tech, localhost-hosted web application designed to maximize your CCEE exam preparation through AI-driven pattern analysis, trap detection, and intelligent mock testing.

**Key Features:**
- 🧠 **Syllabus Intelligence**: AI-powered topic prioritization from PDF syllabus
- 📊 **PYQ Analysis**: Extract patterns and traps from previous year questions
- 📝 **Smart Notes**: Generate exam-focused, trap-aware study material
- ⚔️ **Mock Wargame**: CCEE-pattern mock tests with detailed trap analysis

## 🛠️ Tech Stack

**Frontend:**
- React 18 + Vite + TypeScript
- Tailwind CSS (Cyber-themed UI)
- Framer Motion (Animations)
- React Router

**Backend:**
- Node.js + Express + TypeScript
- Google Gemini API (AI Content Generation)
- PDF parsing (pdf-parse)

## 📦 Installation & Setup

### Prerequisites
- Node.js (LTS version)
- Google Gemini API Key ([Get one here](https://makersuite.google.com/app/apikey))

### Step 1: Install Dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### Step 2: Configure API Key

Create/edit `server/.env`:
```env
PORT=4000
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### Step 3: Add Data Files

Place your PDFs in:
- Syllabus: `data/Syllabus/*.pdf`
- PYQs: `data/PYQ/*.pdf`

### Step 4: Run the Application

**Terminal 1 - Start Server:**
```bash
cd server
npm run dev
```

**Terminal 2 - Start Client:**
```bash
cd client
npm run dev
```

**Access:** Open [http://localhost:5173](http://localhost:5173)

## 🚀 Usage

### 1. Syllabus Intelligence
- Navigate to **Syllabus** tab
- Select a PDF file from the list
- AI will parse and create a prioritized topic tree

### 2. PYQ Analysis
- Go to **PYQ Analysis**
- Select a past paper PDF
- View difficulty analysis, trap zones, and question distribution

### 3. AI Notes Generation
- Visit **AI Notes** tab
- Enter Module Name and Topic
- Get trap-aware, high-yield study notes

### 4. Mock Tests
- Access **Mock Tests**
- Configure: Topic, Difficulty, Question Count
- Take CCEE-pattern tests with detailed explanations

## 🎨 UI Features

- **Cyber-Themed Dark Mode**: Professional futuristic aesthetic
- **Neon Accents**: Cyan/Purple/Red highlights
- **Smooth Animations**: Powered by Framer Motion
- **Keyboard Navigation**: Optimized for power users

## 📁 Project Structure

```
CCEE site/
├── client/              # React frontend
│   ├── src/
│   │   ├── pages/      # Main pages (Syllabus, PYQ, Notes, Mock)
│   │   ├── api.ts      # API client
│   │   └── App.tsx     # Main app component
│   └── tailwind.config.js
├── server/              # Express backend
│   ├── src/
│   │   ├── services/   # AI services (Gemini integration)
│   │   ├── controllers/
│   │   └── routes.ts
│   └── .env            # API keys (create this)
└── data/               # PDF storage
    ├── Syllabus/
    └── PYQ/
```

## ⚠️ Important Notes

1. **API Key Required**: The application will not work without a valid Gemini API key
2. **Local Storage**: All data processing happens locally; no cloud uploads
3. **PDF Requirements**: Clear, text-based PDFs work best for analysis

## 🐛 Troubleshooting

**Issue: Blank/Unstyled Page**
- Ensure `tailwindcss@^3` is installed
- Check that `postcss.config.js` exists in `client/`

**Issue: API 500 Errors**
- Verify `GEMINI_API_KEY` is set correctly in `server/.env`
- Restart the server after updating `.env`

**Issue: No PDF Files Listed**
- Check that PDFs are in `data/Syllabus/` or `data/PYQ/`
- Ensure file extensions are `.pdf`

## 📜 License

This project is built for educational purposes.

---

**Built with AI-powered intelligence for CCEE aspirants** 🎓
