import { ReactNode, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface SectionProps {
  id: string;
  children: ReactNode;
  className?: string;
  fullHeight?: boolean;
}

const sectionVariants = {
  hidden: { 
    opacity: 0, 
    y: 60,
    scale: 0.95
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      duration: 0.8,
      ease: "easeOut" as const,
      staggerChildren: 0.1
    }
  }
};

const Section = ({ id, children, className = '', fullHeight = true }: SectionProps) => {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.15 });

  return (
    <motion.section
      ref={sectionRef}
      id={id}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={sectionVariants}
      className={`
        relative z-10
        ${fullHeight ? 'min-h-screen' : ''}
        flex items-center justify-center
        px-4 sm:px-6 lg:px-8
        py-20
        ${className}
      `}
    >
      <motion.div 
        className="w-full max-w-6xl mx-auto"
        variants={{
          hidden: { opacity: 0 },
          visible: { 
            opacity: 1,
            transition: { staggerChildren: 0.08 }
          }
        }}
      >
        {children}
      </motion.div>
    </motion.section>
  );
};

export default Section;
