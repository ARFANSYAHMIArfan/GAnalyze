import { HistoryItem } from '../types';

/**
 * Parses double-quote-escaped CSV lines accurately without external heavy libraries
 */
export function parseCSVLines(csvText: string): string[][] {
  const result: string[][] = [];
  const lines = csvText.split(/\r?\n/);
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const row: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      const nextChar = line[j + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          j++; // skip escaped double quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(current.trim().replace(/^'|'$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current.trim().replace(/^'|'$/g, ''));
    result.push(row);
  }
  return result;
}

/**
 * Format a Date object into YYYY-MM-DD
 */
export function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format a Date object into HH:MM:SS
 */
export function formatTimeString(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Parse Google user history JSON file
 * Typically has "header" (product like YouTube, Search, Maps), "title" (searched or watched), "time" (ISO timestamp)
 */
export function parseGoogleJSON(jsonText: string): HistoryItem[] {
  try {
    let parsed = JSON.parse(jsonText);
    
    // Support nested arrays or direct arrays
    if (!Array.isArray(parsed)) {
      if (parsed.history && Array.isArray(parsed.history)) {
        parsed = parsed.history;
      } else if (parsed.events && Array.isArray(parsed.events)) {
        parsed = parsed.events;
      } else {
        // If it's a single object, wrap it
        parsed = [parsed];
      }
    }
    
    const items: HistoryItem[] = [];
    let orderCounter = 1;
    
    for (const item of parsed) {
      if (!item || typeof item !== 'object') continue;
      
      // Auto-detect fields
      const rawTitle = item.title || item.query || item.name || item.text || item.description || 'Unknown Action';
      
      // Keep only clean readable title without boilerplate prefixes (e.g., delete "Watched " from YouTube or "Searched for ")
      // But keep some context as a separate display if possible, or just parse elegantly
      let title = String(rawTitle).trim();
      
      const category = item.header || (item.products && item.products[0]) || item.category || item.product || 'Google Activity';
      
      // Extract time
      const timeStr = item.time || item.timestamp || item.date || item.created_at;
      let dateObj = new Date();
      if (timeStr) {
        const potentialDate = new Date(timeStr);
        if (!isNaN(potentialDate.getTime())) {
          dateObj = potentialDate;
        }
      }
      
      const id = item.id || `json-${orderCounter}-${Math.random().toString(36).substr(2, 6)}`;
      
      items.push({
        order: orderCounter++,
        id,
        date: formatDateString(dateObj),
        time: formatTimeString(dateObj),
        title,
        category: String(category),
        fileType: 'JSON',
        rawDate: dateObj,
      });
    }
    
    return items;
  } catch (err) {
    console.error('Error parsing JSON history:', err);
    throw new Error('Failed to parse the JSON file. Ensure it is a valid JSON array or object.');
  }
}

/**
 * Intelligent CSV Parser that maps columns dynamically
 */
export function parseGoogleCSV(csvText: string): HistoryItem[] {
  const parsedRows = parseCSVLines(csvText);
  if (parsedRows.length === 0) return [];
  
  const headers = parsedRows[0].map(h => h.toLowerCase());
  
  // Find column indices
  let titleIndex = -1;
  let dateIndex = -1;
  let timeIndex = -1;
  let categoryIndex = -1;
  let idIndex = -1;
  
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i];
    if (h.includes('title') || h.includes('query') || h.includes('search') || h.includes('name') || h === 'text') {
      titleIndex = i;
    } else if (h.includes('date') || h === 'day' || h.includes('timestamp')) {
      dateIndex = i;
    } else if (h.includes('time') || h === 'hour') {
      timeIndex = i;
    } else if (h.includes('category') || h.includes('product') || h.includes('header') || h.includes('source') || h === 'type') {
      categoryIndex = i;
    } else if (h.includes('id') || h === 'order' || h === 'no') {
      idIndex = i;
    }
  }
  
  // Fallbacks if header labels are missing or non-standard
  if (titleIndex === -1 && parsedRows[0].length > 0) {
    // Guess title is the longest column average or column 0/2
    titleIndex = 0;
  }
  
  const items: HistoryItem[] = [];
  let orderCounter = 1;
  
  // Start from line 1 (skipping header)
  for (let r = 1; r < parsedRows.length; r++) {
    const row = parsedRows[r];
    if (row.length === 0 || row.every(val => val === '')) continue;
    
    let title = titleIndex !== -1 && row[titleIndex] ? row[titleIndex] : 'Unnamed interaction';
    let category = categoryIndex !== -1 && row[categoryIndex] ? row[categoryIndex] : 'Google CSV';
    let fileId = idIndex !== -1 && row[idIndex] ? row[idIndex] : `csv-${orderCounter}-${Math.random().toString(36).substr(2, 6)}`;
    
    // Parse Dates
    let itemDate = '';
    let itemTime = '';
    let parsedDate = new Date();
    
    const rawDateVal = dateIndex !== -1 ? row[dateIndex] : '';
    const rawTimeVal = timeIndex !== -1 ? row[timeIndex] : '';
    
    if (rawDateVal) {
      // Try parsing full datetime or separate column
      const combined = rawTimeVal ? `${rawDateVal} ${rawTimeVal}` : rawDateVal;
      const parsedComb = new Date(combined);
      if (!isNaN(parsedComb.getTime())) {
        parsedDate = parsedComb;
        itemDate = formatDateString(parsedDate);
        itemTime = formatTimeString(parsedDate);
      } else {
        // Fallback to manual string values
        itemDate = rawDateVal;
        itemTime = rawTimeVal || '00:00:00';
      }
    } else {
      // No date column found, check other columns for date-like content or use current date-offset
      let foundDate = false;
      for (const col of row) {
        if (col && col.includes('-') && !isNaN(Date.parse(col))) {
          parsedDate = new Date(col);
          itemDate = formatDateString(parsedDate);
          itemTime = formatTimeString(parsedDate);
          foundDate = true;
          break;
        }
      }
      if (!foundDate) {
        // Fallback relative to today
        parsedDate = new Date(Date.now() - (r * 10 * 60 * 1000)); // offset events by 10 minutes
        itemDate = formatDateString(parsedDate);
        itemTime = formatTimeString(parsedDate);
      }
    }
    
    items.push({
      order: orderCounter++,
      id: fileId,
      date: itemDate,
      time: itemTime,
      title,
      category,
      fileType: 'CSV',
      rawDate: parsedDate,
    });
  }
  
  return items;
}

