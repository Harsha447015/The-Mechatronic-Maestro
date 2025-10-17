// /api/gemini-proxy.js

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Use a valid and current model name
const GEMINI_MODEL = 'gemini-1.5-flash-latest';

export default async function handler(request) {
  // 1. Add a check for the API key to provide a clearer error
  if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not set in environment variables.");
    return new Response(JSON.stringify({ error: 'Server configuration error: API key not found.' }), { status: 500 });
  }

  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { payload, systemInstruction, generationConfig } = await request.json();
    
    // 2. Use the corrected model name variable in the URL
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    
    const geminiResponse = await fetch(API_URL, {
      method: 'POST',
      headers: {  
        'Content-Type': 'application/json'  
      },
      body: JSON.stringify({  
          contents: payload.contents,
          systemInstruction: systemInstruction,
          generationConfig: generationConfig
      })
    });

    const result = await geminiResponse.json();

    // Forward the actual error from the Gemini API if the request wasn't successful
    if (!geminiResponse.ok) {
        console.error('Gemini API Error:', result);
        return new Response(JSON.stringify(result), { 
            status: geminiResponse.status,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const candidate = result.candidates?.[0];
    const responseText = candidate?.content?.parts?.[0]?.text;
    
    if (generationConfig && generationConfig.responseMimeType === "application/json") {
        return new Response(responseText, {  
          status: 200,  
          headers: { 'Content-Type': 'application/json' }  
        });
    }

    return new Response(responseText, { status: 200 });

  } catch (error) {
    console.error('Proxy Catch Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
