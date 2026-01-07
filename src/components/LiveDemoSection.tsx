import { motion } from 'framer-motion';
import { ExternalLink, Globe, Maximize2, Monitor } from 'lucide-react';
import Section from './Section';
import GlitchText from './GlitchText';

interface LiveDemo {
  title: string;
  description: string;
  url: string;
  thumbnail?: string;
}

const LIVE_DEMOS: LiveDemo[] = [
  {
    title: 'The Lobby Menu',
    description: 'Modern restaurant menu with sleek UI design',
    url: 'https://the-lobby-menu.vercel.app/',
  },
];

const LiveDemoSection = () => {
  return (
    <Section id="demos" fullHeight={false}>
      <div className="space-y-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Globe className="w-6 h-6 text-primary" />
            <GlitchText text="Live Demos" className="text-3xl md:text-4xl font-bold" />
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Interactive showcases of deployed projects. Click to explore live!
          </p>
        </motion.div>

        {/* Demo Cards */}
        <div className="grid gap-8">
          {LIVE_DEMOS.map((demo, index) => (
            <motion.div
              key={demo.url}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <div className="glass rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-all duration-300">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-red-500/80" />
                      <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                      <span className="w-3 h-3 rounded-full bg-green-500/80" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Monitor className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">{demo.title}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={demo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 text-xs bg-primary hover:bg-primary/80 text-primary-foreground rounded-md transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Open Site
                    </a>
                  </div>
                </div>

                {/* iframe Preview */}
                <div className="relative aspect-video bg-background">
                  <iframe
                    src={demo.url}
                    title={demo.title}
                    className="w-full h-full border-0"
                    loading="lazy"
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                  />
                  
                  {/* Overlay for click interaction */}
                  <a
                    href={demo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100 group-hover:opacity-100"
                  >
                    <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg shadow-lg transform scale-95 group-hover:scale-100 transition-transform">
                      <Maximize2 className="w-4 h-4" />
                      <span className="font-medium">View Full Site</span>
                    </div>
                  </a>
                </div>

                {/* Footer */}
                <div className="px-4 py-3 bg-muted/30 border-t border-border">
                  <p className="text-sm text-muted-foreground">{demo.description}</p>
                  <p className="text-xs text-primary/70 mt-1 font-mono truncate">{demo.url}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
};

export default LiveDemoSection;
