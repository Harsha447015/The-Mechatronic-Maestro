// /api/gemini-proxy.js

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { payload, systemInstruction, generationConfig } = await request.json();
    
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`;
    
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

    if (!geminiResponse.ok) {
        // Forward API error message
        return new Response(JSON.stringify(result), { status: geminiResponse.status });
    }

    // Safely extract and return the necessary data
    const candidate = result.candidates?.[0];
    const responseText = candidate?.content?.parts?.[0]?.text;
    
    // For the suggest button, we return the structured JSON directly
    if (generationConfig && generationConfig.responseMimeType === "application/json") {
         return new Response(responseText, { 
            status: 200, 
            headers: { 'Content-Type': 'application/json' } 
         });
    }

    // For text generation, return the text
    return new Response(responseText, { status: 200 });

  } catch (error) {
    console.error('Proxy Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}