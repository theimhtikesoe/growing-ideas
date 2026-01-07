import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are an AI Music Prompt Generator.

Your job is NOT to generate music.
Your job is to generate a HIGH-QUALITY, READY-TO-USE music generation prompt
that can be pasted directly into tools like Suno, Udio, or Stable Audio.

Rules:
- Output ONLY the music prompt text.
- No explanations, no markdown, no labels, no quotes around it.
- Use clear, vivid, professional music production language.
- Always include: genre, mood, tempo (BPM), instruments, rhythm, atmosphere, and emotional direction.
- Avoid copyrighted artist names.
- Describe sound texture, space, and progression.
- Keep it concise but comprehensive (2-4 sentences max).

Output Style Example:
A dreamy lo-fi hip hop track at 80 BPM, warm vinyl crackle, soft jazzy chords, mellow boom-bap drums, gentle sidechained bass, late-night city atmosphere, nostalgic and calm, smooth transitions, loop-friendly, instrumental only.

Now generate a new, unique music prompt based on the user input.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, style, lyrics } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build user input from provided fields
    const userInputParts = [];
    if (title) userInputParts.push(`Title: ${title}`);
    if (style) userInputParts.push(`Style: ${style}`);
    if (lyrics) userInputParts.push(`Lyrics/Mood: ${lyrics}`);
    
    const userInput = userInputParts.join('\n') || 'Create a unique and interesting track';

    console.log('Generating music prompt for:', userInput);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userInput }
        ],
        max_tokens: 300,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits insufficient. Please top up your Lovable AI credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const generatedPrompt = data.choices?.[0]?.message?.content?.trim();

    if (!generatedPrompt) {
      throw new Error("No prompt generated");
    }

    console.log('Generated prompt:', generatedPrompt);

    return new Response(JSON.stringify({ prompt: generatedPrompt }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error generating music prompt:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Failed to generate prompt" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
