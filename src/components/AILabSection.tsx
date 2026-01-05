import { motion } from 'framer-motion';
import { Cpu, Zap, Waves } from 'lucide-react';
import Section from './Section';
import AIConsole from './AIConsole';

const AILabSection = () => {
  return (
    <Section id="ai-lab">
      <div className="space-y-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center space-y-4"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <Cpu className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
            AI <span className="text-primary neon-text">Audio</span> Synthesis
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Generate custom beats using artificial intelligence.
            Powered by Meta's MusicGen model.
          </p>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-8"
        >
          {[
            {
              icon: Zap,
              title: 'Instant Generation',
              description: 'Create unique beats in seconds',
            },
            {
              icon: Waves,
              title: 'Custom Styles',
              description: 'Trap, Lo-Fi, Traditional fusion',
            },
            {
              icon: Cpu,
              title: 'AI Powered',
              description: 'State-of-the-art MusicGen model',
            },
          ].map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center p-4"
            >
              <feature.icon className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-1">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Console */}
        <AIConsole />

        {/* Tech Stack */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-xs text-muted-foreground">
            Built with <span className="text-primary">Replicate API</span> •
            <span className="text-secondary"> MusicGen</span> •
            <span className="text-neon-purple"> React</span>
          </p>
        </motion.div>
      </div>
    </Section>
  );
};

export default AILabSection;
