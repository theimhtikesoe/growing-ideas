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
const demoRepos: Repo[] = [{
  id: 1,
  name: 'Rhyzoe-Portfolio',
  description: 'Personal portfolio site — code and creativity merged into one showcase',
  stargazers_count: 2,
  forks_count: 0,
  html_url: 'https://github.com/theimhtikesoe/Rhyzoe-Portfolio',
  language: 'HTML'
}, {
  id: 2,
  name: 'New_Life_Taunggyi',
  description: 'Project tied to the "New Life" theme — JS heavy creative development',
  stargazers_count: 1,
  forks_count: 0,
  html_url: 'https://github.com/theimhtikesoe/New_Life_Taunggyi',
  language: 'JavaScript'
}, {
  id: 3,
  name: 'Coffee-Ecomerce',
  description: 'E-commerce boilerplate for experimenting with payment systems and POS',
  stargazers_count: 0,
  forks_count: 1,
  html_url: 'https://github.com/theimhtikesoe/Coffee-Ecomerce',
  language: 'PHP'
}];
const CodeSection = () => {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    const fetchRepos = async () => {
      try {
        const response = await fetch('https://api.github.com/users/theimhtikesoe/repos?sort=updated&per_page=6');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        // Filter out forked repos, show original work first
        const ownRepos = data.filter((repo: Repo & {
          fork?: boolean;
        }) => !repo.fork).slice(0, 3);
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
  return <Section id="code">
      
    </Section>;
};
export default CodeSection;