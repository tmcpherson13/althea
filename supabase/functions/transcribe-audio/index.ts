// transcribe-audio — turn a journal voice note into text.
// POST { path: string }  (authenticated; path must be the caller's own)
// → { configured: true, text } on success
// → { configured: false, message } when no speech-to-text key is set yet
//
// Like scan-item, all AI calls stay server-side. The audio lives in the
// private `journal` bucket; we download it with the service role after
// verifying the path belongs to the signed-in user, then send it to Whisper.
// Secret: OPENAI_API_KEY (supabase secrets set OPENAI_API_KEY=...)

import { createClient } from 'jsr:@supabase/supabase-js@2';

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
  const userId = userData.user.id;

  const { path } = await req.json();
  if (!path || typeof path !== 'string') {
    return new Response(JSON.stringify({ error: 'path required' }), { status: 400 });
  }
  // Journal media is stored under `${userId}/...` — reject anything else.
  if (!path.startsWith(`${userId}/`)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }

  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiKey) {
    return new Response(
      JSON.stringify({
        configured: false,
        message:
          'Voice-note transcription needs an OPENAI_API_KEY on the Supabase project. Your recording is saved and playable — set the key to enable transcripts.',
      }),
      { headers: { 'content-type': 'application/json' } }
    );
  }

  // Download the private recording with the service role.
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  const { data: file, error: dlError } = await admin.storage.from('journal').download(path);
  if (dlError || !file) {
    return new Response(JSON.stringify({ error: 'Could not read recording' }), { status: 404 });
  }

  const form = new FormData();
  form.append('file', file, path.split('/').pop() ?? 'audio.m4a');
  form.append('model', 'whisper-1');

  const resp = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${openaiKey}` },
    body: form,
  });
  if (!resp.ok) {
    const detail = await resp.text();
    return new Response(JSON.stringify({ error: 'Transcription failed', detail }), { status: 502 });
  }

  const result = await resp.json();
  return new Response(JSON.stringify({ configured: true, text: result.text ?? '' }), {
    headers: { 'content-type': 'application/json' },
  });
});
