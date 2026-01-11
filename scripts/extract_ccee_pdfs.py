#!/usr/bin/env python3
"""
CCEE PDF MCQ Extractor v2 - Robust version with timeouts and incremental saving
"""

import os
import re
import json
from pathlib import Path
from datetime import datetime
from collections import defaultdict
import sys
import signal
import warnings

# Suppress PDF warnings
warnings.filterwarnings('ignore')

# Try to import PDF library
try:
    import pdfplumber
    PDF_LIBRARY = 'pdfplumber'
except ImportError:
    print("ERROR: Install pdfplumber: pip install pdfplumber")
    sys.exit(1)

# === Configuration ===
CCEE_PDF_DIR = Path(r"D:\CCEE site\data\ccee")
OUTPUT_DIR = Path(r"D:\CCEE site\client\public\data\ccee_extracted")
TIMEOUT_SECONDS = 30  # Max time per PDF

# Module mapping based on filename keywords
MODULE_KEYWORDS = {
    'dac_school_tg_oopj': ['java', 'oopj', 'core java', 'corejava', 'collection', 'stream', 'exception', 'thread', 'java 8', 'scjp'],
    'dac_school_tg_wbjp': ['advance java', 'advanced java', 'spring', 'hibernate', 'hibernet', 'servlet', 'jsp', 'jpa', 'jdbc'],
    'dac_school_tg_cpp': ['cpp', 'c++', 'cplusplus', 'c programming', 'c language'],
    'dac_school_tg_ms_dotnet': ['c#', 'csharp', 'dotnet', '.net', 'dot net', 'asp.net', 'msnet'],
    'dac_school_tg_ads': ['data structure', 'datastructure', 'dsa', 'ads', 'algorithm', 'sorting', 'linkedlist', 'tree', 'graph', 'stack', 'queue'],
    'dac_school_tg_dbt': ['database', 'dbms', 'dbt', 'sql', 'mysql', 'oracle', 'mongodb', 'plsql'],
    'dac_school_tg_cos_sdm': ['operating system', 'os ', ' os', 'linux', 'cpos', 'sdm', 'agile', 'devops', 'git', 'docker', 'software engineering'],
    'dac_school_tg_wpt': ['html', 'css', 'javascript', 'js ', 'jquery', 'react', 'nodejs', 'wpt', 'web programming', 'bootstrap', 'ajax', 'php'],
    'dac_school_aptitude': ['aptitude', 'average', 'percentage', 'time and work', 'profit', 'loss', 'ratio', 'blood relation', 'train', 'boat', 'hcf', 'lcm']
}

class TimeoutError(Exception):
    pass

def timeout_handler(signum, frame):
    raise TimeoutError("PDF processing timed out")

def extract_text_safe(pdf_path, max_pages=50):
    """Extract text from PDF with safety limits"""
    text = ""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for i, page in enumerate(pdf.pages[:max_pages]):
                try:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n\n"
                except:
                    continue
    except Exception as e:
        pass
    return text

def detect_module(filename):
    """Detect module based on filename keywords"""
    filename_lower = filename.lower()
    for module_id, keywords in MODULE_KEYWORDS.items():
        for keyword in keywords:
            if keyword in filename_lower:
                return module_id
    return 'unknown'

def parse_mcqs_simple(text, source_file):
    """Simple MCQ parser - looks for numbered questions with a/b/c/d options"""
    mcqs = []
    
    # Split by question numbers
    # Pattern: starts with number followed by . or ) or space
    parts = re.split(r'\n\s*(\d+)\s*[.)\s]', text)
    
    for i in range(1, len(parts) - 1, 2):
        try:
            q_num = parts[i]
            q_content = parts[i + 1] if i + 1 < len(parts) else ""
            
            # Look for 4 options
            opt_pattern = r'[aA][.)]\s*(.+?)\s*[bB][.)]\s*(.+?)\s*[cC][.)]\s*(.+?)\s*[dD][.)]\s*(.+?)(?:\n|$)'
            opt_match = re.search(opt_pattern, q_content, re.DOTALL)
            
            if opt_match:
                # Extract question text (before options)
                question_text = q_content[:opt_match.start()].strip()
                options = [opt_match.group(i).strip()[:200] for i in range(1, 5)]  # Limit option length
                
                if len(question_text) > 10 and all(len(o) > 0 for o in options):
                    # Look for answer
                    ans_match = re.search(r'(?:Answer|Ans)[.:\s]*([a-dA-D1-4])', q_content)
                    answer_idx = 0
                    if ans_match:
                        ans = ans_match.group(1).upper()
                        answer_idx = {'A': 0, 'B': 1, 'C': 2, 'D': 3, '1': 0, '2': 1, '3': 2, '4': 3}.get(ans, 0)
                    
                    # Check for code snippet
                    snippet = None
                    code_patterns = [r'```[\s\S]+?```', r'class\s+\w+\s*\{[\s\S]+?\}', r'public\s+\w+[\s\S]+?\}']
                    for pat in code_patterns:
                        code_match = re.search(pat, question_text)
                        if code_match:
                            snippet = code_match.group(0)[:500]  # Limit snippet length
                            break
                    
                    mcqs.append({
                        "id": str(len(mcqs) + 1),
                        "question": question_text[:1000],  # Limit question length
                        "options": options,
                        "correctAnswer": answer_idx,
                        "snippet": snippet,
                        "type": "OUTPUT" if snippet else "CONCEPTUAL",
                        "explanation": f"From {source_file}",
                        "source": "ccee_pdf"
                    })
        except:
            continue
    
    return mcqs

