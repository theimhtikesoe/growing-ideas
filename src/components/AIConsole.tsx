import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Terminal, Loader2, Music, Sparkles, Play, Pause, Download, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import NeonButton from './NeonButton';

interface GeneratedMusic {
  id: string;
  prompt: string;
  file_url: string;
  created_at: string;
}

const AIConsole = () => {
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState('System Ready...');
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedMusic, setSavedMusic] = useState<GeneratedMusic[]>([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Fetch saved music on mount
  useEffect(() => {
    fetchSavedMusic();
  }, []);

  const fetchSavedMusic = async () => {
    const { data, error } = await supabase
      .from('generated_music')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching music:', error);
      return;
    }

    setSavedMusic(data || []);
  };

  const generateMusic = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setStatus('>> Initializing MusicGen AI...');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-music`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (data.loading) {
          setStatus('>> Model warming up... Please wait 20-30 seconds and try again.');
          toast.info('AI model is loading. Please wait a moment and try again.');
        } else {
          throw new Error(data.error || 'Generation failed');
        }
        setIsGenerating(false);
        return;
      }

      setStatus('>> Generation Complete! Music saved to library.');
      toast.success('Music generated successfully!');
      
      // Refresh saved music list
      await fetchSavedMusic();
      
      // Auto-play the new track
      if (data.music?.file_url) {
        playMusic(data.music.id, data.music.file_url);
      }
      
      setPrompt('');
    } catch (error) {
      console.error('Error:', error);
      setStatus(`>> Error: ${error instanceof Error ? error.message : 'Generation failed'}`);
      toast.error('Failed to generate music');
    } finally {
      setIsGenerating(false);
    }
  };

  const playMusic = (id: string, url: string) => {
    // Stop current audio if playing
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }

    if (currentlyPlaying === id) {
      setCurrentlyPlaying(null);
      return;
    }

    const audio = new Audio(url);
    audio.onended = () => setCurrentlyPlaying(null);
    audio.play();
    setAudioElement(audio);
    setCurrentlyPlaying(id);
  };

  const stopMusic = () => {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }
    setCurrentlyPlaying(null);
  };

  const deleteMusic = async (id: string, filePath: string) => {
    // Stop if currently playing
    if (currentlyPlaying === id) {
      stopMusic();
    }

    const { error } = await supabase
      .from('generated_music')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete');
      return;
    }

    toast.success('Track deleted');
    await fetchSavedMusic();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="glass rounded-lg overflow-hidden border border-border">
        {/* Terminal Header */}
        <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/80" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <span className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <span className="flex items-center gap-2 text-xs text-muted-foreground ml-2">
            <Terminal className="w-3 h-3" />
            ai-audio-synth.exe
          </span>
        </div>

        {/* Terminal Body */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>Enter a prompt to generate AI music (Free API - may have rate limits)</span>
          </div>

          <div className="flex gap-2">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary">{'>'}</span>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && generateMusic()}
                placeholder="lo-fi beats, relaxing piano melody..."
                className="w-full bg-input border border-border rounded px-8 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-mono text-sm"
                disabled={isGenerating}
              />
            </div>
            <NeonButton
              onClick={generateMusic}
              disabled={isGenerating || !prompt.trim()}
              className="whitespace-nowrap"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'GENERATE'
              )}
            </NeonButton>
          </div>

          {/* Status Log */}
          <div className="bg-background/50 rounded p-4 border border-border/50 min-h-[60px]">
            <p className={`text-sm font-mono ${isGenerating ? 'text-primary' : 'text-muted-foreground'}`}>
              {status}
              {isGenerating && <span className="cursor-blink" />}
            </p>
          </div>

          {/* Saved Music Library */}
          {savedMusic.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
                <Music className="w-4 h-4" />
                Your Music Library
              </h4>
              <div className="max-h-[200px] overflow-y-auto space-y-2">
                {savedMusic.map((track) => (
                  <div
                    key={track.id}
                    className="flex items-center gap-3 p-3 bg-muted/30 rounded border border-border/50 hover:border-primary/50 transition-colors"
                  >
                    <button
                      onClick={() => playMusic(track.id, track.file_url)}
                      className="p-2 rounded-full bg-primary/20 hover:bg-primary/30 transition-colors"
                    >
                      {currentlyPlaying === track.id ? (
                        <Pause className="w-4 h-4 text-primary" />
                      ) : (
                        <Play className="w-4 h-4 text-primary" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{track.prompt}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(track.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <a
                        href={track.file_url}
                        download
                        className="p-2 rounded hover:bg-muted transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4 text-muted-foreground" />
                      </a>
                      <button
                        onClick={() => deleteMusic(track.id, track.file_url)}
                        className="p-2 rounded hover:bg-destructive/20 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info Notice */}
          <p className="text-xs text-muted-foreground text-center">
            🎵 Using Hugging Face MusicGen (Free tier - first request may take 20-30s to warm up)
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default AIConsole;
