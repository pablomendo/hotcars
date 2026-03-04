'use client';
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

const heroDefault = "/hero-default.jpg";

interface HeroSectionProps {
  coverImage: string | null;
  title: string | null;
  subtitle: string | null;
}

const HeroSection = ({ coverImage, title, subtitle }: HeroSectionProps) => {
  const bgImage = coverImage || heroDefault;

  return (
    <section id="top" className="relative w-full h-screen overflow-hidden">
      {/* Background with parallax-like scale */}
      <motion.div
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0"
      >
        <img
          src={bgImage}
          alt="Portada"
          className="w-full h-full object-cover"
        />
      </motion.div>

      {/* Gradient overlays - always present for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/40 to-transparent" />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <ChevronDown className="w-6 h-6 text-foreground" />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;