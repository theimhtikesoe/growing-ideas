import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { prompt } = await req.json()

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log('Generating music for prompt:', prompt)

    // Use Hugging Face's free inference API for MusicGen
    const response = await fetch(
      'https://api-inference.huggingface.co/models/facebook/musicgen-small',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 256,
          }
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Hugging Face API error:', response.status, errorText)
      
      // Check if model is loading
      if (response.status === 503) {
        return new Response(
          JSON.stringify({ 
            error: 'Model is loading, please try again in a few seconds',
            loading: true 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 503 }
        )
      }
      
      throw new Error(`API error: ${response.status}`)
    }

    // Get the audio blob
    const audioBlob = await response.arrayBuffer()
    console.log('Generated audio size:', audioBlob.byteLength, 'bytes')

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Generate unique filename
    const fileName = `music_${Date.now()}_${Math.random().toString(36).substring(7)}.flac`
    const filePath = `generated/${fileName}`

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('music')
      .upload(filePath, audioBlob, {
        contentType: 'audio/flac',
        upsert: false
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      throw new Error(`Upload failed: ${uploadError.message}`)
    }

    console.log('Uploaded to storage:', filePath)

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('music')
      .getPublicUrl(filePath)

    const fileUrl = urlData.publicUrl

    // Save to database
    const { data: dbData, error: dbError } = await supabase
      .from('generated_music')
      .insert({
        prompt,
        file_path: filePath,
        file_url: fileUrl,
        duration_seconds: 5
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database insert error:', dbError)
      throw new Error(`Database error: ${dbError.message}`)
    }

    console.log('Saved to database:', dbData.id)

    return new Response(
      JSON.stringify({ 
        success: true,
        music: dbData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error generating music:', error)
    const message = error instanceof Error ? error.message : 'Failed to generate music'
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
