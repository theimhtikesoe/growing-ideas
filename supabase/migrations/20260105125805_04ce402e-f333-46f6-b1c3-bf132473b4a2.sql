-- Create table for storing generated music
CREATE TABLE public.generated_music (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  prompt TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  duration_seconds INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.generated_music ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view all generated music (public gallery)
CREATE POLICY "Anyone can view generated music" 
ON public.generated_music 
FOR SELECT 
USING (true);

-- Allow anyone to insert music (no auth required for demo)
CREATE POLICY "Anyone can create music" 
ON public.generated_music 
FOR INSERT 
WITH CHECK (true);

-- Create storage bucket for music files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('music', 'music', true);

-- Allow public access to music files
CREATE POLICY "Public music access" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'music');

-- Allow anyone to upload music
CREATE POLICY "Anyone can upload music" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'music');