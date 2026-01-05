import { useState } from 'react';
import { motion } from 'framer-motion';
import { Terminal, Loader2, Music, Sparkles } from 'lucide-react';
import NeonButton from './NeonButton';

const AIConsole = () => {
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState('System Ready...');
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const generateMusic = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setAudioUrl(null);

    const statusMessages = [
      '>> Initializing MusicGen AI...',
      '>> Analyzing prompt parameters...',
      '>> Synthesizing audio waveforms...',
      '>> Applying style transfer...',
      '>> Rendering final output...',
    ];

    for (let i = 0; i < statusMessages.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setStatus(statusMessages[i]);
    }

    // Simulate completion - in production, this would call the Replicate API
    await new Promise(resolve => setTimeout(resolve, 1000));
    setStatus('>> Generation Complete. [DEMO MODE]');
    setIsGenerating(false);

    // Note: Real implementation would set actual audio URL from API
    // setAudioUrl(response.output);
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
            <span>Enter a prompt to generate AI music</span>
          </div>

          <div className="flex gap-2">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary">{'>'}</span>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && generateMusic()}
                placeholder="Dark trap beat with Burmese traditional gong..."
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
                'EXECUTE'
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

          {/* Audio Player */}
          {audioUrl && (
            <div className="flex items-center gap-4 p-4 bg-muted/30 rounded border border-primary/30">
              <Music className="w-6 h-6 text-primary" />
              <audio
                controls
                src={audioUrl}
                className="flex-1 h-8"
              />
            </div>
          )}

          {/* Demo Notice */}
          <p className="text-xs text-muted-foreground text-center">
            💡 Connect to Replicate API for live AI music generation
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default AIConsole;
