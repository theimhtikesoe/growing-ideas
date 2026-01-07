import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Music, Sparkles, Play, Pause, Download, Trash2, Heart, Share2, Image, Wand2, Film, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GeneratedMusic {
  id: string;
  prompt: string;
  file_url: string;
  created_at: string;
}

type TabType = 'prompt' | 'thumbnail' | 'video' | 'library';

const STYLE_PRESETS = ['Lo-fi Hip Hop', 'Synthwave', 'Epic Orchestral', 'Jazz Fusion', 'Acoustic Folk', 'Electronic Dance', 'Cinematic Ambient', 'Rock Ballad'];

const THUMBNAIL_STYLES = [
  { name: 'Neon', prompt: 'neon glowing, cyberpunk style, bright colors' },
  { name: 'Minimalist', prompt: 'clean minimalist, simple shapes, elegant' },
  { name: 'Vintage', prompt: 'retro vintage, warm colors, film grain' },
  { name: '3D', prompt: '3D rendered, glossy surfaces, modern' }
];

const VIDEO_PRESETS = [
  { name: 'Cinematic', prompt: 'cinematic transitions, dramatic lighting' },
  { name: 'Trippy', prompt: 'psychedelic colors, morphing shapes' },
  { name: 'Retro VHS', prompt: 'vintage VHS aesthetic, scan lines' },
  { name: 'Glitch', prompt: 'digital glitch effects, cyberpunk' },
];

