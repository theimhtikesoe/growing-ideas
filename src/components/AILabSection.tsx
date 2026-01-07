import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import Section from './Section';
import AIConsole from './AIConsole';
import GlitchText from './GlitchText';

const AILabSection = () => {
  return (
    <Section id="ai-lab" fullHeight={false}>
      <div className="space-y-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center space-y-3"
        >
          <div className="flex items-center justify-center gap-3">
            <Sparkles className="w-6 h-6 text-primary" />
            <GlitchText text="AI Creative Studio" className="text-3xl md:text-4xl font-bold" />
          </div>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Generate music prompts, thumbnails, and video content with AI
          </p>
        </motion.div>

        {/* Console */}
        <AIConsole />
      </div>
    </Section>
  );
};

export default AILabSection;
