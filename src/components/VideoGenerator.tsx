import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Loader2, Download, Play, Pause, Wand2, Film } from 'lucide-react';
import { toast } from 'sonner';

interface VideoGeneratorProps {
  thumbnailUrl: string | null;
  musicUrl: string | null;
  title: string;
}

const VideoGenerator = ({ thumbnailUrl, musicUrl, title }: VideoGeneratorProps) => {
  const [videoPrompt, setVideoPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [frames, setFrames] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const VIDEO_PRESETS = [
    { name: 'Cinematic', prompt: 'cinematic movie-like transitions, dramatic lighting, professional film quality' },
    { name: 'Trippy', prompt: 'psychedelic colors, morphing shapes, surreal dreamlike visuals' },
    { name: 'Retro VHS', prompt: 'vintage VHS aesthetic, scan lines, nostalgic 80s/90s vibe' },
    { name: 'Glitch Art', prompt: 'digital glitch effects, databending, cyberpunk aesthetic' },
  ];

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const generateVideoFrames = async () => {
    if (!thumbnailUrl) {
      toast.error('Please generate a thumbnail first');
      return;
    }

    setIsGenerating(true);
    setFrames([]);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          thumbnailUrl,
          musicUrl,
          prompt: videoPrompt || 'dynamic music video with smooth transitions',
          title,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate video');
      }

      setFrames(data.frames || []);
      toast.success(`🎬 Generated ${data.frames?.length || 0} video frames!`);
    } catch (error) {
      console.error('Video generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate video');
    } finally {
      setIsGenerating(false);
    }
  };

  const playPreview = () => {
    if (frames.length === 0) return;

    if (isPlaying) {
      setIsPlaying(false);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      return;
    }

    setIsPlaying(true);
    setCurrentFrameIndex(0);

    if (musicUrl) {
      audioRef.current = new Audio(musicUrl);
      audioRef.current.play().catch(console.error);
    }

    const frameDuration = 2000; // 2 seconds per frame
    let lastFrameTime = Date.now();
    let frameIdx = 0;

    const animate = () => {
      const now = Date.now();
      if (now - lastFrameTime >= frameDuration) {
        frameIdx = (frameIdx + 1) % frames.length;
        setCurrentFrameIndex(frameIdx);
        lastFrameTime = now;
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  const downloadAsVideo = async () => {
    if (frames.length === 0) {
      toast.error('Generate video frames first');
      return;
    }

    toast.info('Preparing video download... This creates a slideshow with your frames.');

    try {
      // Create a canvas for video rendering
      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      const stream = canvas.captureStream(30);
      
      // Add audio if available
      if (musicUrl) {
        try {
          const audioResponse = await fetch(musicUrl);
          const audioBlob = await audioResponse.blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          
          // Try to get audio stream
          const audioContext = new AudioContext();
          const source = audioContext.createMediaElementSource(audio);
          const destination = audioContext.createMediaStreamDestination();
          source.connect(destination);
          source.connect(audioContext.destination);
          
          destination.stream.getAudioTracks().forEach(track => {
            stream.addTrack(track);
          });
        } catch (audioErr) {
          console.log('Could not add audio to video:', audioErr);
        }
      }

      mediaRecorderRef.current = new MediaRecorder(stream, { 
        mimeType: 'video/webm;codecs=vp9' 
      });
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title || 'music-video'}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('🎬 Video downloaded!');
      };

      mediaRecorderRef.current.start();

      // Render frames
      const frameDuration = 2000; // 2 seconds per frame
      
      for (let i = 0; i < frames.length; i++) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            // Draw with cover-style scaling
            const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
            const x = (canvas.width - img.width * scale) / 2;
            const y = (canvas.height - img.height * scale) / 2;
            
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
            resolve();
          };
          img.onerror = () => {
            console.error('Failed to load frame:', frames[i]);
            resolve();
          };
          img.src = frames[i];
        });

        await new Promise(resolve => setTimeout(resolve, frameDuration));
      }

      mediaRecorderRef.current.stop();
    } catch (err) {
      console.error('Video creation error:', err);
      toast.error('Failed to create video');
    }
  };

  if (!thumbnailUrl && !musicUrl) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3 p-4 bg-gradient-to-r from-blue-500/10 to-green-500/10 rounded-lg border border-blue-500/20"
    >
      <div className="flex items-center gap-2 text-sm font-medium text-blue-400">
        <Film className="w-4 h-4" />
        Music Video Generator
      </div>

      <p className="text-xs text-muted-foreground">
        Transform your thumbnail and music into a music video ready for YouTube/TikTok
      </p>

      {/* Video Prompt */}
      <textarea
        value={videoPrompt}
        onChange={(e) => setVideoPrompt(e.target.value)}
        className="w-full bg-input border border-border rounded px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-mono text-sm min-h-[60px] resize-none"
        disabled={isGenerating}
        maxLength={300}
        placeholder="Describe your music video style... e.g., 'cinematic transitions, glowing effects, pulsing to the beat'"
      />

      {/* Style Presets */}
      <div className="flex flex-wrap gap-2">
        {VIDEO_PRESETS.map((preset) => (
          <button
            key={preset.name}
            onClick={() => setVideoPrompt(preset.prompt)}
            disabled={isGenerating}
            className="px-3 py-1.5 text-xs rounded-full bg-gradient-to-r from-blue-500/20 to-green-500/20 hover:from-blue-500/30 hover:to-green-500/30 border border-blue-500/30 text-blue-300 transition-all disabled:opacity-50"
          >
            {preset.name}
          </button>
        ))}
      </div>

      {/* Generate Button */}
      <button
        onClick={generateVideoFrames}
        disabled={isGenerating || !thumbnailUrl}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white rounded-md transition-all disabled:opacity-50"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating Frames...
          </>
        ) : (
          <>
            <Wand2 className="w-4 h-4" />
            Generate Video Frames
          </>
        )}
      </button>

      {/* Preview Section */}
      <AnimatePresence>
        {frames.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs text-primary">
                🎬 {frames.length} frames generated
              </p>
              <div className="flex gap-2">
                <button
                  onClick={playPreview}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs bg-primary/20 hover:bg-primary/30 rounded-md transition-colors"
                >
                  {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  {isPlaying ? 'Stop' : 'Preview'}
                </button>
                <button
                  onClick={downloadAsVideo}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-md transition-colors"
                >
                  <Download className="w-3 h-3" />
                  Download
                </button>
              </div>
            </div>

            {/* Frame Preview */}
            <div className="relative aspect-video rounded-lg overflow-hidden border border-primary/30 bg-black">
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentFrameIndex}
                  src={frames[currentFrameIndex]}
                  alt={`Frame ${currentFrameIndex + 1}`}
                  className="w-full h-full object-cover"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                />
              </AnimatePresence>
              <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 rounded text-xs text-white">
                Frame {currentFrameIndex + 1} / {frames.length}
              </div>
            </div>

            {/* Frame Thumbnails */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {frames.map((frame, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentFrameIndex(idx)}
                  className={`flex-shrink-0 w-16 h-10 rounded overflow-hidden border-2 transition-all ${
                    idx === currentFrameIndex ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={frame} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <canvas ref={canvasRef} className="hidden" width={1280} height={720} />
    </motion.div>
  );
};

export default VideoGenerator;
