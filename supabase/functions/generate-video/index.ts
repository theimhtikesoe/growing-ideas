import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { thumbnailUrl, musicUrl, prompt, title } = await req.json();

    if (!thumbnailUrl) {
      return new Response(
        JSON.stringify({ error: "Thumbnail URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating video frames for:", title || "Music Video");
    console.log("Using thumbnail:", thumbnailUrl);
    console.log("Prompt:", prompt);

    // Generate multiple frame variations using Gemini image generation
    const frames: string[] = [];
    const framePrompts = [
      `${prompt || 'Music video frame'} - opening scene, dramatic entrance, ${title || 'music'} vibes`,
      `${prompt || 'Music video frame'} - energy building, dynamic movement, colorful effects`,
      `${prompt || 'Music video frame'} - climax moment, peak intensity, stunning visuals`,
      `${prompt || 'Music video frame'} - smooth transition, flowing elements, rhythm visualization`,
      `${prompt || 'Music video frame'} - closing scene, memorable finale, artistic composition`,
    ];

    // Generate frames in parallel for speed
    const framePromises = framePrompts.map(async (framePrompt, index) => {
      try {
        console.log(`Generating frame ${index + 1}...`);
        
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image-preview",
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: `Transform this image into a music video frame: ${framePrompt}. Keep the style consistent but add dynamic movement and energy. Make it look like a frame from a professional music video. Aspect ratio 16:9 for YouTube/TikTok.`
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: thumbnailUrl
                    }
                  }
                ]
              }
            ],
            modalities: ["image", "text"]
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Frame ${index + 1} error:`, errorText);
          
          if (response.status === 429) {
            return { index, error: "rate_limit" };
          }
          if (response.status === 402) {
            return { index, error: "payment_required" };
          }
          return { index, error: "generation_failed" };
        }

        const data = await response.json();
        const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        
        if (imageUrl) {
          console.log(`Frame ${index + 1} generated successfully`);
          return { index, imageUrl };
        } else {
          console.log(`Frame ${index + 1} - no image in response, using thumbnail`);
          return { index, imageUrl: thumbnailUrl };
        }
      } catch (err) {
        console.error(`Frame ${index + 1} generation error:`, err);
        return { index, imageUrl: thumbnailUrl };
      }
    });

    const results = await Promise.all(framePromises);
    
    // Check for rate limit or payment errors
    const rateLimitError = results.find(r => r.error === "rate_limit");
    if (rateLimitError) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const paymentError = results.find(r => r.error === "payment_required");
    if (paymentError) {
      return new Response(
        JSON.stringify({ error: "Payment required. Please add credits to your Lovable workspace." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sort by index and extract URLs
    const sortedFrames = results
      .filter(r => r.imageUrl)
      .sort((a, b) => a.index - b.index)
      .map(r => r.imageUrl);

    // Always include thumbnail as first frame if we have it
    if (thumbnailUrl && (sortedFrames.length === 0 || sortedFrames[0] !== thumbnailUrl)) {
      sortedFrames.unshift(thumbnailUrl);
    }

    console.log(`Generated ${sortedFrames.length} frames total`);

    return new Response(
      JSON.stringify({
        success: true,
        frames: sortedFrames,
        musicUrl,
        title: title || "Music Video",
        message: `Generated ${sortedFrames.length} video frames`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Video generation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Video generation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
