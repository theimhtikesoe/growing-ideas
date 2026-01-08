import { ReactNode, useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface SectionProps {
  id: string;
  children: ReactNode;
  className?: string;
  fullHeight?: boolean;
}

const Section = ({ id, children, className = '', fullHeight = true }: SectionProps) => {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });

  useEffect(() => {
    if (!sectionRef.current) return;

    gsap.fromTo(
      sectionRef.current,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 1,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          end: 'top 20%',
          toggleActions: 'play none none reverse',
        },
      }
    );
  }, []);

  return (
    <motion.section
      ref={sectionRef}
      id={id}
      initial={{ opacity: 0 }}
      animate={{ opacity: isInView ? 1 : 0 }}
      transition={{ duration: 0.8 }}
      className={`
        relative z-10
        ${fullHeight ? 'min-h-screen' : ''}
        flex items-center justify-center
        px-4 sm:px-6 lg:px-8
        py-20
        ${className}
      `}
    >
      <div className="w-full max-w-6xl mx-auto">
        {children}
      </div>
    </motion.section>
  );
};

export default Section;