def process_pdfs():
    """Main function to process all PDFs"""
    print("=== CCEE PDF MCQ Extractor v2 ===")
    print(f"Source: {CCEE_PDF_DIR}")
    print(f"Output: {OUTPUT_DIR}")
    print()
    
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    # Get PDFs sorted by size (smaller first for faster initial results)
    pdf_files = sorted(CCEE_PDF_DIR.glob("*.pdf"), key=lambda p: p.stat().st_size)
    print(f"Found {len(pdf_files)} PDF files (sorted by size)")
    print()
    
    module_data = defaultdict(lambda: {"mcqs": [], "files": []})
    skipped = []
    
    for idx, pdf_path in enumerate(pdf_files, 1):
        size_mb = pdf_path.stat().st_size / (1024 * 1024)
        print(f"[{idx}/{len(pdf_files)}] {pdf_path.name} ({size_mb:.1f}MB)")
        
        # Skip very large files
        if size_mb > 20:
            print(f"  SKIP: Too large (>{20}MB)")
            skipped.append(pdf_path.name)
            continue
        
        module_id = detect_module(pdf_path.name)
        
        try:
            text = extract_text_safe(pdf_path)
            if not text or len(text) < 100:
                print(f"  SKIP: No text extracted")
                continue
            
            mcqs = parse_mcqs_simple(text, pdf_path.name)
            
            if mcqs:
                print(f"  OK: {len(mcqs)} MCQs -> {module_id}")
                module_data[module_id]["mcqs"].extend(mcqs)
                module_data[module_id]["files"].append(pdf_path.name)
            else:
                print(f"  WARN: No MCQs found")
                
        except Exception as e:
            print(f"  ERROR: {str(e)[:50]}")
            continue
        
        # Save incrementally every 50 PDFs
        if idx % 50 == 0:
            save_results(module_data)
            print(f"  [Saved checkpoint at {idx} PDFs]")
    
    # Final save
    save_results(module_data)
    
    print()
    print("=== FINAL SUMMARY ===")
    total = 0
    for mid, data in sorted(module_data.items()):
        count = len(data["mcqs"])
        total += count
        print(f"{mid}: {count} MCQs from {len(data['files'])} files")
    print(f"\nTotal: {total} MCQs extracted")
    print(f"Skipped: {len(skipped)} large files")

def save_results(module_data):
    """Save current results to JSON files"""
    for module_id, data in module_data.items():
        if not data["mcqs"]:
            continue
            
        mcqs_by_topic = defaultdict(list)
        for mcq in data["mcqs"]:
            topic = mcq.get("explanation", "General").replace("From ", "").replace(".pdf", "")[:50]
            mcqs_by_topic[topic].append(mcq)
        
        output_data = {
            "category": module_id.replace("dac_school_tg_", "").replace("dac_school_", ""),
            "module": module_id,
            "source": "ccee_pdfs",
            "totalMcqs": len(data["mcqs"]),
            "topicCount": len(mcqs_by_topic),
            "extractedAt": datetime.now().isoformat(),
            "mcqsByTopic": dict(mcqs_by_topic)
        }
        
        output_file = OUTPUT_DIR / f"{module_id}.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, indent=2, ensure_ascii=False)
    
    # Save index
    index_data = {
        "modules": {mid: {"mcqs": len(d["mcqs"]), "files": len(d["files"])} for mid, d in module_data.items() if d["mcqs"]},
        "totalMcqs": sum(len(d["mcqs"]) for d in module_data.values()),
        "extractedAt": datetime.now().isoformat()
    }
    with open(OUTPUT_DIR / "index.json", 'w', encoding='utf-8') as f:
        json.dump(index_data, f, indent=2)

if __name__ == "__main__":
    process_pdfs()
