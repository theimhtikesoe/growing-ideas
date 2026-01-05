import { useEffect, useRef } from 'react';

interface WaveformVisualizerProps {
  audioElement: HTMLAudioElement | null;
  isPlaying: boolean;
}

const WaveformVisualizer = ({ audioElement, isPlaying }: WaveformVisualizerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  useEffect(() => {
    if (!audioElement || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Only create audio context when playing
    if (isPlaying && !audioContextRef.current) {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyzer = audioContext.createAnalyser();
        analyzer.fftSize = 256;
        
        const source = audioContext.createMediaElementSource(audioElement);
        source.connect(analyzer);
        analyzer.connect(audioContext.destination);
        
        audioContextRef.current = audioContext;
        analyzerRef.current = analyzer;
        sourceRef.current = source;
      } catch (e) {
        console.log('Audio visualization not supported');
      }
    }

    const draw = () => {
      if (!ctx || !canvasRef.current) return;
      
      const WIDTH = canvas.width;
      const HEIGHT = canvas.height;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      if (!isPlaying || !analyzerRef.current) {
        // Draw idle state with subtle animation
        const time = Date.now() / 1000;
        const barCount = 32;
        const barWidth = WIDTH / barCount - 2;
        
        for (let i = 0; i < barCount; i++) {
          const idleHeight = 5 + Math.sin(time * 2 + i * 0.2) * 3;
          const x = i * (barWidth + 2);
          
          ctx.fillStyle = 'rgba(139, 92, 246, 0.3)';
          ctx.fillRect(x, HEIGHT / 2 - idleHeight / 2, barWidth, idleHeight);
        }
        
        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      const bufferLength = analyzerRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyzerRef.current.getByteFrequencyData(dataArray);

      const barCount = 32;
      const barWidth = WIDTH / barCount - 2;

      for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor(i * bufferLength / barCount);
        const barHeight = (dataArray[dataIndex] / 255) * HEIGHT * 0.8;
        
        const x = i * (barWidth + 2);
        const y = (HEIGHT - barHeight) / 2;

        // Gradient from primary to accent colors
        const gradient = ctx.createLinearGradient(x, y + barHeight, x, y);
        gradient.addColorStop(0, 'rgba(139, 92, 246, 0.8)'); // Primary
        gradient.addColorStop(0.5, 'rgba(236, 72, 153, 0.8)'); // Pink
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0.8)'); // Blue

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth, barHeight);

        // Reflection
        ctx.fillStyle = 'rgba(139, 92, 246, 0.2)';
        ctx.fillRect(x, HEIGHT / 2 + barHeight / 2, barWidth, barHeight * 0.3);
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioElement, isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={60}
      className="w-full h-[60px] rounded-lg bg-black/20"
    />
  );
};

export default WaveformVisualizer;
