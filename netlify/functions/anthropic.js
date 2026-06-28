// netlify/functions/gemini.js
exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const { system, user, max_tokens } = JSON.parse(event.body);

    if (!user) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing user prompt' })
      };
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'API key not configured' })
      };
    }

    // Usando o modelo correto: gemini-2.5-flash (disponível na v1beta)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: system ? `${system}\n\n${user}` : user }
              ]
            }
          ],
          generationConfig: {
            maxOutputTokens: max_tokens || 1000,
            temperature: 0.7
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini API Error:', data);
      return {
        statusCode: response.status,
        body: JSON.stringify({ 
          error: data.error?.message || 'Error calling Gemini API',
          details: data.error?.details
        })
      };
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!text) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'No response from Gemini' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ text })
    };

  } catch (error) {
    console.error('Function Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error', message: error.message })
    };
  }
};
