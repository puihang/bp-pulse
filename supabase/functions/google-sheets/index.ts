import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SHEET_ID = '1rGf89L-MfZdNR1qT8s5DJxiStSfWh97K2D9xjp5OxKg';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, phone, data, rowIndex } = await req.json();
    console.log('Action:', action, 'Phone:', phone, 'RowIndex:', rowIndex);

    if (action === 'fetch') {
      // Fetch all records for a specific phone using CSV export (no auth needed for public sheet)
      const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;
      const response = await fetch(csvUrl);
      const csvText = await response.text();
      
      const lines = csvText.split('\n').filter(line => line.trim());
      const records = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length >= 6) {
          const recordPhone = values[0].trim();
          if (!phone || recordPhone === phone) {
            records.push({
              phone: values[0],
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

    // For write operations, use Google Apps Script web app
    const appsScriptUrl = Deno.env.get('GOOGLE_APPS_SCRIPT_URL');
    if (!appsScriptUrl) {
      console.error('GOOGLE_APPS_SCRIPT_URL not configured');
      return new Response(JSON.stringify({ success: false, error: 'Apps Script URL not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'add') {
      const response = await fetch(appsScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          data: [data.phone, data.date, data.time, data.systolic, data.diastolic, data.pulse]
        }),
      });
      
      const result = await response.json();
      console.log('Apps Script response:', result);
      
      if (!result.success) {
        return new Response(JSON.stringify({ success: false, error: result.error || 'Failed to add record' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'update') {
      const response = await fetch(appsScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          rowIndex: rowIndex,
          data: [data.phone, data.date, data.time, data.systolic, data.diastolic, data.pulse]
        }),
      });
      
      const result = await response.json();
      console.log('Apps Script response:', result);
      
      if (!result.success) {
        return new Response(JSON.stringify({ success: false, error: result.error || 'Failed to update record' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'delete') {
      const response = await fetch(appsScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          rowIndex: rowIndex
        }),
      });
      
      const result = await response.json();
      console.log('Apps Script response:', result);
      
      if (!result.success) {
        return new Response(JSON.stringify({ success: false, error: result.error || 'Failed to delete record' }), {
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
