const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SHEET_ID = '1p35EWxhVcYYJurZWEO3yplFn3Lnbn9ERL6DP0UT0DHA';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, email, data, rowIndex } = await req.json();

    if (action === 'fetch') {
      // Fetch all records for a specific email using CSV export
      const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;
      const response = await fetch(csvUrl);
      const csvText = await response.text();
      
      const lines = csvText.split('\n').filter(line => line.trim());
      const records = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length >= 6) {
          const recordEmail = values[0].trim().toLowerCase();
          if (!email || recordEmail === email.toLowerCase()) {
            records.push({
              email: values[0],
              date: values[1],
              time: values[2],
              systolic: parseInt(values[3]) || 0,
              diastolic: parseInt(values[4]) || 0,
              pulse: parseInt(values[5]) || 0,
              rowIndex: i + 1,
            });
          }
        }
      }
      
      return new Response(JSON.stringify({ success: true, records }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'add') {
      // Use Google Sheets API to append a row
      const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/A:F:append?valueInputOption=USER_ENTERED&key=${Deno.env.get('GOOGLE_API_KEY')}`;
      
      const response = await fetch(appendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          values: [[data.email, data.date, data.time, data.systolic, data.diastolic, data.pulse]]
        }),
      });
      
      if (!response.ok) {
        const error = await response.text();
        console.error('Google Sheets API error:', error);
        return new Response(JSON.stringify({ success: false, error: 'Failed to add record' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'update') {
      const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/A${rowIndex}:F${rowIndex}?valueInputOption=USER_ENTERED&key=${Deno.env.get('GOOGLE_API_KEY')}`;
      
      const response = await fetch(updateUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          values: [[data.email, data.date, data.time, data.systolic, data.diastolic, data.pulse]]
        }),
      });
      
      if (!response.ok) {
        const error = await response.text();
        console.error('Google Sheets API error:', error);
        return new Response(JSON.stringify({ success: false, error: 'Failed to update record' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'delete') {
      // For delete, we need to use batchUpdate which requires OAuth, so we'll clear the row instead
      const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/A${rowIndex}:F${rowIndex}:clear?key=${Deno.env.get('GOOGLE_API_KEY')}`;
      
      const response = await fetch(clearUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        const error = await response.text();
        console.error('Google Sheets API error:', error);
        return new Response(JSON.stringify({ success: false, error: 'Failed to delete record' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: false, error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

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
