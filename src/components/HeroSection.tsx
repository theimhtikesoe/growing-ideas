import { motion } from 'framer-motion';
import GlitchText from './GlitchText';
import NeonButton from './NeonButton';
import Section from './Section';
import { Code2, Music, Sparkles } from 'lucide-react';
const HeroSection = () => {
  const scrollToCode = () => {
    document.getElementById('code')?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  return <Section id="home" className="relative">
      <div className="text-center space-y-8">
        {/* Brand Tag */}
        <motion.div initial={{
        opacity: 0,
        y: -20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.2
      }} className="inline-block px-4 py-1 border border-primary/30 rounded-full text-xs tracking-[0.3em] text-primary uppercase">
          Theim Htike Soe • လက်ျာ
        </motion.div>

        {/* Main Title */}
        <GlitchText text="RHYZOE" className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl tracking-widest" />

        {/* Subtitle */}
        <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} transition={{
        delay: 0.5
      }} className="flex flex-wrap items-center justify-center gap-4 text-muted-foreground">
          <span className="flex items-center gap-2">
            <Music className="w-4 h-4 text-secondary" />
            Rapper
          </span>
          <span className="text-primary">|</span>
          <span className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-primary" />
            Web Developer
          </span>
          <span className="text-primary">|</span>
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-neon-purple" />
            Spiritual Tech Rebel
          </span>
        </motion.div>

        {/* Tagline */}
        <motion.p initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} transition={{
        delay: 0.7
      }} className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
          Burmese-English drill music meets <span className="text-primary">React & Laravel</span>.
          Mixing <span className="text-secondary">beats + AI visuals</span> under Zayat Vibes
        </motion.p>

        {/* CTA Buttons */}
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.9
      }} className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <NeonButton onClick={scrollToCode}>
            View Projects
          </NeonButton>
          <NeonButton variant="secondary" href="#music">
            Listen Now
          </NeonButton>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} transition={{
        delay: 1.2
      }} className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <motion.div animate={{
          y: [0, 10, 0]
        }} transition={{
          duration: 1.5,
          repeat: Infinity
        }} className="text-muted-foreground">
            
          </motion.div>
        </motion.div>
      </div>
    </Section>;
};
export default HeroSection;