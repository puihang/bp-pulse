const SHEET_ID = '1p35EWxhVcYYJurZWEO3yplFn3Lnbn9ERL6DP0UT0DHA';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

// Store the Apps Script Web App URL - user will set this after deployment
let APPS_SCRIPT_URL = localStorage.getItem('appsScriptUrl') || '';

export interface BloodPressureRecord {
  email: string;
  date: string;
  time: string;
  systolic: number;
  diastolic: number;
  pulse: number;
  rowIndex?: number;
}

export const setAppsScriptUrl = (url: string) => {
  APPS_SCRIPT_URL = url;
  localStorage.setItem('appsScriptUrl', url);
};

export const getAppsScriptUrl = () => APPS_SCRIPT_URL;

export const fetchRecords = async (): Promise<BloodPressureRecord[]> => {
  try {
    const response = await fetch(CSV_URL);
    const csvText = await response.text();
    const lines = csvText.split('\n').filter(line => line.trim());
    
    // Skip header row
    const records: BloodPressureRecord[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length >= 6) {
        records.push({
          email: values[0],
          date: values[1],
          time: values[2],
          systolic: parseInt(values[3]) || 0,
          diastolic: parseInt(values[4]) || 0,
          pulse: parseInt(values[5]) || 0,
          rowIndex: i + 1, // 1-based row index in sheet (accounting for header)
        });
      }
    }
    return records;
  } catch (error) {
    console.error('Error fetching records:', error);
    throw error;
  }
};

export const fetchRecordsByEmail = async (email: string): Promise<BloodPressureRecord[]> => {
  const allRecords = await fetchRecords();
  return allRecords.filter(r => r.email.toLowerCase() === email.toLowerCase());
};

export const addRecord = async (record: Omit<BloodPressureRecord, 'rowIndex'>): Promise<void> => {
  if (!APPS_SCRIPT_URL) {
    throw new Error('請先設定 Apps Script URL');
  }
  
  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'add',
      data: record,
    }),
  });
  
  // no-cors mode doesn't return readable response, assume success
};

export const updateRecord = async (rowIndex: number, record: Omit<BloodPressureRecord, 'rowIndex'>): Promise<void> => {
  if (!APPS_SCRIPT_URL) {
    throw new Error('請先設定 Apps Script URL');
  }
  
  await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'update',
      rowIndex,
      data: record,
    }),
  });
};

export const deleteRecord = async (rowIndex: number): Promise<void> => {
  if (!APPS_SCRIPT_URL) {
    throw new Error('請先設定 Apps Script URL');
  }
  
  await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'delete',
      rowIndex,
    }),
  });
};

// Helper to parse CSV line (handles quoted values)
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}
