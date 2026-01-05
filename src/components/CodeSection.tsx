import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Github, Loader2 } from 'lucide-react';
import Section from './Section';
import RepoCard from './RepoCard';
import NeonButton from './NeonButton';
import SkillsGrid from './SkillsGrid';

interface Repo {
  id: number;
  name: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  html_url: string;
  language: string | null;
}

// Demo repos as fallback
const demoRepos: Repo[] = [
  {
    id: 1,
    name: 'Rhyzoe-Portfolio',
    description: 'Personal portfolio site — code and creativity merged into one showcase',
    stargazers_count: 2,
    forks_count: 0,
    html_url: 'https://github.com/theimhtikesoe/Rhyzoe-Portfolio',
    language: 'HTML',
  },
  {
    id: 2,
    name: 'New_Life_Taunggyi',
    description: 'Project tied to the "New Life" theme — JS heavy creative development',
    stargazers_count: 1,
    forks_count: 0,
    html_url: 'https://github.com/theimhtikesoe/New_Life_Taunggyi',
    language: 'JavaScript',
  },
  {
    id: 3,
    name: 'Coffee-Ecomerce',
    description: 'E-commerce boilerplate for experimenting with payment systems and POS',
    stargazers_count: 0,
    forks_count: 1,
    html_url: 'https://github.com/theimhtikesoe/Coffee-Ecomerce',
    language: 'PHP',
  },
];

const CodeSection = () => {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        const response = await fetch(
          'https://api.github.com/users/theimhtikesoe/repos?sort=updated&per_page=6'
        );
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        // Filter out forked repos, show original work first
        const ownRepos = data.filter((repo: Repo & { fork?: boolean }) => !repo.fork).slice(0, 3);
        setRepos(ownRepos.length > 0 ? ownRepos : data.slice(0, 3));
      } catch {
        // Use demo repos if API fails
        setRepos(demoRepos);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchRepos();
  }, []);

  return (
    <Section id="code">
      <div className="space-y-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center space-y-4"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
            <span className="text-primary neon-text">System</span> Architecture
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Latest projects from the digital workshop. Open source, battle-tested code.
          </p>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Repo Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {repos.map((repo, index) => (
              <RepoCard
                key={repo.id}
                name={repo.name}
                description={repo.description}
                stars={repo.stargazers_count}
                forks={repo.forks_count}
                url={repo.html_url}
                language={repo.language}
                index={index}
              />
            ))}
          </div>
        )}

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <NeonButton
            variant="ghost"
            href="https://github.com/theimhtikesoe"
            className="inline-flex items-center gap-2"
          >
            <Github className="w-4 h-4" />
            View All Projects
          </NeonButton>

          {error && (
            <p className="text-xs text-muted-foreground mt-4">
              📡 Using cached data — 25 public repos on GitHub
            </p>
          )}
        </motion.div>

        {/* Skills Grid */}
        <SkillsGrid />
      </div>
    </Section>
  );
};

export default CodeSection;
