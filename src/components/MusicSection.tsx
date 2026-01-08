import { motion } from 'framer-motion';
import { Music, Headphones, Youtube, Play } from 'lucide-react';
import Section from './Section';
import NeonButton from './NeonButton';
const MusicSection = () => {
  return <Section id="music">
      <div className="space-y-12">
        {/* Section Header */}
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} whileInView={{
        opacity: 1,
        y: 0
      }} viewport={{
        once: true
      }} className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Headphones className="w-8 h-8 text-secondary" />
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">YouTube Channel<span className="text-secondary">Zayat</span> Vibes
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Burmese-English drill music. Raw musical moments, chill vibes, and emo beats.
            Tracks like "Movin" and "I'm So Lonely on Valentine's Day".
          </p>
        </motion.div>

        {/* YouTube Channels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Zayat Vibes Channel */}
          <motion.a href="https://www.youtube.com/@ZayatVibes" target="_blank" rel="noopener noreferrer" initial={{
          opacity: 0,
          x: -20
        }} whileInView={{
          opacity: 1,
          x: 0
        }} viewport={{
          once: true
        }} whileHover={{
          scale: 1.02
        }} className="glass gradient-border rounded-lg p-6 cursor-pointer group">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center shrink-0 group-hover:bg-secondary/30 transition-colors">
                <Music className="w-8 h-8 text-secondary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-1 group-hover:text-secondary transition-colors">
                  Zayat Vibes
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Creative channel — music and visuals together. Original tracks, shorts with raw snippets like "Phom Movin" and emo beats.
                </p>
                <span className="inline-flex items-center gap-1 text-xs text-secondary">
                  <Play className="w-3 h-3" /> Watch Now
                </span>
              </div>
            </div>
          </motion.a>

          {/* RhyzoeInBurma Channel */}
          <motion.a href="https://www.youtube.com/@RhyzoeInBurma" target="_blank" rel="noopener noreferrer" initial={{
          opacity: 0,
          x: 20
        }} whileInView={{
          opacity: 1,
          x: 0
        }} viewport={{
          once: true
        }} whileHover={{
          scale: 1.02
        }} className="glass gradient-border rounded-lg p-6 cursor-pointer group">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/30 transition-colors">
                <Youtube className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-1 group-hover:text-primary transition-colors">
                  RhyzoeInBurma
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Official Rhyzoe artist hub — main music and lifestyle channel for primary releases.
                </p>
                <span className="inline-flex items-center gap-1 text-xs text-primary">
                  <Play className="w-3 h-3" /> Subscribe
                </span>
              </div>
            </div>
          </motion.a>
        </div>

        {/* Featured Tracks */}
        

        {/* Stats */}
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} whileInView={{
        opacity: 1,
        y: 0
      }} viewport={{
        once: true
      }} className="grid grid-cols-3 gap-4 max-w-md mx-auto">
          {[{
          label: 'Channels',
          value: '2'
        }, {
          label: 'Tracks',
          value: '10+'
        }, {
          label: 'Style',
          value: 'Drill'
        }].map((stat, index) => {})}
        </motion.div>

        {/* CTA */}
        <motion.div initial={{
        opacity: 0
      }} whileInView={{
        opacity: 1
      }} viewport={{
        once: true
      }} className="flex flex-wrap items-center justify-center gap-4">
          <NeonButton variant="secondary" href="https://www.youtube.com/@ZayatVibes" className="inline-flex items-center gap-2">
            <Youtube className="w-4 h-4" />
            Zayat Vibes
          </NeonButton>
          <NeonButton variant="ghost" href="https://www.youtube.com/@RhyzoeInBurma" className="inline-flex items-center gap-2">
            <Music className="w-4 h-4" />
            RhyzoeInBurma
            
          </NeonButton>
        </motion.div>
      </div>
    </Section>;
};
export default MusicSection;