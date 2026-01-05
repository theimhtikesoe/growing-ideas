import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const KIE_API_BASE = 'https://api.kie.ai'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const action = url.searchParams.get('action') || 'generate'
    
    const kieApiKey = Deno.env.get('KIE_API_KEY')
    if (!kieApiKey) {
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // ACTION: Start generation
    if (action === 'generate') {
      const { prompt } = await req.json()
      if (!prompt) {
        return new Response(
          JSON.stringify({ error: 'Prompt is required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      console.log('Starting music generation for prompt:', prompt)

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
          callBackUrl: 'https://example.com/callback',
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

      return new Response(
        JSON.stringify({ 
          success: true,
          taskId: taskId,
          status: 'PENDING',
          prompt: prompt
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ACTION: Check status and finalize
    if (action === 'status') {
      const taskId = url.searchParams.get('taskId')
      const prompt = url.searchParams.get('prompt') || ''
      
      if (!taskId) {
        return new Response(
          JSON.stringify({ error: 'taskId is required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      console.log('Checking status for task:', taskId)

      const statusResponse = await fetch(
        `${KIE_API_BASE}/api/v1/generate/record-info?taskId=${taskId}`,
        {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${kieApiKey}` },
        }
      )

      if (!statusResponse.ok) {
        console.error('Status check error:', statusResponse.status)
        return new Response(
          JSON.stringify({ status: 'PENDING', taskId }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const statusData = await statusResponse.json()
      console.log('Status response:', JSON.stringify(statusData))

      if (statusData.code !== 200) {
        return new Response(
          JSON.stringify({ status: 'PENDING', taskId }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const status = statusData.data?.status
      
      if (status === 'FAILED') {
        return new Response(
          JSON.stringify({ status: 'FAILED', error: 'Music generation failed' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (status !== 'SUCCESS') {
        return new Response(
          JSON.stringify({ status: status || 'PENDING', taskId }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // SUCCESS - Download and save the music
      const sunoData = statusData.data.response?.sunoData?.[0]
      if (!sunoData?.audioUrl) {
        throw new Error('No audio URL in response')
      }

      console.log('Music generated, downloading from:', sunoData.audioUrl)

      const audioResponse = await fetch(sunoData.audioUrl)
      if (!audioResponse.ok) {
        throw new Error('Failed to download audio')
      }
      const audioBlob = await audioResponse.arrayBuffer()
      console.log('Downloaded audio size:', audioBlob.byteLength, 'bytes')

      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      const fileName = `music_${Date.now()}_${Math.random().toString(36).substring(7)}.mp3`
      const filePath = `generated/${fileName}`

      // Retry upload with exponential backoff for transient network errors
      let uploadError = null
      for (let attempt = 1; attempt <= 3; attempt++) {
        const { error } = await supabase.storage
          .from('music')
          .upload(filePath, audioBlob, {
            contentType: 'audio/mpeg',
            upsert: false
          })
        
        if (!error) {
          uploadError = null
          console.log(`Upload succeeded on attempt ${attempt}`)
          break
        }
        
        uploadError = error
        console.error(`Upload attempt ${attempt} failed:`, error.message)
        
        if (attempt < 3) {
          const delay = attempt * 1000 // 1s, 2s
          console.log(`Retrying in ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }

      if (uploadError) {
        console.error('Storage upload failed after retries:', uploadError)
        throw new Error(`Upload failed after 3 attempts: ${uploadError.message}`)
      }

      const { data: urlData } = supabase.storage
        .from('music')
        .getPublicUrl(filePath)

      const { data: dbData, error: dbError } = await supabase
        .from('generated_music')
        .insert({
          prompt: prompt,
          file_path: filePath,
          file_url: urlData.publicUrl,
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
          status: 'SUCCESS',
          music: dbData
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )

  } catch (error) {
    console.error('Error:', error)
    const message = error instanceof Error ? error.message : 'Failed to process request'
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
