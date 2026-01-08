import { motion } from 'framer-motion';
import { Star, GitFork, ExternalLink } from 'lucide-react';
import NeonButton from './NeonButton';

interface RepoCardProps {
  name: string;
  description: string | null;
  stars: number;
  forks: number;
  url: string;
  language: string | null;
  index: number;
}

const languageColors: Record<string, string> = {
  TypeScript: 'bg-blue-500',
  JavaScript: 'bg-yellow-400',
  Python: 'bg-green-500',
  Rust: 'bg-orange-500',
  Go: 'bg-cyan-400',
  HTML: 'bg-red-500',
  CSS: 'bg-purple-500',
  PHP: 'bg-indigo-400',
  default: 'bg-muted-foreground',
};

const RepoCard = ({ name, description, stars, forks, url, language, index }: RepoCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="glass gradient-border hover-lift p-6 rounded-lg"
    >
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-bold text-foreground truncate flex-1 mr-2">
          {name}
        </h3>
        {language && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={`w-2 h-2 rounded-full ${languageColors[language] || languageColors.default}`} />
            {language}
          </span>
        )}
      </div>

      <p className="text-sm text-muted-foreground mb-4 line-clamp-2 min-h-[2.5rem]">
        {description || '// No description provided'}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Star className="w-4 h-4" />
            {stars}
          </span>
          <span className="flex items-center gap-1">
            <GitFork className="w-4 h-4" />
            {forks}
          </span>
        </div>

        <NeonButton variant="ghost" href={url} className="text-xs px-4 py-2">
          <span className="flex items-center gap-1">
            View <ExternalLink className="w-3 h-3" />
          </span>
        </NeonButton>
      </div>
    </motion.div>
  );
};

export default RepoCard;
