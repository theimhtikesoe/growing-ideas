import { motion } from 'framer-motion';

const skills = [
  { name: 'HTML', level: 90 },
  { name: 'CSS', level: 85 },
  { name: 'JavaScript', level: 80 },
  { name: 'React', level: 70 },
  { name: 'PHP', level: 75 },
  { name: 'Laravel', level: 70 },
  { name: 'MySQL', level: 75 },
];

const SkillsGrid = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mt-12"
    >
      <h3 className="text-center text-sm uppercase tracking-wider text-muted-foreground mb-6">
        Tech Stack
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 max-w-4xl mx-auto">
        {skills.map((skill, index) => (
          <motion.div
            key={skill.name}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.05, y: -3 }}
            className="glass p-4 rounded-lg text-center cursor-default group"
          >
            <div className="text-sm font-semibold mb-2 group-hover:text-primary transition-colors">
              {skill.name}
            </div>
            <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${skill.level}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: index * 0.1 }}
                className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Currently Learning */}
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="text-center text-sm text-muted-foreground mt-6"
      >
        Currently: <span className="text-primary">Mastering React</span> + <span className="text-secondary">Laravel</span> + <span className="text-neon-purple">AI Visuals</span>
      </motion.p>
    </motion.div>
  );
};

export default SkillsGrid;
