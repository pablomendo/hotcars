'use client';
import { MapPin, Phone, Clock, Instagram, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import logoWhite from "@/assets/logo-hotcars-white.png";
import type { AgencyConfig } from "@/data/mockData";

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

interface SiteFooterProps {
  config: AgencyConfig;
}

const SiteFooter = ({ config }: SiteFooterProps) => {
  const contactItems = [
    { icon: MapPin, text: config.address },
    { icon: Phone, text: config.phone },
    { icon: Clock, text: config.hours },
  ];

  return (
    <footer className="border-t border-border/50">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-5"
          >
            <h3 className="text-speed text-xl text-foreground">{config.name}</h3>
            {contactItems.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-muted-foreground text-sm">
                <div className="w-9 h-9 rounded-lg bg-secondary/60 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <span>{text}</span>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-start md:items-end justify-between gap-6"
          >
            <div className="flex gap-3">
              {config.instagram && (
                <a
                  href={config.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-lg bg-secondary/60 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-secondary transition-all group"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {config.facebook && (
                <a
                  href={config.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-lg bg-secondary/60 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-secondary transition-all group"
                >
                  <FacebookIcon />
                </a>
              )}
            </div>
            <div className="flex items-center gap-2 opacity-30">
              <span className="text-xs text-muted-foreground">Powered by</span>
              <img src={logoWhite} alt="HotCars" className="h-4" />
            </div>
          </motion.div>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
