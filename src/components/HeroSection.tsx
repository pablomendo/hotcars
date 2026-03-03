import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import heroDefault from "@/assets/hero-default.jpg";

interface HeroSectionProps {
  coverImage: string | null;
  title: string | null;
  subtitle: string | null;
}

const HeroSection = ({ coverImage, title, subtitle }: HeroSectionProps) => {
  const hasText = title || subtitle;
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

      {hasText && (
        <div className="relative z-10 flex flex-col items-start justify-end h-full pb-32 md:pb-40 px-6 md:px-0 container mx-auto">
          {title && (
            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="text-speed text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl text-foreground leading-[0.95] max-w-4xl"
            >
              {title}
            </motion.h1>
          )}
          {subtitle && (
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="text-base md:text-lg text-muted-foreground max-w-xl mt-5 leading-relaxed"
            >
              {subtitle}
            </motion.p>
          )}
          <motion.a
            href="#inventario"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="btn-primary mt-8 px-8 py-3 text-sm tracking-wide flex items-center gap-2"
          >
            Ver inventario
            <ChevronDown className="w-4 h-4" />
          </motion.a>
        </div>
      )}

      {/* Scroll indicator */}
      {!hasText && (
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
      )}
    </section>
  );
};

export default HeroSection;
