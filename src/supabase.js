import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lwzdkfwemrpejxqlzhgl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3emRrZndlbXJwZWp4cWx6aGdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1MDY3NjMsImV4cCI6MjA4MTA4Mjc2M30.IqQIVh4NC0khWxvPfjRg2vhR3oA1nk11tB5hyAIuazM'

export const supabase = createClient(supabaseUrl, supabaseKey)