/**
 * Generate highly realistic, beautiful mock data for immediate user playground
 */
export interface ThreatAssessment {
  riskType: 'ADULT_OUTLET' | 'SCAM_HAZARD' | 'NONE';
  severity: 'HIGH' | 'MEDIUM' | 'NONE';
  label: string;
  matchedTerm: string;
  recodeAdvice: string;
}

export function assessItemThreat(title: string): ThreatAssessment {
  const norm = title.toLowerCase();
  
  // Adult / Mature keywords
  const adultKeywords = [
    '18+', 'xxx', 'porn', 'nsfw', 'onlyfans', 'dating site', 'tinder', 'uncensored', 'nude', 
    'escort', 'sexy chat', 'chaturbate', 'cam girl', 'casino online', 'free chips gambling', 'betting pool'
  ];
  
  // Scam or dangerous link keywords
  const scamKeywords = [
    'free money claim', 'winner of standard prize', 'congratulations claim prize', 'earn $10000 free', 
    'lottery award payout', 'cracked generator bypass', 'keygen crack download', 'key generator bypass',
    'system is infected click', 'alert check bank credential', 'verify now security lock', 
    'urgent banking validation alert', 'free gift card code giveaway', 'double your bitcoin now'
  ];

  for (const keyword of adultKeywords) {
    if (norm.includes(keyword)) {
      return {
        riskType: 'ADULT_OUTLET',
        severity: 'HIGH',
        label: 'Sensitive / Adult Exposure Risk',
        matchedTerm: keyword,
        recodeAdvice: 'Recommended to clear this search from your active Google MyActivity console and review age restrictions or general profile sharing settings.'
      };
    }
  }

  for (const keyword of scamKeywords) {
    if (norm.includes(keyword)) {
      return {
        riskType: 'SCAM_HAZARD',
        severity: 'HIGH',
        label: 'Scam, Fraud, or Dangerous Target',
        matchedTerm: keyword,
        recodeAdvice: 'Verify that you did not download unknown execution software or share standard credentials on suspicious redirect portals. Run a computer safety malware check.'
      };
    }
  }

  return {
    riskType: 'NONE',
    severity: 'NONE',
    label: 'Clean / Standard Activity',
    matchedTerm: '',
    recodeAdvice: ''
  };
}

