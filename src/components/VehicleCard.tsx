'use client';
import { MessageCircle, Fuel, Gauge, Settings2 } from "lucide-react";
import { motion } from "framer-motion";
import type { Vehicle } from "@/data/mockData";

interface VehicleCardProps {
  vehicle: Vehicle;
  whatsapp: string;
  index?: number;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(price);

const VehicleCard = ({ vehicle, whatsapp, index = 0 }: VehicleCardProps) => {
  const waMessage = encodeURIComponent(
    `Hola! Me interesa el ${vehicle.brand} ${vehicle.model} ${vehicle.year}. ¿Está disponible?`
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className="card-vehicle flex flex-col group"
    >
      <div className="relative overflow-hidden aspect-[16/10]">
        <img
          src={vehicle.image_url}
          alt={`${vehicle.brand} ${vehicle.model}`}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        {/* Gradient overlay on image */}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-60" />
        
        {vehicle.is_new && (
          <span className="absolute top-3 left-3 bg-primary text-primary-foreground text-[10px] font-bold uppercase px-2.5 py-1 rounded-md tracking-wider">
            Nuevo
          </span>
        )}
        
        {/* Price on image */}
        <div className="absolute bottom-3 left-3">
          <p className="text-foreground text-xl font-extrabold drop-shadow-lg">{formatPrice(vehicle.price)}</p>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <p className="text-primary text-[11px] font-semibold uppercase tracking-widest mb-1">
          {vehicle.brand} · {vehicle.year}
        </p>
        <h3 className="text-foreground font-bold text-lg leading-tight mb-3">
          {vehicle.model}
        </h3>
        
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
          <span className="flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5" />
            {vehicle.mileage.toLocaleString("es-AR")} km
          </span>
          <span className="flex items-center gap-1.5">
            <Fuel className="w-3.5 h-3.5" />
            {vehicle.fuel}
          </span>
          <span className="flex items-center gap-1.5">
            <Settings2 className="w-3.5 h-3.5" />
            {vehicle.transmission}
          </span>
        </div>

        <div className="mt-auto">
          <a
            href={`https://wa.me/${whatsapp}?text=${waMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary flex items-center justify-center gap-2 w-full py-2.5 text-sm"
          >
            <MessageCircle className="w-4 h-4" />
            Consultar
          </a>
        </div>
      </div>
    </motion.div>
  );
};

export default VehicleCard;
