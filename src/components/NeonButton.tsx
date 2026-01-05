import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface NeonButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  href?: string;
  className?: string;
  disabled?: boolean;
}

const NeonButton = ({
  children,
  onClick,
  variant = 'primary',
  href,
  className = '',
  disabled = false
}: NeonButtonProps) => {
  const baseStyles = 'relative px-8 py-3 font-mono font-semibold uppercase tracking-wider transition-all duration-300 overflow-hidden group';

  const variants = {
    primary: 'bg-primary text-primary-foreground hover:shadow-[0_0_30px_hsl(160_100%_50%/0.5)] border border-primary',
    secondary: 'bg-transparent text-secondary border border-secondary hover:bg-secondary/10 hover:shadow-[0_0_30px_hsl(300_100%_60%/0.5)]',
    ghost: 'bg-transparent text-foreground border border-border hover:border-primary hover:text-primary',
  };

  const content = (
    <>
      <span className="relative z-10">{children}</span>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500"
      />
    </>
  );

  if (href) {
    return (
      <motion.a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`${baseStyles} ${variants[variant]} ${className} inline-block`}
      >
        {content}
      </motion.a>
    );
  }

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={`${baseStyles} ${variants[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {content}
    </motion.button>
  );
};

export default NeonButton;