export function generateSampleData(format: 'JSON' | 'CSV'): HistoryItem[] {
  const activities = [
    { title: 'Searched for React 19 server actions vs hooks', category: 'Google Search' },
    { title: 'Watched Master Tailwind CSS in 20 Minutes', category: 'YouTube' },
    { title: 'Searched for best local coffee shops with wifi', category: 'Google Search' },
    { title: 'Used Google Maps Directions: Seattle Capitol Hill to Downtown', category: 'Google Maps' },
    { title: 'Watched Lo-Fi Coding Beats to Study/Relax', category: 'YouTube' },
    { title: 'Searched for how to parse CSV cleanly in browser', category: 'Google Search' },
    { title: 'Searched for lucide react icons set preview', category: 'Google Search' },
    { title: 'Watched Build a SaaS App from scratch - Part 1', category: 'YouTube' },
    { title: 'Opened document: Product Design System v1.2', category: 'Google Drive' },
    { title: 'Modified slides: Q3 Marketing QBR Presentation', category: 'Google Slides' },
    { title: 'Watched Tech Lead Day in the Life vlog', category: 'YouTube' },
    { title: 'Searched for flights to Tokyo, Japan autumn deal', category: 'Google Flights' },
    { title: 'Added location pinned: Tokyo Metropolitan Gym', category: 'Google Maps' },
    { title: 'Web Search: developer-first design trends 2026', category: 'Google Search' },
    { title: 'Watched Advanced TypeScript Patterns and Enums', category: 'YouTube' },
    { title: 'Checked weather forecast next 10 days', category: 'Google Search' },
    { title: 'Opened Spreadsheet: Q2 Engineering Expenses', category: 'Google Sheets' },
    { title: 'Searched for Gemini Flash vs Gemini Pro model speed', category: 'Google Search' },
    { title: 'Watched YouTube Shorts: Keyboard shortcuts for coding', category: 'YouTube' },
    { title: 'Used Voice Assistant: "Set a coder focus timer for 30 minutes"', category: 'Google Assistant' },
    { title: 'Searched for Figma to React tailwind component converter', category: 'Google Search' },
    { title: 'Watched AI Coding Agents are taking over? Deep dive', category: 'YouTube' },
    
    // Add realistic warning cues for Risk analysis demo!
    { title: 'Searched for free mature dating site with uncensored webcam chat', category: 'Google Search' },
    { title: 'Searched for onlyfans free account bypass generator hack', category: 'Google Search' },
    { title: 'Watched watch hot 18+ streaming adult videos online', category: 'YouTube' },
    { title: 'Searched for virtual casino online free chips gambling bets', category: 'Google Search' },
    { title: 'Clicked link: congratulations claim prize reward free gift card code giveaway', category: 'Google Search' },
    { title: 'Searched for keygen crack download or key generator bypass', category: 'Google Search' },
    { title: 'Clicked suspicious redirection: system is infected click now to secure', category: 'Chrome' },
    { title: 'Searched for how to double your bitcoin now instantly', category: 'Google Search' },
    { title: 'Clicked alert: urgent banking validation alert verify now security lock', category: 'Google Search' },
  ];

  const parsedItems: HistoryItem[] = [];
  const baseTimestamp = new Date(); // Start around current time
  baseTimestamp.setDate(baseTimestamp.getDate() - 14); // offset 14 days ago for a nice range

  let orderCount = 1;

  for (let i = 0; i < 150; i++) {
    // Select activity randomly
    const activity = activities[Math.floor(Math.random() * activities.length)];
    
    // Spread events over past 14 days
    const eventTime = new Date(baseTimestamp.getTime());
    // Add random hours, minutes, seconds
    const daysOffset = Math.floor(Math.random() * 15);
    const hoursOffset = Math.floor(Math.random() * 24);
    const minutesOffset = Math.floor(Math.random() * 60);
    
    eventTime.setDate(eventTime.getDate() + daysOffset);
    eventTime.setHours(hoursOffset, minutesOffset, Math.floor(Math.random() * 60));
    
    // Modify search titles with random variations to look authentic
    let finalTitle = activity.title;
    if (activity.category === 'Google Search') {
      const queryAdditions = ['', ' reddit', ' github', ' stackoverflow', ' tutorial', ' 2026'];
      finalTitle += queryAdditions[Math.floor(Math.random() * queryAdditions.length)];
    }

    parsedItems.push({
      order: orderCount++,
      id: `sample-${format.toLowerCase()}-${orderCount}-${Math.random().toString(36).substr(2, 4)}`,
      date: formatDateString(eventTime),
      time: formatTimeString(eventTime),
      title: finalTitle,
      category: activity.category,
      fileType: format,
      rawDate: eventTime,
    });
  }

  // Sort by date/time descending to look like standard Takeout sequence
  return parsedItems.sort((a, b) => (b.rawDate?.getTime() || 0) - (a.rawDate?.getTime() || 0));
}
