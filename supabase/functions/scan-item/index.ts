// scan-item — the wardrobe scanning brain.
// POST { imageBase64: string, mediaType?: string } (authenticated)
// → structured garment JSON ready for one-tap confirm in the app.
//
// All AI calls live server-side (this function), never in the client:
// keys stay secret and per-tier cost metering happens here.
// Secrets: ANTHROPIC_API_KEY (supabase secrets set ANTHROPIC_API_KEY=...)

import { createClient } from 'jsr:@supabase/supabase-js@2';

const GARMENT_TOOL = {
  name: 'record_garment',
  description: 'Record the structured attributes of the photographed garment.',
  input_schema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Short shopper-style name, e.g. "Ivory linen shirt"' },
      category: { type: 'string', enum: ['top', 'bottom', 'dress', 'layer', 'shoe', 'accessory'] },
      subcategory: { type: 'string' },
      colors: { type: 'array', items: { type: 'string' }, description: 'Dominant then accent, hex' },
      pattern: { type: 'string' },
      fabric: { type: 'string', description: 'Best guess from texture' },
      breathability: { type: 'integer', minimum: 1, maximum: 5 },
      warmth: { type: 'integer', minimum: 1, maximum: 5 },
      formality: { type: 'integer', minimum: 1, maximum: 5 },
      coverage: {
        type: 'object',
        properties: {
          shoulders: { type: 'boolean' },
          knees: { type: 'boolean' },
        },
        required: ['shoulders', 'knees'],
      },
      style_tags: { type: 'array', items: { type: 'string' } },
      seasons: { type: 'array', items: { type: 'string', enum: ['spring', 'summer', 'fall', 'winter'] } },
    },
    required: ['name', 'category', 'colors', 'coverage', 'formality', 'breathability'],
  },
};

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST only' }), { status: 405 });
  }

  // Verify the caller is a signed-in user.
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
  );
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return new Response(JSON.stringify({ error: 'Not signed in' }), { status: 401 });
  }

  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!anthropicKey) {
    return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }), {
      status: 500,
    });
  }

  const { imageBase64, mediaType = 'image/jpeg' } = await req.json();
  if (!imageBase64) {
    return new Response(JSON.stringify({ error: 'imageBase64 required' }), { status: 400 });
  }

  const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      tools: [GARMENT_TOOL],
      tool_choice: { type: 'tool', name: 'record_garment' },
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: imageBase64 },
            },
            {
              type: 'text',
              text: 'Catalogue this garment for a travel-packing wardrobe. Coverage flags matter: shoulders covered means sleeves or high cut; knees covered means hem at or below the knee.',
            },
          ],
        },
      ],
    }),
  });

  if (!anthropicResponse.ok) {
    const detail = await anthropicResponse.text();
    return new Response(JSON.stringify({ error: 'Vision call failed', detail }), { status: 502 });
  }

  const message = await anthropicResponse.json();
  const toolUse = message.content?.find(
    (block: { type: string }) => block.type === 'tool_use'
  );
  if (!toolUse) {
    return new Response(JSON.stringify({ error: 'No structured result' }), { status: 502 });
  }

  return new Response(JSON.stringify({ garment: toolUse.input }), {
    headers: { 'content-type': 'application/json' },
  });
});
