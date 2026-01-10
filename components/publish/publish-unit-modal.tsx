"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePublishModal } from "@/hooks/use-publish-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { UploadCloud, Sparkles, Image as ImageIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import marcas from "@/lib/marcas.json";
import modelos from "@/lib/modelos.json";

interface Model {
  id: number;
  name: string;
  brand_id: number;
}

export default function PublishUnitModal() {
  const { open, setOpen } = usePublishModal();

  const [selectedBrand, setSelectedBrand] = useState<number | null>(null);
  const [selectedBrandName, setSelectedBrandName] = useState("");
  const [selectedModelName, setSelectedModelName] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [publicationTitle, setPublicationTitle] = useState("");
  const [availableModels, setAvailableModels] = useState<Model[]>([]);

  useEffect(() => {
    if (selectedBrand) {
      const brand = marcas.find((m) => m.id === selectedBrand);
      setSelectedBrandName(brand ? brand.name : "");
      setAvailableModels(
        modelos.filter((m) => m.brand_id === selectedBrand)
      );
      setSelectedModelName("");
    } else {
      setAvailableModels([]);
      setSelectedBrandName("");
      setSelectedModelName("");
    }
  }, [selectedBrand]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

  const keyFeatures = [
    { id: "vtv", label: "VTV" },
    { id: "service", label: "Service al día" },
    { id: "gnc", label: "GNC" },
    { id: "power-windows", label: "Levanta vidrios" },
    { id: "central-locking", label: "Cierre centralizado" },
    { id: "accepts-trade-in", label: "Acepta permuta" },
    { id: "financing", label: "Financiación" },
  ];
  
  const fullTitle = `${selectedBrandName} ${selectedModelName} ${selectedYear} ${publicationTitle}`.trim();

  const PhotoPlaceholder = ({ label }: { label: string }) => (
    <div className="relative aspect-video flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors">
      <ImageIcon className="w-3 h-3 mb-0.5" />
      <span className="text-[9px] text-center">{label}</span>
      <input type="file" hidden />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-3 pb-0">
          <DialogTitle className="text-base font-semibold">
            Publicar Nueva Unidad
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-grow">
          <div className="p-3 space-y-3">

            {/* ================= DATOS DEL VEHÍCULO ================= */}
            <div className="p-3 border rounded-lg">
              <h3 className="text-sm font-semibold mb-2">
                Datos del vehículo
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 items-end">
                <div>
                  <Label className="text-xs">Marca</Label>
                  <Select onValueChange={(v) => setSelectedBrand(Number(v))}>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {marcas.map((m) => (
                        <SelectItem key={m.id} value={String(m.id)}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Modelo</Label>
                  <Select
                    disabled={!selectedBrand}
                    onValueChange={setSelectedModelName}
                    value={selectedModelName}
                  >
                    <SelectTrigger className="h-7 text-xs">
                       <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableModels.map((m) => (
                        <SelectItem key={m.id} value={m.name}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Año</Label>
                  <Select onValueChange={setSelectedYear}>
                    <SelectTrigger className="h-7 text-xs">
                       <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((y) => (
                        <SelectItem key={y} value={String(y)}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Versión / Trim</Label>
                  <Input className="h-7 text-xs" placeholder="Ej: Highline" />
                </div>
                <div>
                  <Label className="text-xs">Motor</Label>
                  <Input className="h-7 text-xs" placeholder="Ej: 1.6" />
                </div>
                <div>
                  <Label className="text-xs">Color</Label>
                  <Input className="h-7 text-xs" placeholder="Ej: Gris Plata" />
                </div>
                <div>
                  <Label className="text-xs">Kilometraje</Label>
                  <Input className="h-7 text-xs" type="number" placeholder="Ej: 80000" />
                </div>
                <div>
                  <Label className="text-xs">Transmisión</Label>
                   <Select>
                    <SelectTrigger className="h-7 text-xs">
                       <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="automatic">Automática</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Ubicación</Label>
                  <Input className="h-7 text-xs" placeholder="Ej: Palermo, CABA" />
                </div>
              </div>
            </div>

            {/* ================= PUNTOS CLAVE ================= */}
            <div className="p-3 border rounded-lg">
              <h3 className="text-sm font-semibold mb-2">
                Puntos clave del vehículo
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 items-center">
                {keyFeatures.map((f) => (
                  <div key={f.id} className="flex items-center gap-2">
                    <Checkbox id={f.id} />
                    <Label htmlFor={f.id} className="text-xs">
                      {f.label}
                    </Label>
                  </div>
                ))}
                <div>
                  <div className="flex items-center gap-2">
                      <Checkbox id="correa" />
                      <Label htmlFor="correa" className="text-xs">Cambio de Correa</Label>
                  </div>
                  <Input className="h-7 text-xs mt-1" type="number" placeholder="km" />
                </div>
              </div>
            </div>

            {/* ================= TÍTULO ================= */}
            <div className="p-3 border rounded-lg">
              <Label className="text-sm font-semibold text-left block">Título de la publicación</Label>
              <div className="text-center my-1">
                 <Badge variant="secondary" className="text-[10px] font-normal">Marca, Modelo y Año se agregan automáticamente</Badge>
              </div>
              <Input
                className="h-7 text-xs text-center"
                placeholder="Ej: Único dueño, Impecable estado"
                value={publicationTitle}
                onChange={(e) => setPublicationTitle(e.target.value)}
              />
              {fullTitle.trim() && (
                <div className="text-center mt-2">
                  <Badge className="text-xs font-normal">{fullTitle}</Badge>
                </div>
              )}
            </div>

            {/* ================= PRECIOS Y FLIP ================= */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 border rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-sm font-semibold">Precios</h3>
                  <RadioGroup defaultValue="usd" className="flex">
                      <div className="flex items-center space-x-1">
                          <RadioGroupItem value="ars" id="ars" />
                          <Label htmlFor="ars" className="text-xs">$ ARS</Label>
                      </div>
                      <div className="flex items-center space-x-1">
                          <RadioGroupItem value="usd" id="usd" />
                          <Label htmlFor="usd" className="text-xs">U$S DOLAR</Label>
                      </div>
                  </RadioGroup>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <Input className="h-7 text-xs" placeholder="Precio / Cliente / Compra" />
                    <Input className="h-7 text-xs" placeholder="Precio Venta (PV)" />
                </div>
              </div>
              <div className="p-3 border rounded-lg bg-muted/30">
                <h3 className="text-sm font-semibold mb-2">Compartir Flip con</h3>
                 <Input className="h-7 text-xs" placeholder="Buscar usuarios..." />
                 <div className="flex items-center space-x-2 mt-2">
                  <Checkbox id="authorize-flip" defaultChecked />
                  <Label htmlFor="authorize-flip" className="text-xs">Autorizar Flip compartido</Label>
                </div>
              </div>
            </div>


            {/* ================= FOTOS + DESCRIPCIÓN ================= */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
               <div className="p-3 border rounded-lg">
                 <h3 className="text-sm font-semibold mb-2">Agregar fotos</h3>
                 <div className="p-4 border-2 border-dashed rounded-lg cursor-pointer flex flex-col items-center justify-center text-center text-muted-foreground hover:bg-muted/50 transition-colors mb-2">
                   <UploadCloud className="w-6 h-6 mb-1" />
                   <h4 className="text-sm font-semibold">Arrastrar y soltar fotos</h4>
                   <p className="text-[10px]">o hacer clic para buscar</p>
                   <input type="file" multiple hidden />
                 </div>
                 <div className="grid grid-cols-3 gap-2">
                   <PhotoPlaceholder label="Portada" />
                   <PhotoPlaceholder label="Foto 1" />
                   <PhotoPlaceholder label="Foto 2" />
                   <PhotoPlaceholder label="Foto 3" />
                   <PhotoPlaceholder label="Foto 4" />
                   <PhotoPlaceholder label="Foto 5" />
                   <PhotoPlaceholder label="Foto 6" />
                   <PhotoPlaceholder label="Foto 7" />
                   <PhotoPlaceholder label="Foto 8" />
                 </div>
               </div>
                <div className="p-3 border rounded-lg flex flex-col">
                  <h3 className="text-sm font-semibold mb-2">Descripción</h3>
                  <Textarea className="flex-grow text-xs" />
                  <Button size="sm" className="mt-2 h-8 text-xs">
                    <Sparkles className="mr-2 h-3.5 w-3.5" />
                    Generar con IA
                  </Button>
                </div>
             </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 p-3 border-t">
          <Button variant="ghost" onClick={() => setOpen(false)} className="h-8 text-xs">
            Cerrar
          </Button>
          <Button variant="outline" className="h-8 text-xs">
            Guardar borrador
          </Button>
          <Button className="bg-[#4caf50] hover:bg-[#4caf50]/90 text-white h-8 text-xs">
            Publicar unidad
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
