import { motion } from 'framer-motion';
import { Github, Youtube, Twitter, Mail } from 'lucide-react';

const socialLinks = [
  { icon: Github, href: 'https://github.com/theimhtikesoe', label: 'GitHub' },
  { icon: Youtube, href: 'https://www.youtube.com/@ZayatVibes', label: 'YouTube' },
  { icon: Twitter, href: 'https://twitter.com/rhyzoe', label: 'Twitter' },
  { icon: Mail, href: 'mailto:theimhtikesoe@gmail.com', label: 'Email' },
];

const Footer = () => {
  return (
    <footer className="relative z-10 border-t border-border/30 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center md:text-left"
          >
            <h3 className="text-xl font-bold tracking-widest neon-text text-primary mb-1">
              RHYZOE
            </h3>
            <p className="text-sm text-muted-foreground">
              Theim Htike Soe • Rapper | Web Dev | Spiritual Tech Rebel
            </p>
          </motion.div>

          {/* Social Links */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex items-center gap-4"
          >
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg border border-border/50 text-muted-foreground hover:text-primary hover:border-primary transition-colors"
                aria-label={social.label}
              >
                <social.icon className="w-5 h-5" />
              </a>
            ))}
          </motion.div>

          {/* Copyright */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs text-muted-foreground"
          >
            © {new Date().getFullYear()} RHYZOE. All rights reserved.
          </motion.p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
