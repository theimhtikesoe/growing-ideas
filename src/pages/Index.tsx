import CyberBackground from '../components/CyberBackground';
import Navigation from '../components/Navigation';
import HeroSection from '../components/HeroSection';
import CodeSection from '../components/CodeSection';
import MusicSection from '../components/MusicSection';
import AILabSection from '../components/AILabSection';
import Footer from '../components/Footer';

const Index = () => {
  return (
    <div className="relative min-h-screen">
      {/* Animated Background */}
      <CyberBackground />

      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <main>
        <HeroSection />
        <CodeSection />
        <MusicSection />
        <AILabSection />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;
