/**
 * Sanfoundry MCQ Scraper for CCEE Exam Prep
 * 
 * Scrapes MCQs from Sanfoundry for .NET and WPT modules
 * Run: node scripts/sanfoundryScraper.js
 * 
 * Prerequisites: npm install puppeteer
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Target categories to scrape
const CATEGORIES = [
  {
    name: 'csharp',
    module: 'dac_school_tg_ms_dotnet',
    indexUrl: 'https://www.sanfoundry.com/1000-csharp-questions-answers/',
    urlPattern: 'csharp'
  },
  {
    name: 'html',
    module: 'dac_school_tg_wpt',
    indexUrl: 'https://www.sanfoundry.com/1000-html-questions-answers/',
    urlPattern: 'html'
  },
  {
    name: 'css',
    module: 'dac_school_tg_wpt',
    indexUrl: 'https://www.sanfoundry.com/1000-css-questions-answers/',
    urlPattern: 'css'
  },
  {
    name: 'javascript',
    module: 'dac_school_tg_wpt',
    indexUrl: 'https://www.sanfoundry.com/1000-javascript-questions-answers/',
    urlPattern: 'javascript'
  }
];

const OUTPUT_DIR = path.join(__dirname, '../client/public/data/sanfoundry');
const DELAY_MS = 2000; // Delay between requests to be respectful

/**
 * Sleep helper
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Extract topic URLs from a category index page
 */
async function extractTopicUrls(page, indexUrl, urlPattern) {
  console.log(`📋 Fetching topic list from: ${indexUrl}`);
  await page.goto(indexUrl, { waitUntil: 'networkidle2', timeout: 60000 });
  
  const topics = await page.evaluate((pattern) => {
    const content = document.querySelector('.entry-content');
    if (!content) return [];
    
    const links = Array.from(content.querySelectorAll('a'));
    const results = [];
    const urls = new Set();
    
    for (const link of links) {
      const href = link.href;
      const text = link.innerText.trim();
      
      if (
        href.includes('sanfoundry.com/') &&
        href.includes(pattern) &&
        !href.includes('/1000-') &&
        !href.includes('certification') &&
        !href.includes('internship') &&
        text.length > 0 &&
        text.length < 100 &&
        !text.includes('Sanfoundry') &&
        !text.includes('LinkedIn') &&
        !text.includes('Youtube')
      ) {
        if (!urls.has(href)) {
          urls.add(href);
          results.push({ url: href, topic: text });
        }
      }
    }
    
    return results;
  }, urlPattern);
  
  console.log(`✅ Found ${topics.length} topics`);
  return topics;
}

/**
 * Extract MCQs from a single topic page
 * Sanfoundry structure: Question + options in single paragraph, answer in sibling div
 */
