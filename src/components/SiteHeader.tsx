import { Search, MessageCircle, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logoWhite from "@/assets/logo-hotcars-white.png";

interface SiteHeaderProps {
  whatsapp: string;
  onSearch: (query: string) => void;
}

const SiteHeader = ({ whatsapp, onSearch }: SiteHeaderProps) => {
  const [query, setQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "glassmorphism border-b border-border shadow-lg shadow-background/50" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between h-16 md:h-20 px-4">
        <div className="flex items-center gap-4">
          <img src={logoWhite} alt="HotCars" className="h-7 md:h-8" />
        </div>

        {/* Desktop search */}
        <div className="hidden md:flex items-center bg-secondary/60 backdrop-blur-sm rounded-full px-5 py-2.5 w-full max-w-md mx-8 border border-border/50 focus-within:border-primary/40 transition-colors">
          <Search className="w-4 h-4 text-muted-foreground mr-3 shrink-0" />
          <input
            type="text"
            placeholder="Buscar marca, modelo..."
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              onSearch(e.target.value);
            }}
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Mobile search toggle */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {searchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
          </button>

          <a
            href={`https://wa.me/${whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Contacto</span>
          </a>
        </div>
      </div>

      {/* Mobile search drawer */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden overflow-hidden border-t border-border/30"
          >
            <div className="px-4 py-3 glassmorphism">
              <div className="flex items-center bg-secondary/60 rounded-full px-4 py-2.5 border border-border/50">
                <Search className="w-4 h-4 text-muted-foreground mr-3" />
                <input
                  type="text"
                  placeholder="Buscar marca, modelo..."
                  className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
                  value={query}
                  autoFocus
                  onChange={(e) => {
                    setQuery(e.target.value);
                    onSearch(e.target.value);
                  }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default SiteHeader;
