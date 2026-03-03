import { Car, Truck, Mountain, Package, Container, Bike } from "lucide-react";
import { motion } from "framer-motion";

const categories = [
  { name: "Autos", icon: Car },
  { name: "Pickups", icon: Truck },
  { name: "SUVs", icon: Mountain },
  { name: "Utilitarios", icon: Package },
  { name: "Camiones", icon: Container },
  { name: "Motos", icon: Bike },
];

interface CategoryStripProps {
  onSelect: (category: string) => void;
  active: string;
}

const CategoryStrip = ({ onSelect, active }: CategoryStripProps) => {
  return (
    <section className="py-6 border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex gap-2 overflow-x-auto pb-1 md:grid md:grid-cols-6 md:gap-3 scrollbar-hide" style={{ scrollbarWidth: "none" }}>
          {categories.map(({ name, icon: Icon }, i) => {
            const isActive = active === name;
            return (
              <motion.button
                key={name}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                onClick={() => onSelect(isActive ? "" : name)}
                className={`relative flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-300 shrink-0 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={2} />
                <span>{name}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategoryStrip;
