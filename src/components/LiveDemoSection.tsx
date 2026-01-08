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
  {
    title: 'Radio Rhyzoe',
    description: 'AI-powered music radio streaming platform',
    url: 'https://radiorhyzoe.lovable.app/',
  },
  {
    title: 'Vintage Myanmar Songs',
    description: 'Collection of classic Myanmar music archive',
    url: 'https://vintagemyanmarsoxngs.lovable.app/',
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

        {/* Demo Cards - Compact Grid */}
        <div className="grid md:grid-cols-3 gap-4">
          {LIVE_DEMOS.map((demo, index) => (
            <motion.div
              key={demo.url}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <div className="glass rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
                {/* Compact Header */}
                <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-500/80" />
                      <span className="w-2 h-2 rounded-full bg-yellow-500/80" />
                      <span className="w-2 h-2 rounded-full bg-green-500/80" />
                    </div>
                    <span className="text-xs font-medium text-foreground truncate max-w-[120px]">{demo.title}</span>
                  </div>
                  <a
                    href={demo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Small iframe Preview */}
                <div className="relative aspect-[4/3] bg-background">
                  <iframe
                    src={demo.url}
                    title={demo.title}
                    className="w-full h-full border-0 pointer-events-none"
                    loading="lazy"
                    sandbox="allow-scripts allow-same-origin"
                  />
                  
                  {/* Hover Overlay */}
                  <a
                    href={demo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 hover:opacity-100"
                  >
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-sm rounded-md shadow-lg">
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span className="font-medium">View</span>
                    </div>
                  </a>
                </div>

                {/* Compact Footer */}
                <div className="px-3 py-2 bg-muted/30 border-t border-border">
                  <p className="text-xs text-muted-foreground line-clamp-1">{demo.description}</p>
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
