import { useState, useEffect, useRef } from 'react';
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

type GenerationStatus = 'idle' | 'starting' | 'pending' | 'processing' | 'success' | 'failed';

const AIConsole = () => {
  const [prompt, setPrompt] = useState('');
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>('idle');
  const [savedMusic, setSavedMusic] = useState<GeneratedMusic[]>([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchSavedMusic();
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
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

  const startTimer = () => {
    setElapsedTime(0);
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const generateMusic = async () => {
    if (!prompt.trim() || generationStatus !== 'idle') return;

    setGenerationStatus('starting');
    startTimer();

    try {
      // Step 1: Start generation
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-music?action=generate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start generation');
      }

      const taskId = data.taskId;
      const currentPrompt = prompt;
      setPrompt('');
      setGenerationStatus('pending');

      // Step 2: Poll for status
      pollingRef.current = setInterval(async () => {
        try {
          const statusResponse = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-music?action=status&taskId=${taskId}&prompt=${encodeURIComponent(currentPrompt)}`,
            { method: 'GET' }
          );

          const statusData = await statusResponse.json();

          if (statusData.status === 'PROCESSING') {
            setGenerationStatus('processing');
          } else if (statusData.status === 'SUCCESS') {
            clearInterval(pollingRef.current!);
            pollingRef.current = null;
            stopTimer();
            setGenerationStatus('idle');
            toast.success('Music generated successfully!');
            await fetchSavedMusic();
            
            if (statusData.music?.file_url) {
              playMusic(statusData.music.id, statusData.music.file_url);
            }
          } else if (statusData.status === 'FAILED') {
            clearInterval(pollingRef.current!);
            pollingRef.current = null;
            stopTimer();
            setGenerationStatus('idle');
            toast.error('Music generation failed');
          }
        } catch (err) {
          console.error('Status check error:', err);
        }
      }, 5000);

    } catch (error) {
      console.error('Error:', error);
      stopTimer();
      setGenerationStatus('idle');
      toast.error(error instanceof Error ? error.message : 'Failed to generate music');
    }
  };

  const playMusic = (id: string, url: string) => {
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

  const deleteMusic = async (id: string) => {
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

  const getStatusMessage = () => {
    const time = `[${elapsedTime}s]`;
    switch (generationStatus) {
      case 'starting':
        return `${time} >> Initializing AI music generation...`;
      case 'pending':
        return `${time} >> Request queued, waiting for AI...`;
      case 'processing':
        return `${time} >> AI is composing your music...`;
      default:
        return '>> System Ready...';
    }
  };

  const isGenerating = generationStatus !== 'idle';

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
            <span>Enter a prompt to generate AI music (Suno AI - ~1-2 min generation time)</span>
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

          {/* Progress Status */}
          <div className="bg-background/50 rounded p-4 border border-border/50 min-h-[80px]">
            <p className={`text-sm font-mono ${isGenerating ? 'text-primary' : 'text-muted-foreground'}`}>
              {getStatusMessage()}
              {isGenerating && <span className="cursor-blink" />}
            </p>
            
            {isGenerating && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary"
                      initial={{ width: '0%' }}
                      animate={{ 
                        width: generationStatus === 'starting' ? '10%' : 
                               generationStatus === 'pending' ? '30%' : 
                               generationStatus === 'processing' ? '70%' : '0%'
                      }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-12">
                    {generationStatus === 'starting' ? '10%' : 
                     generationStatus === 'pending' ? '30%' : 
                     generationStatus === 'processing' ? '70%' : '0%'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  ⏱️ Usually takes 1-2 minutes. Please wait...
                </p>
              </div>
            )}
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
                        onClick={() => deleteMusic(track.id)}
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
            🎵 Powered by Suno AI via Kie.ai API
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default AIConsole;