async function extractMcqsFromPage(page, topicUrl, topicName) {
  console.log(`📄 Scraping: ${topicName}`);
  
  try {
    await page.goto(topicUrl, { waitUntil: 'networkidle2', timeout: 60000 });
    
    // Click all "View Answer" buttons to reveal answers
    await page.evaluate(() => {
      const buttons = document.querySelectorAll('.collapseomatic');
      buttons.forEach(btn => btn.click());
    });
    
    // Wait for answers to be revealed
    await sleep(500);
    
    // Extract questions using improved parsing
    const mcqs = await page.evaluate((topic) => {
      const content = document.querySelector('.entry-content');
      if (!content) return [];
      
      const questions = [];
      
      // Find all View Answer buttons and work backwards to find the question
      const viewAnswerSpans = document.querySelectorAll('span.collapseomatic');
      
      viewAnswerSpans.forEach((span, idx) => {
        if (!span.innerText.includes('View Answer')) return;
        
        // The question paragraph is usually the one containing this span or right before it
        let p = span.closest('p');
        if (!p) {
          p = span.parentElement;
          while (p && p.tagName !== 'P') {
            p = p.previousElementSibling;
          }
        }
        if (!p) return;
        
        const text = p.innerText.trim();
        
        // Extract question number and text
        const qMatch = text.match(/^(\d+)\.\s*([\s\S]*)/);
        if (!qMatch) return;
        
        const qNum = parseInt(qMatch[1]);
        const fullContent = qMatch[2];
        
        // Split by options a) b) c) d) - they're often on the same line or separated by newlines
        // Look for patterns like "a)" or "a." or "(a)"
        const optionSplit = fullContent.split(/(?:\n|\s)(?=[a-d]\))/i);
        
        if (optionSplit.length < 2) {
          // Try splitting differently - sometimes options are in the text with line breaks
          const lines = fullContent.split('\n');
          let questionText = '';
          let options = [];
          
          for (const line of lines) {
            const trimmed = line.trim();
            const optMatch = trimmed.match(/^([a-d])\)\s*(.+)/i);
            if (optMatch) {
              options.push(optMatch[2].trim());
            } else if (options.length === 0) {
              questionText += (questionText ? ' ' : '') + trimmed;
            }
          }
          
          if (options.length >= 4) {
            // Find the answer div (next sibling after span)
            let answerDiv = span.nextElementSibling;
            if (!answerDiv || !answerDiv.classList.contains('collapseomatic_content')) {
              answerDiv = span.parentElement?.nextElementSibling;
            }
            
            let correctAnswer = 0;
            let explanation = '';
            
            if (answerDiv && answerDiv.classList.contains('collapseomatic_content')) {
              const ansText = answerDiv.innerText;
              const ansMatch = ansText.match(/Answer:\s*([a-d])/i);
              if (ansMatch) {
                correctAnswer = ansMatch[1].toLowerCase().charCodeAt(0) - 97;
              }
              const expMatch = ansText.match(/Explanation:\s*([\s\S]*?)(?:$|Sanfoundry)/i);
              if (expMatch) {
                explanation = expMatch[1].trim();
              }
            }
            
            questions.push({
              id: qNum.toString(),
              topic: topic,
              question: questionText.replace(/View Answer.*$/i, '').trim(),
              options: options.slice(0, 4),
              correctAnswer,
              explanation,
              type: 'CONCEPTUAL'
            });
          }
        } else {
          // Original split worked
          const questionText = optionSplit[0].split('\n')[0].trim();
          const options = [];
          
          for (let i = 1; i < optionSplit.length && options.length < 4; i++) {
            const opt = optionSplit[i].split('\n')[0].replace(/^[a-d]\)\s*/i, '').trim();
            if (opt) options.push(opt);
          }
          
          if (options.length >= 4) {
            // Find answer div
            let answerDiv = span.nextElementSibling;
            if (!answerDiv || !answerDiv.classList.contains('collapseomatic_content')) {
              answerDiv = span.parentElement?.nextElementSibling;
            }
            
            let correctAnswer = 0;
            let explanation = '';
            
            if (answerDiv && answerDiv.classList.contains('collapseomatic_content')) {
              const ansText = answerDiv.innerText;
              const ansMatch = ansText.match(/Answer:\s*([a-d])/i);
              if (ansMatch) {
                correctAnswer = ansMatch[1].toLowerCase().charCodeAt(0) - 97;
              }
              const expMatch = ansText.match(/Explanation:\s*([\s\S]*?)(?:$|Sanfoundry)/i);
              if (expMatch) {
                explanation = expMatch[1].trim();
              }
            }
            
            questions.push({
              id: qNum.toString(),
              topic: topic,
              question: questionText.replace(/View Answer.*$/i, '').trim(),
              options: options.slice(0, 4),
              correctAnswer,
              explanation,
              type: 'CONCEPTUAL'
            });
          }
        }
      });
      
      return questions;
    }, topicName);
    
    console.log(`   ✅ Extracted ${mcqs.length} MCQs`);
    return mcqs;
    
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}`);
    return [];
  }
}

/**
 * Scrape entire category
 */
async function scrapeCategory(browser, category) {
  const page = await browser.newPage();
  
  // Set user agent to avoid blocking
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🎯 SCRAPING: ${category.name.toUpperCase()}`);
  console.log(`${'='.repeat(60)}`);
  
  // Get all topic URLs
  const topics = await extractTopicUrls(page, category.indexUrl, category.urlPattern);
  
  const allMcqs = [];
  const mcqsByTopic = {};
  
  // Scrape each topic
  for (let i = 0; i < topics.length; i++) {
    const { url, topic } = topics[i];
    console.log(`\n[${i + 1}/${topics.length}] ${topic}`);
    
    const mcqs = await extractMcqsFromPage(page, url, topic);
    
    if (mcqs.length > 0) {
      allMcqs.push(...mcqs);
      mcqsByTopic[topic] = mcqs;
    }
    
    // Respectful delay
    await sleep(DELAY_MS);
  }
  
  await page.close();
  
  return { allMcqs, mcqsByTopic, topicCount: topics.length };
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Sanfoundry MCQ Scraper');
  console.log('========================\n');
  
  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const allResults = {};
  
  try {
    for (const category of CATEGORIES) {
      const result = await scrapeCategory(browser, category);
      
      // Save category data
      const outputFile = path.join(OUTPUT_DIR, `${category.name}.json`);
      fs.writeFileSync(outputFile, JSON.stringify({
        category: category.name,
        module: category.module,
        topicCount: result.topicCount,
        totalMcqs: result.allMcqs.length,
        mcqsByTopic: result.mcqsByTopic,
        scrapedAt: new Date().toISOString()
      }, null, 2));
      
      console.log(`\n💾 Saved ${result.allMcqs.length} MCQs to ${outputFile}`);
      
      allResults[category.name] = {
        topics: result.topicCount,
        mcqs: result.allMcqs.length
      };
    }
    
    // Save summary
    const summaryFile = path.join(OUTPUT_DIR, 'index.json');
    fs.writeFileSync(summaryFile, JSON.stringify({
      categories: allResults,
      totalMcqs: Object.values(allResults).reduce((sum, r) => sum + r.mcqs, 0),
      scrapedAt: new Date().toISOString()
    }, null, 2));
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ SCRAPING COMPLETE');
    console.log('='.repeat(60));
    console.log('\nSummary:');
    for (const [name, data] of Object.entries(allResults)) {
      console.log(`  ${name}: ${data.topics} topics, ${data.mcqs} MCQs`);
    }
    console.log(`\nTotal: ${Object.values(allResults).reduce((sum, r) => sum + r.mcqs, 0)} MCQs`);
    
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
