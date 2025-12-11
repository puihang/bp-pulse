import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SHEET_ID = '1p35EWxhVcYYJurZWEO3yplFn3Lnbn9ERL6DP0UT0DHA';

// Create JWT for Google Service Account authentication
async function createJWT(serviceAccount: { client_email: string; private_key: string }) {
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const encoder = new TextEncoder();
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const signatureInput = `${headerB64}.${payloadB64}`;

  // Import the private key
  const pemContents = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '');
  
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(signatureInput)
  );

  const signatureB64 = arrayBufferToBase64Url(signature);
  return `${signatureInput}.${signatureB64}`;
}

function base64UrlEncode(str: string): string {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Get access token using service account
async function getAccessToken(): Promise<string> {
  const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT');
  if (!serviceAccountJson) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT secret not configured');
  }
  
  const serviceAccount = JSON.parse(serviceAccountJson);
  const jwt = await createJWT(serviceAccount);
  
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    console.error('Token exchange error:', error);
    throw new Error('Failed to get access token');
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, email, data, rowIndex } = await req.json();
    console.log('Action:', action, 'Email:', email);

    if (action === 'fetch') {
      // Fetch all records for a specific email using CSV export (no auth needed for public sheet)
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

    // For write operations, get access token
    const accessToken = await getAccessToken();
    const authHeaders = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    if (action === 'add') {
      const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/A:F:append?valueInputOption=USER_ENTERED`;
      
      const response = await fetch(appendUrl, {
        method: 'POST',
        headers: authHeaders,
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
      
      console.log('Record added successfully');
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'update') {
      const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/A${rowIndex}:F${rowIndex}?valueInputOption=USER_ENTERED`;
      
      const response = await fetch(updateUrl, {
        method: 'PUT',
        headers: authHeaders,
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
      
      console.log('Record updated successfully');
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'delete') {
      const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/A${rowIndex}:F${rowIndex}:clear`;
      
      const response = await fetch(clearUrl, {
        method: 'POST',
        headers: authHeaders,
      });
      
      if (!response.ok) {
        const error = await response.text();
        console.error('Google Sheets API error:', error);
        return new Response(JSON.stringify({ success: false, error: 'Failed to delete record' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      console.log('Record deleted successfully');
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
