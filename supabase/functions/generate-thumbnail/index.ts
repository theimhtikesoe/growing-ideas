import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { prompt, title, style } = await req.json()
    
    if (!prompt && !title) {
      return new Response(
        JSON.stringify({ error: 'Prompt or title is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')
    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Build a rich prompt for YouTube thumbnail
    const thumbnailPrompt = prompt || `YouTube music video thumbnail for a song titled "${title}". Style: ${style || 'modern and vibrant'}. High quality, eye-catching, professional music thumbnail with bold visuals and atmospheric lighting. 16:9 aspect ratio.`

    console.log('Generating thumbnail with prompt:', thumbnailPrompt)

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: thumbnailPrompt
          }
        ],
        modalities: ['image', 'text']
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('AI Gateway error:', response.status, errorText)
      throw new Error(`AI generation failed: ${response.status}`)
    }

    const data = await response.json()
    console.log('AI response received')

    const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url
    if (!imageData) {
      throw new Error('No image generated')
    }

    // Upload to Supabase Storage
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Convert base64 to binary
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '')
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))

    const fileName = `thumbnail_${Date.now()}_${Math.random().toString(36).substring(7)}.png`
    const filePath = `thumbnails/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('music')
      .upload(filePath, binaryData, {
        contentType: 'image/png',
        upsert: false
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      throw new Error(`Upload failed: ${uploadError.message}`)
    }

    const { data: urlData } = supabase.storage
      .from('music')
      .getPublicUrl(filePath)

    console.log('Thumbnail saved:', urlData.publicUrl)

    return new Response(
      JSON.stringify({ 
        success: true,
        imageUrl: urlData.publicUrl,
        filePath: filePath
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    const message = error instanceof Error ? error.message : 'Failed to generate thumbnail'
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
