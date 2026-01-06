-- Add DELETE policy for generated_music table
CREATE POLICY "Anyone can delete music" 
ON public.generated_music 
FOR DELETE 
USING (true);