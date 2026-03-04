'use client';

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import VehicleCard from "./VehicleCard";
import type { Vehicle } from "@/data/mockData";

interface FeaturedSliderProps {
  title: string;
  subtitle?: string;
  vehicles: Vehicle[];
  whatsapp: string;
}

const FeaturedSlider = ({ title, subtitle, vehicles, whatsapp }: FeaturedSliderProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 340, behavior: "smooth" });
  };

  if (vehicles.length === 0) return null;

  return (
    <section className="py-14">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-speed text-2xl md:text-3xl text-foreground">{title}</h2>
            {subtitle && <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>}
          </motion.div>
          <div className="flex gap-2">
            <button
              onClick={() => scroll(-1)}
              className="p-2.5 rounded-lg bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll(1)}
              className="p-2.5 rounded-lg bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory"
          style={{ scrollbarWidth: "none" }}
        >
          {vehicles.map((v, i) => (
            <div key={v.id} className="min-w-[300px] max-w-[320px] snap-start shrink-0">
              <VehicleCard vehicle={v} whatsapp={whatsapp} index={i} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedSlider;