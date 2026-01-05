import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Loader2, Music, Sparkles, Play, Pause, Download, Trash2, Mic2, Palette, Type, Shuffle, Heart, Share2, Image, Wand2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import NeonButton from './NeonButton';
import WaveformVisualizer from './WaveformVisualizer';
interface GeneratedMusic {
  id: string;
  prompt: string;
  title?: string;
  lyrics?: string;
  style?: string;
  file_url: string;
  created_at: string;
  thumbnail_url?: string;
}
type GenerationStatus = 'idle' | 'starting' | 'pending' | 'processing' | 'success' | 'failed';
const STYLE_PRESETS = ['Lo-fi Hip Hop', 'Synthwave', 'Epic Orchestral', 'Jazz Fusion', 'Acoustic Folk', 'Electronic Dance', 'Cinematic Ambient', 'Rock Ballad'];
const SURPRISE_PROMPTS = [{
  title: 'Neon Dreams',
  style: 'Synthwave',
  lyrics: 'City lights, endless nights, chasing electric dreams'
}, {
  title: 'Ocean Whispers',
  style: 'Ambient',
  lyrics: 'Waves of calm, washing over me, peaceful serenity'
}, {
  title: 'Midnight Drive',
  style: 'Lo-fi',
  lyrics: 'Empty roads, starlit sky, just you and I'
}, {
  title: 'Phoenix Rising',
  style: 'Epic Orchestral',
  lyrics: 'From the ashes we rise, reaching for the skies'
}, {
  title: 'Coffee Shop Vibes',
  style: 'Jazz',
  lyrics: 'Warm cup of memories, rainy afternoon melodies'
}];
const AIConsole = () => {
  const [title, setTitle] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [style, setStyle] = useState('');
  const [thumbnailPrompt, setThumbnailPrompt] = useState('');
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>('idle');
  const [thumbnailStatus, setThumbnailStatus] = useState<'idle' | 'generating'>('idle');
  const [generatedThumbnail, setGeneratedThumbnail] = useState<string | null>(null);
  const [savedMusic, setSavedMusic] = useState<GeneratedMusic[]>([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showAdvanced, setShowAdvanced] = useState(false);
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
    const {
      data,
      error
    } = await supabase.from('generated_music').select('*').order('created_at', {
      ascending: false
    }).limit(10);
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
  const buildPrompt = () => {
    const parts = [];
    if (title) parts.push(`Title: ${title}`);
    if (style) parts.push(`Style: ${style}`);
    if (lyrics) parts.push(`Lyrics: ${lyrics}`);
    return parts.join('. ') || 'Create an instrumental track';
  };
  const generateMusic = async () => {
    if (generationStatus !== 'idle') return;
    const fullPrompt = buildPrompt();
    if (!fullPrompt.trim() || fullPrompt === 'Create an instrumental track') {
      toast.error('Please add a title, style, or lyrics');
      return;
    }
    setGenerationStatus('starting');
    startTimer();
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-music?action=generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: fullPrompt,
          title,
          lyrics,
          style
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to start generation');
      }
      const taskId = data.taskId;
      const currentPrompt = fullPrompt;

      // Clear form
      setTitle('');
      setLyrics('');
      setStyle('');
      setGenerationStatus('pending');

      // Poll for status
      pollingRef.current = setInterval(async () => {
        try {
          const statusResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-music?action=status&taskId=${taskId}&prompt=${encodeURIComponent(currentPrompt)}`, {
            method: 'GET'
          });
          const statusData = await statusResponse.json();
          if (statusData.status === 'PROCESSING') {
            setGenerationStatus('processing');
          } else if (statusData.status === 'SUCCESS') {
            clearInterval(pollingRef.current!);
            pollingRef.current = null;
            stopTimer();
            setGenerationStatus('idle');
            toast.success('🎵 Music generated successfully!');
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
      setAudioElement(null);
    }
    if (currentlyPlaying === id) {
      setCurrentlyPlaying(null);
      return;
    }
    const audio = new Audio(url);
    audio.crossOrigin = 'anonymous';
    audio.onended = () => {
      setCurrentlyPlaying(null);
      setAudioElement(null);
    };
    audio.play().catch(console.error);
    setAudioElement(audio);
    setCurrentlyPlaying(id);
  };
  const stopMusic = () => {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
      setAudioElement(null);
    }
    setCurrentlyPlaying(null);
  };
  const deleteMusic = async (id: string, filePath?: string) => {
    if (currentlyPlaying === id) {
      stopMusic();
    }

    // First get the file_path if not provided
    let pathToDelete = filePath;
    if (!pathToDelete) {
      const track = savedMusic.find(t => t.id === id);
      if (track) {
        // Extract path from URL
        const urlParts = track.file_url.split('/music/');
        if (urlParts.length > 1) {
          pathToDelete = urlParts[1];
        }
      }
    }

    // Delete from storage first
    if (pathToDelete) {
      const {
        error: storageError
      } = await supabase.storage.from('music').remove([pathToDelete]);
      if (storageError) {
        console.error('Storage delete error:', storageError);
      }
    }

    // Delete from database
    const {
      error
    } = await supabase.from('generated_music').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete');
      return;
    }

    // Update local state immediately
    setSavedMusic(prev => prev.filter(track => track.id !== id));
    setFavorites(prev => {
      const newFavs = new Set(prev);
      newFavs.delete(id);
      return newFavs;
    });
    toast.success('Track deleted');
  };
  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const newFavs = new Set(prev);
      if (newFavs.has(id)) {
        newFavs.delete(id);
      } else {
        newFavs.add(id);
        toast.success('Added to favorites!');
      }
      return newFavs;
    });
  };
  const shareTrack = async (track: GeneratedMusic) => {
    try {
      await navigator.clipboard.writeText(track.file_url);
      toast.success('Link copied to clipboard!');
    } catch {
      toast.error('Failed to copy link');
    }
  };
  const surpriseMe = () => {
    const random = SURPRISE_PROMPTS[Math.floor(Math.random() * SURPRISE_PROMPTS.length)];
    setTitle(random.title);
    setStyle(random.style);
    setLyrics(random.lyrics);
    setThumbnailPrompt(`A vibrant YouTube thumbnail for "${random.title}" - ${random.style} music vibes`);
    setShowAdvanced(true);
    toast.success('✨ Surprise prompt loaded!');
  };

  const generateThumbnail = async () => {
    if (thumbnailStatus === 'generating') return;
    
    const prompt = thumbnailPrompt || `YouTube thumbnail for "${title || 'Music'}" - ${style || 'modern'} style`;
    
    setThumbnailStatus('generating');
    setGeneratedThumbnail(null);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-thumbnail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          title,
          style
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate thumbnail');
      }

      setGeneratedThumbnail(data.imageUrl);
      toast.success('🎨 Thumbnail generated!');
    } catch (error) {
      console.error('Thumbnail error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate thumbnail');
    } finally {
      setThumbnailStatus('idle');
    }
  };
  const getStatusMessage = () => {
    const time = `[${elapsedTime}s]`;
    switch (generationStatus) {
      case 'starting':
        return `${time} >> Initializing AI composer...`;
      case 'pending':
        return `${time} >> Request queued, AI is warming up...`;
      case 'processing':
        return `${time} >> 🎼 Composing your masterpiece...`;
      default:
        return '>> Ready to create music...';
    }
  };
  const isGenerating = generationStatus !== 'idle';
  return <motion.div initial={{
    opacity: 0,
    scale: 0.95
  }} whileInView={{
    opacity: 1,
    scale: 1
  }} viewport={{
    once: true
  }} className="w-full max-w-2xl mx-auto">
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
            ai-music-studio.exe
          </span>
          <button onClick={surpriseMe} className="ml-auto flex items-center gap-1 px-2 py-1 text-xs bg-primary/20 hover:bg-primary/30 text-primary rounded transition-colors" disabled={isGenerating}>
            <Shuffle className="w-3 h-3" />
            Surprise Me
          </button>
        </div>

        {/* Terminal Body */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>Create AI-powered music with title, lyrics & style</span>
          </div>

          {/* Title Input */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <Type className="w-3 h-3" />
              Song Title
            </label>
            <div className="relative">
              
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-input border border-border rounded px-8 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-mono text-sm" disabled={isGenerating} maxLength={100} placeholder="" />
            </div>
          </div>

          {/* Style Selection */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <Palette className="w-3 h-3" />
              Music Style
            </label>
            <div className="flex flex-wrap gap-2">
              {STYLE_PRESETS.map(preset => <button key={preset} onClick={() => setStyle(style === preset ? '' : preset)} disabled={isGenerating} className={`px-3 py-1 text-xs rounded-full transition-all ${style === preset ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'}`}>
                  {preset}
                </button>)}
            </div>
            <input type="text" value={style} onChange={e => setStyle(e.target.value)} className="w-full bg-input border border-border rounded px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-mono text-sm" disabled={isGenerating} maxLength={50} placeholder="" />
          </div>

          {/* Lyrics Input */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <Mic2 className="w-3 h-3" />
              Lyrics / Mood (optional)
            </label>
            <textarea value={lyrics} onChange={e => setLyrics(e.target.value)} className="w-full bg-input border border-border rounded px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-mono text-sm min-h-[80px] resize-none" disabled={isGenerating} maxLength={500} placeholder="Write your lyrics or describe the mood... " />
            <div className="text-xs text-muted-foreground text-right">
              {lyrics.length}/500
            </div>
          </div>

          {/* Thumbnail Prompt */}
          <div className="space-y-2 p-4 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-lg border border-pink-500/20">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <Image className="w-3 h-3" />
              YouTube Thumbnail Prompt
            </label>
            <textarea
              value={thumbnailPrompt}
              onChange={e => setThumbnailPrompt(e.target.value)}
              className="w-full bg-input border border-border rounded px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-mono text-sm min-h-[60px] resize-none"
              disabled={thumbnailStatus === 'generating'}
              maxLength={300}
              placeholder="Describe your YouTube thumbnail... e.g., 'Neon cityscape with glowing music notes, cyberpunk style'"
            />
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                {thumbnailPrompt.length}/300
              </div>
              <button
                onClick={generateThumbnail}
                disabled={thumbnailStatus === 'generating'}
                className="flex items-center gap-2 px-3 py-1.5 text-xs bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-md transition-all disabled:opacity-50"
              >
                {thumbnailStatus === 'generating' ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3 h-3" />
                    Generate Thumbnail
                  </>
                )}
              </button>
            </div>
            
            {/* Generated Thumbnail Preview */}
            <AnimatePresence>
              {generatedThumbnail && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="mt-3"
                >
                  <p className="text-xs text-primary mb-2">✨ Generated Thumbnail:</p>
                  <div className="relative group">
                    <img
                      src={generatedThumbnail}
                      alt="Generated thumbnail"
                      className="w-full max-w-md rounded-lg border border-primary/30 shadow-lg"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                      <a
                        href={generatedThumbnail}
                        download="thumbnail.png"
                        className="p-2 bg-primary rounded-full text-primary-foreground hover:bg-primary/80 transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(generatedThumbnail);
                          toast.success('Thumbnail URL copied!');
                        }}
                        className="p-2 bg-primary rounded-full text-primary-foreground hover:bg-primary/80 transition-colors"
                        title="Copy URL"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Generate Button */}
          <NeonButton onClick={generateMusic} disabled={isGenerating || !title && !style && !lyrics} className="w-full justify-center">
            {isGenerating ? <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                GENERATING...
              </> : <>
                
                CREATE MUSIC
              </>}
          </NeonButton>

          {/* Progress Status */}
          <AnimatePresence>
            {isGenerating && <motion.div initial={{
            opacity: 0,
            height: 0
          }} animate={{
            opacity: 1,
            height: 'auto'
          }} exit={{
            opacity: 0,
            height: 0
          }} className="bg-background/50 rounded p-4 border border-primary/30">
                <p className="text-sm font-mono text-primary">
                  {getStatusMessage()}
                  <span className="animate-pulse">▊</span>
                </p>
                
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div className="h-full bg-gradient-to-r from-primary via-pink-500 to-blue-500" initial={{
                    width: '0%'
                  }} animate={{
                    width: generationStatus === 'starting' ? '15%' : generationStatus === 'pending' ? '35%' : generationStatus === 'processing' ? '75%' : '0%'
                  }} transition={{
                    duration: 0.5
                  }} />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ⏱️ Usually takes 1-2 minutes. Your masterpiece is worth the wait!
                  </p>
                </div>
              </motion.div>}
          </AnimatePresence>

          {/* Waveform Visualizer */}
          {currentlyPlaying && <motion.div initial={{
          opacity: 0,
          y: 10
        }} animate={{
          opacity: 1,
          y: 0
        }} className="p-4 bg-black/30 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Music className="w-4 h-4 text-primary animate-pulse" />
                <span className="text-xs text-primary">Now Playing</span>
              </div>
              <WaveformVisualizer audioElement={audioElement} isPlaying={!!currentlyPlaying} />
            </motion.div>}

          {/* Saved Music Library */}
          {savedMusic.length > 0 && <div className="space-y-2">
              <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
                <Music className="w-4 h-4" />
                Your Music Library ({savedMusic.length})
              </h4>
              <div className="max-h-[250px] overflow-y-auto space-y-2 pr-1">
                {savedMusic.map(track => <motion.div key={track.id} layout initial={{
              opacity: 0,
              x: -20
            }} animate={{
              opacity: 1,
              x: 0
            }} exit={{
              opacity: 0,
              x: 20
            }} className={`flex items-center gap-3 p-3 rounded border transition-all ${currentlyPlaying === track.id ? 'bg-primary/10 border-primary/50' : 'bg-muted/30 border-border/50 hover:border-primary/30'}`}>
                    <button onClick={() => playMusic(track.id, track.file_url)} className={`p-2 rounded-full transition-colors ${currentlyPlaying === track.id ? 'bg-primary text-primary-foreground' : 'bg-primary/20 hover:bg-primary/30'}`}>
                      {currentlyPlaying === track.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-primary" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate font-medium">
                        {track.prompt.split('.')[0] || 'Untitled Track'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(track.created_at).toLocaleDateString()} • {new Date(track.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => toggleFavorite(track.id)} className={`p-2 rounded transition-colors ${favorites.has(track.id) ? 'text-pink-500' : 'text-muted-foreground hover:text-pink-500'}`} title="Favorite">
                        <Heart className={`w-4 h-4 ${favorites.has(track.id) ? 'fill-current' : ''}`} />
                      </button>
                      <button onClick={() => shareTrack(track)} className="p-2 rounded text-muted-foreground hover:text-blue-500 transition-colors" title="Share">
                        <Share2 className="w-4 h-4" />
                      </button>
                      <a href={track.file_url} download className="p-2 rounded text-muted-foreground hover:text-green-500 transition-colors" title="Download">
                        <Download className="w-4 h-4" />
                      </a>
                      <button onClick={() => deleteMusic(track.id)} className="p-2 rounded text-muted-foreground hover:text-destructive transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>)}
              </div>
            </div>}

          {/* Info Notice */}
          <p className="text-xs text-muted-foreground text-center">
            🎵 Powered by Suno AI • Create unlimited music with AI
          </p>
        </div>
      </div>
    </motion.div>;
};
export default AIConsole;