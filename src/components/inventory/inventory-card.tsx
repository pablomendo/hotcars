import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Car,
  Repeat,
  AlertTriangle,
  Pencil,
  Pause,
  Check,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent
} from '@/components/ui/tooltip';

export function InventoryCard({ item }: any) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(value);

  const salePrice = Number(item.salePrice);
  const purchasePrice = Number(item.purchasePrice);

  let potentialGain = salePrice - purchasePrice;

  if (item.type === 'Flip compartido') {
    potentialGain = potentialGain / 2;
  }

  if (!Number.isFinite(potentialGain) || potentialGain <= 0) {
    potentialGain = 0;
  }

  return (
    <Card className="bg-card/70 overflow-hidden flex">
      {/* Imagen */}
      <div className="relative w-1/3">
        <Image
          src={item.imageUrl}
          alt={item.name}
          fill
          className="object-cover"
        />

        <Badge
          className={`absolute bottom-1 left-1 text-xs ${
            item.type === 'Propia'
              ? 'bg-green-600/20 text-green-400 border-green-600/50'
              : 'bg-blue-600/20 text-blue-400 border-blue-600/50'
          }`}
          variant="outline"
        >
          {item.type === 'Propia' ? (
            <Car className="mr-1 h-3 w-3" />
          ) : (
            <Repeat className="mr-1 h-3 w-3" />
          )}
          {item.type}
        </Badge>
      </div>

      {/* Contenido */}
      <div className="w-2/3 p-3 flex flex-col justify-between relative">
        <div>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-sm truncate">{item.name}</h3>
              <p className="text-xs text-muted-foreground">
                {item.kms?.toLocaleString('es-AR')} km
              </p>
            </div>

            {/* Acciones */}
            <TooltipProvider>
              <div className="flex gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Editar</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Pause className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Pausar</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Check className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Vendido</TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>

          {/* Precios */}
          <div className="mt-2">
            <div className="flex justify-between items-end">
              <span className="font-bold text-sm">
                PV: {formatCurrency(salePrice)}
              </span>
              <span className="text-xs text-muted-foreground">
                PC: {formatCurrency(purchasePrice)}
              </span>
            </div>
          </div>
        </div>

        {/* Ganancia */}
        <div className="mt-2">
          <p className="text-xs text-muted-foreground">Ganancia Potencial:</p>
          <p className="font-bold text-green-400 text-sm">
            +{formatCurrency(potentialGain)}
          </p>
        </div>

        {/* En riesgo */}
        {item.status?.name === 'En riesgo' && (
          <Badge
            variant="outline"
            className="absolute bottom-1 right-1 bg-orange-600/20 text-orange-400 border-orange-600/50 text-xs"
          >
            <AlertTriangle className="mr-1 h-3 w-3" />
            En riesgo +45d
          </Badge>
        )}
      </div>
    </Card>
  );
}
