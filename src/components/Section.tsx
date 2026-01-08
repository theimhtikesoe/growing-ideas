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
const Section = ({
  id,
  children,
  className = '',
  fullHeight = true
}: SectionProps) => {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, {
    once: true,
    amount: 0.2
  });
  useEffect(() => {
    if (!sectionRef.current) return;
    gsap.fromTo(sectionRef.current, {
      opacity: 0
    }, {
      opacity: 1,
      duration: 1,
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 80%',
        end: 'top 20%',
        toggleActions: 'play none none reverse'
      }
    });
  }, []);
  return;
};
export default Section;