const AIConsole = () => {
  const [activeTab, setActiveTab] = useState<TabType>('prompt');
  
  // Music Prompt State
  const [title, setTitle] = useState('');
  const [style, setStyle] = useState('');
  const [mood, setMood] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [promptLoading, setPromptLoading] = useState(false);
  
  // Thumbnail State
  const [thumbnailPrompt, setThumbnailPrompt] = useState('');
  const [generatedThumbnail, setGeneratedThumbnail] = useState<string | null>(null);
  const [thumbnailLoading, setThumbnailLoading] = useState(false);
  
  // Video State
  const [videoPrompt, setVideoPrompt] = useState('');
  const [videoFrames, setVideoFrames] = useState<string[]>([]);
  const [videoLoading, setVideoLoading] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  
  // Library State
  const [savedMusic, setSavedMusic] = useState<GeneratedMusic[]>([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchSavedMusic();
  }, []);

  const fetchSavedMusic = async () => {
    const { data, error } = await supabase
      .from('generated_music')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    if (!error && data) setSavedMusic(data);
  };

  // Music Prompt Generation
  const generateMusicPrompt = async () => {
    if (!title && !style && !mood) {
      toast.error('Please fill in at least one field');
      return;
    }
    setPromptLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-music-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, style, lyrics: mood })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setGeneratedPrompt(data.prompt);
      toast.success('Prompt generated!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate');
    } finally {
      setPromptLoading(false);
    }
  };

  // Thumbnail Generation
  const generateThumbnail = async () => {
    if (!thumbnailPrompt) {
      toast.error('Please describe your thumbnail');
      return;
    }
    setThumbnailLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-thumbnail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: thumbnailPrompt, title, style })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setGeneratedThumbnail(data.imageUrl);
      toast.success('Thumbnail generated!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate');
    } finally {
      setThumbnailLoading(false);
    }
  };

  // Video Generation
  const generateVideo = async () => {
    if (!generatedThumbnail) {
      toast.error('Generate a thumbnail first');
      return;
    }
    setVideoLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thumbnailUrl: generatedThumbnail,
          musicUrl: savedMusic[0]?.file_url || null,
          prompt: videoPrompt || 'dynamic music video',
          title: title || 'Music Video'
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setVideoFrames(data.frames || []);
      toast.success(`Generated ${data.frames?.length || 0} frames!`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate');
    } finally {
      setVideoLoading(false);
    }
  };

  // Audio Controls
  const playMusic = (id: string, url: string) => {
    if (audioElement) {
      audioElement.pause();
      setAudioElement(null);
    }
    if (currentlyPlaying === id) {
      setCurrentlyPlaying(null);
      return;
    }
    const audio = new Audio(url);
    audio.onended = () => {
      setCurrentlyPlaying(null);
      setAudioElement(null);
    };
    audio.play().catch(console.error);
    setAudioElement(audio);
    setCurrentlyPlaying(id);
  };

  const deleteMusic = async (id: string) => {
    if (currentlyPlaying === id) {
      audioElement?.pause();
      setCurrentlyPlaying(null);
    }
    const { error } = await supabase.from('generated_music').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete');
      return;
    }
    setSavedMusic(prev => prev.filter(t => t.id !== id));
    toast.success('Deleted');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const tabs = [
    { id: 'prompt' as TabType, label: 'Music Prompt', icon: Sparkles },
    { id: 'thumbnail' as TabType, label: 'Thumbnail', icon: Image },
    { id: 'video' as TabType, label: 'Video', icon: Film },
    { id: 'library' as TabType, label: 'Library', icon: Music, count: savedMusic.length },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="glass rounded-xl overflow-hidden border border-border">
        {/* Tab Navigation */}
        <div className="flex border-b border-border bg-muted/30">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-primary/10 text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className="px-1.5 py-0.5 text-xs bg-primary/20 text-primary rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* Music Prompt Tab */}
            {activeTab === 'prompt' && (
              <motion.div
                key="prompt"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <p className="text-sm text-muted-foreground">
                  Generate professional prompts for Suno, Udio, or Stable Audio
                </p>

                <div className="space-y-3">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Song title (optional)"
                    className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  />

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Select style:</p>
                    <div className="flex flex-wrap gap-2">
                      {STYLE_PRESETS.map((preset) => (
                        <button
                          key={preset}
                          onClick={() => setStyle(style === preset ? '' : preset)}
                          className={`px-3 py-1.5 text-xs rounded-full transition-all ${
                            style === preset
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                    placeholder="Describe mood or add lyrics..."
                    rows={3}
                    className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
                  />
                </div>

                <button
                  onClick={generateMusicPrompt}
                  disabled={promptLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {promptLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  Generate Prompt
                </button>

                {generatedPrompt && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-foreground leading-relaxed">{generatedPrompt}</p>
                      <button
                        onClick={() => copyToClipboard(generatedPrompt)}
                        className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
                      >
                        <Copy className="w-4 h-4 text-primary" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Copy and paste into Suno, Udio, or Stable Audio
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Thumbnail Tab */}
            {activeTab === 'thumbnail' && (
              <motion.div
                key="thumbnail"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <p className="text-sm text-muted-foreground">
                  Create AI-powered thumbnails for YouTube & social media
                </p>

                <textarea
                  value={thumbnailPrompt}
                  onChange={(e) => setThumbnailPrompt(e.target.value)}
                  placeholder="Describe your thumbnail... e.g., 'Neon city with glowing music notes'"
                  rows={3}
                  className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
                />

                <div className="flex flex-wrap gap-2">
                  {THUMBNAIL_STYLES.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => setThumbnailPrompt(preset.prompt)}
                      className="px-3 py-1.5 text-xs rounded-full bg-secondary/10 text-secondary hover:bg-secondary/20 transition-colors"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>

                <button
                  onClick={generateThumbnail}
                  disabled={thumbnailLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {thumbnailLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4" />
                  )}
                  Generate Thumbnail
                </button>

                {generatedThumbnail && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-3"
                  >
                    <img
                      src={generatedThumbnail}
                      alt="Generated thumbnail"
                      className="w-full rounded-lg border border-border"
                    />
                    <div className="flex gap-2">
                      <a
                        href={generatedThumbnail}
                        download="thumbnail.png"
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </a>
                      <button
                        onClick={() => copyToClipboard(generatedThumbnail)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                        Copy URL
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Video Tab */}
            {activeTab === 'video' && (
              <motion.div
                key="video"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <p className="text-sm text-muted-foreground">
                  Create video frames from your thumbnail for YouTube/TikTok
                </p>

                {!generatedThumbnail ? (
                  <div className="p-6 border border-dashed border-border rounded-lg text-center">
                    <Film className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Generate a thumbnail first to create video frames
                    </p>
                    <button
                      onClick={() => setActiveTab('thumbnail')}
                      className="mt-3 text-sm text-primary hover:underline"
                    >
                      Go to Thumbnail →
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="aspect-video rounded-lg overflow-hidden border border-border">
                      <img
                        src={generatedThumbnail}
                        alt="Base thumbnail"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <textarea
                      value={videoPrompt}
                      onChange={(e) => setVideoPrompt(e.target.value)}
                      placeholder="Video style... e.g., 'cinematic transitions, pulsing effects'"
                      rows={2}
                      className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
                    />

                    <div className="flex flex-wrap gap-2">
                      {VIDEO_PRESETS.map((preset) => (
                        <button
                          key={preset.name}
                          onClick={() => setVideoPrompt(preset.prompt)}
                          className="px-3 py-1.5 text-xs rounded-full bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={generateVideo}
                      disabled={videoLoading}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {videoLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Film className="w-4 h-4" />
                      )}
                      Generate Video Frames
                    </button>

                    {videoFrames.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3"
                      >
                        <div className="aspect-video rounded-lg overflow-hidden border border-primary/30 bg-black">
                          <img
                            src={videoFrames[currentFrame]}
                            alt={`Frame ${currentFrame + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {videoFrames.map((frame, idx) => (
                            <button
                              key={idx}
                              onClick={() => setCurrentFrame(idx)}
                              className={`flex-shrink-0 w-16 h-10 rounded overflow-hidden border-2 transition-all ${
                                idx === currentFrame ? 'border-primary' : 'border-transparent opacity-60'
                              }`}
                            >
                              <img src={frame} alt="" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </>
                )}
              </motion.div>
            )}

            {/* Library Tab */}
            {activeTab === 'library' && (
              <motion.div
                key="library"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                {savedMusic.length === 0 ? (
                  <div className="p-8 text-center">
                    <Music className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No saved music yet</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {savedMusic.map((track) => (
                      <motion.div
                        key={track.id}
                        layout
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                          currentlyPlaying === track.id
                            ? 'bg-primary/10 border-primary/50'
                            : 'bg-muted/30 border-border hover:border-primary/30'
                        }`}
                      >
                        <button
                          onClick={() => playMusic(track.id, track.file_url)}
                          className={`p-2.5 rounded-full transition-colors ${
                            currentlyPlaying === track.id
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-primary/20 hover:bg-primary/30'
                          }`}
                        >
                          {currentlyPlaying === track.id ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4 text-primary" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground truncate font-medium">
                            {track.prompt.split('.')[0] || 'Untitled'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(track.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              const newFavs = new Set(favorites);
                              if (newFavs.has(track.id)) {
                                newFavs.delete(track.id);
                              } else {
                                newFavs.add(track.id);
                              }
                              setFavorites(newFavs);
                            }}
                            className={`p-2 rounded-lg transition-colors ${
                              favorites.has(track.id) ? 'text-pink-500' : 'text-muted-foreground hover:text-pink-500'
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${favorites.has(track.id) ? 'fill-current' : ''}`} />
                          </button>
                          <a
                            href={track.file_url}
                            download
                            className="p-2 rounded-lg text-muted-foreground hover:text-green-500 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => deleteMusic(track.id)}
                            className="p-2 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default AIConsole;
