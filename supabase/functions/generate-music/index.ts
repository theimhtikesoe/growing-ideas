import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const KIE_API_BASE = 'https://api.kie.ai'

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

    const kieApiKey = Deno.env.get('KIE_API_KEY')
    if (!kieApiKey) {
      console.error('KIE_API_KEY not configured')
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    console.log('Generating music for prompt:', prompt)

    // Step 1: Start music generation task
    const generateResponse = await fetch(`${KIE_API_BASE}/api/v1/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${kieApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        customMode: false,
        instrumental: true,
        model: 'V3_5',
      }),
    })

    if (!generateResponse.ok) {
      const errorText = await generateResponse.text()
      console.error('Kie API generate error:', generateResponse.status, errorText)
      throw new Error(`API error: ${generateResponse.status}`)
    }

    const generateData = await generateResponse.json()
    console.log('Generate response:', JSON.stringify(generateData))

    if (generateData.code !== 200) {
      throw new Error(generateData.msg || 'Failed to start generation')
    }

    const taskId = generateData.data.taskId
    console.log('Task ID:', taskId)

    // Step 2: Poll for completion (max 3 minutes)
    const maxAttempts = 36 // 36 * 5 seconds = 3 minutes
    let attempts = 0
    let taskData = null

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds
      attempts++

      console.log(`Polling attempt ${attempts}...`)

      const statusResponse = await fetch(
        `${KIE_API_BASE}/api/v1/generate/record-info?taskId=${taskId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${kieApiKey}`,
          },
        }
      )

      if (!statusResponse.ok) {
        console.error('Status check error:', statusResponse.status)
        continue
      }

      const statusData = await statusResponse.json()
      console.log('Status response:', JSON.stringify(statusData))

      if (statusData.code !== 200) {
        continue
      }

      const status = statusData.data?.status
      if (status === 'SUCCESS') {
        taskData = statusData.data
        break
      } else if (status === 'FAILED') {
        throw new Error('Music generation failed')
      }
      // Continue polling for PENDING, PROCESSING, etc.
    }

    if (!taskData) {
      throw new Error('Generation timed out')
    }

    // Get the first generated track
    const sunoData = taskData.response?.sunoData?.[0]
    if (!sunoData?.audioUrl) {
      throw new Error('No audio URL in response')
    }

    console.log('Music generated, downloading from:', sunoData.audioUrl)

    // Download the audio file
    const audioResponse = await fetch(sunoData.audioUrl)
    if (!audioResponse.ok) {
      throw new Error('Failed to download audio')
    }
    const audioBlob = await audioResponse.arrayBuffer()
    console.log('Downloaded audio size:', audioBlob.byteLength, 'bytes')

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Generate unique filename
    const fileName = `music_${Date.now()}_${Math.random().toString(36).substring(7)}.mp3`
    const filePath = `generated/${fileName}`

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('music')
      .upload(filePath, audioBlob, {
        contentType: 'audio/mpeg',
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
        duration_seconds: Math.round(sunoData.duration || 60)
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
