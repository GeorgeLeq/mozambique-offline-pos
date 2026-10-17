import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const expoPushUrl = 'https://exp.host/--/api/v2/push/send';

serve(async (req) => {
  try {
    const payload = await req.json()
    const notification = payload.record

    // Initialize Supabase Client
    const supabaseClient = createClient(
      Deno.env.get('https://myitwyrowzzvrfjkbmti.supabase.co') ?? '',
      Deno.env.get('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15aXR3eXJvd3p6dnJmamtibXRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzgzODM0MywiZXhwIjoyMDg5NDE0MzQzfQ.mQmKPhYRLlpXk3v2zh6Z_LSLlPXAqiJ72s9MSkM4huY') ?? ''
    )

    // Fetch Device Tokens for the shop
    const { data: devices, error } = await supabaseClient
      .from('device_tokens')
      .select('token')
      .eq('shop_id', notification.shop_id)

    if (error) throw error

    if (!devices || devices.length === 0) {
      return new Response(JSON.stringify({ message: "No devices found" }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      })
    }

    // Construct Expo Push Messages
    const messages = devices.map(device => ({
      to: device.token,
      sound: 'default',
      title: notification.title,
      body: notification.message,
      data: { url: notification.action_url },
    }))

    // Send to Expo Push API
    const expoResponse = await fetch(expoPushUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    })

    const expoData = await expoResponse.json()

    return new Response(JSON.stringify({ success: true, data: expoData }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    })
  }
})
