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
  default: 'bg-muted-foreground'
};
const RepoCard = ({
  name,
  description,
  stars,
  forks,
  url,
  language,
  index
}: RepoCardProps) => {
  return;
};
export default RepoCard;