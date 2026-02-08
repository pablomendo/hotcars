"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { ChevronRight, ArrowLeft, PlusCircle, RefreshCcw, Camera, ImageIcon, Sparkles, Info, MapPin, Share2, ChevronDown, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation"; 

import Header from "../../components/ui/Header"; 

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = 'https://xkwkgcjgxjvidiwthwbr.supabase.co';
const supabaseAnonKey = 'sb_publishable_Ou5RH-wPn0_LDs3F8hd-5w_5gSWvlDF';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const ALL_LOGO_BRANDS = [
  { name: "Volkswagen", logo: "/marcas/vw.png" },
  { name: "Ford", logo: "/marcas/ford.png" },
  { name: "Fiat", logo: "/marcas/fiat.png" },
  { name: "Toyota", logo: "/marcas/toyota.png" },
  { name: "Peugeot", logo: "/marcas/peugeot.png" },
  { name: "Chevrolet", logo: "/marcas/chevrolet.png" },
  { name: "BMW", logo: "/marcas/bmw.png" },
  { name: "Mercedes-Benz", logo: "/marcas/mercedes.png" },
  { name: "Renault", logo: "/marcas/renault.png" },
  { name: "Jeep", logo: "/marcas/jeep.png" },
  { name: "Audi", logo: "/marcas/audi.png" },
];

const categories = [
  { name: "Auto", icon: "/img/auto.png" },
  { name: "Pickup", icon: "/img/pickup.png" },
  { name: "Utilitario", icon: "/img/utilitario.png" },
  { name: "SUV", icon: "/img/suv.png" },
  { name: "Moto", icon: "/img/moto.png" },
  { name: "Camion", icon: "/img/camion.png" },
];

const HIGHLIGHTS_POOL = [
  "5 puertas", "3 puertas", "Caja automática", "Financiación",
  "GNC", "VTV", "Acepta permuta", "Ideal aplicaciones",
  "Único dueño", "Service oficial", "Full", "Butacas cuero"
];

const YEARS = Array.from({ length: 40 }, (_, i) => (2026 - i).toString());

export default function AddVehicleModal({ onClose }: { onClose?: () => void }) {
  const router = useRouter(); 
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedVersion, setSelectedVersion] = useState("");
  const [isManual, setIsManual] = useState(false);
  const [searchBrand, setSearchBrand] = useState("");
  const [searchModel, setSearchModel] = useState("");
  const [searchVersion, setSearchVersion] = useState("");
  const [km, setKm] = useState("");
  
  const [provincia, setProvincia] = useState("");
  const [localidad, setLocalidad] = useState("");
  const [shareUser, setShareUser] = useState("");

  const [selectedHighlights, setSelectedHighlights] = useState<string[]>([]);
  const [mainPhoto, setMainPhoto] = useState<string | null>(null);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [shadows, setShadows] = useState(100);
  const [iaAttempts, setIaAttempts] = useState(2);
  const [isGeneratingIA, setIsGeneratingIA] = useState(false);

  const [currency, setCurrency] = useState("ARS");
  const [pvStr, setPvStr] = useState("");
  const [pcStr, setPcStr] = useState("");
  const [flipperGain, setFlipperGain] = useState(0);
  const [ownerGain, setOwnerGain] = useState(0);
  const [description, setDescription] = useState("");
  const [openSection, setOpenSection] = useState<string | null>(null);

  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [availableVersions, setAvailableVersions] = useState<string[]>([]);

  const brandRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);
  const yearRef = useRef<HTMLDivElement>(null);
  const versionRef = useRef<HTMLDivElement>(null);
  const manualRef = useRef<HTMLDivElement>(null);
  const kmRef = useRef<HTMLDivElement>(null);
  const highlightsRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);
  const finalRef = useRef<HTMLDivElement>(null);

  const [vehiclePhotos, setVehiclePhotos] = useState<string[]>([]);

  useEffect(() => {
    if (selectedCategory) {
      fetch(`/api/base-autos?category=${selectedCategory.toUpperCase()}`)
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setAvailableBrands(data.sort()); });
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (selectedCategory && selectedBrand && !isManual) {
      fetch(`/api/base-autos?category=${selectedCategory.toUpperCase()}&brand=${selectedBrand.toUpperCase()}`)
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setAvailableModels(data.sort()); });
    }
  }, [selectedCategory, selectedBrand, isManual]);

  useEffect(() => {
    if (selectedCategory && selectedBrand && selectedModel && !isManual) {
      fetch(`/api/base-autos?category=${selectedCategory.toUpperCase()}&brand=${selectedBrand.toUpperCase()}&model=${selectedModel.toUpperCase()}`)
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setAvailableVersions(data.sort()); });
    }
  }, [selectedCategory, selectedBrand, selectedModel, isManual]);

  const dynamicTopBrands = useMemo(() => {
    return ALL_LOGO_BRANDS.filter((brand) =>
      availableBrands.some((b) => {
        const normalizedJsonBrand = b.toUpperCase().replace(/[- ]/g, "");
        const normalizedLogoBrand = brand.name.toUpperCase().replace(/[- ]/g, "");
        return normalizedJsonBrand.includes(normalizedLogoBrand) || normalizedLogoBrand.includes(normalizedJsonBrand);
      })
    );
  }, [availableBrands]);

  const filteredHighlights = useMemo(() => {
    let tags = [...HIGHLIGHTS_POOL];
    if (selectedCategory === "Pickup") {
      tags = tags.filter(h => h !== "Ideal aplicaciones" && h !== "5 puertas" && h !== "3 puertas");
      tags = ["4x4", "4x2", "Cabina Simple", ...tags];
    } else if (selectedCategory === "Utilitario") {
      tags = tags.filter(h => h !== "5 puertas" && h !== "3 puertas");
      tags = ["Furgon", "7 Asientos", ...tags];
    } else if (selectedCategory === "SUV") {
      tags = tags.filter(h => h !== "5 puertas" && h !== "3 puertas");
      tags = ["4x4", "7 Asientos", ...tags];
    } else if (selectedCategory === "Moto") { return []; }
    else if (selectedCategory === "Camion") {
      tags = ["Cabina Simple", "Cabina Doble", "Cabina Triple", "Volcador", "Furgon", "Caja Abierta", "Caja Cerrada", "Caja Refrigerada", "4x2", "4x4", "6x4", "8x4"];
    }
    return tags.slice(0, 12);
  }, [selectedCategory]);

  const toggleHighlight = (tag: string) => {
    setSelectedHighlights(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const calculateGains = (valPv: number, valPc: number, currentCurrency: string) => {
    const totalProfit = valPv - valPc;
    setOwnerGain(totalProfit > 0 ? totalProfit : 0);
    if (totalProfit <= 0) { setFlipperGain(0); return; }
    let calcFlipper = totalProfit * 0.4;
    if (currentCurrency === "USD") { if (calcFlipper > 500) calcFlipper = 500; }
    else { if (calcFlipper > 700000) calcFlipper = 700000; }
    setFlipperGain(calcFlipper);
  };

  const formatPrice = (value: string) => {
    const numeric = value.replace(/\D/g, "");
    return numeric.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handlePriceChange = (value: string, type: "pv" | "pc") => {
    const formatted = formatPrice(value);
    const numericInput = Number(value.replace(/\D/g, ""));
    if (type === "pv") {
      setPvStr(formatted);
      calculateGains(numericInput, Number(pcStr.replace(/\D/g, "")), currency);
    } else {
      setPcStr(formatted);
      calculateGains(Number(pvStr.replace(/\D/g, "")), numericInput, currency);
    }
  };

  useEffect(() => {
    const numPv = Number(pvStr.replace(/\D/g, ""));
    const numPc = Number(pcStr.replace(/\D/g, ""));
    calculateGains(numPv, numPc, currency);
  }, [currency]);

  const smartScroll = (ref: React.RefObject<HTMLDivElement>) => {
    setTimeout(() => {
      if (ref.current) {
        const yOffset = -120; 
        const y = ref.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    }, 200);
  };

  const handleKmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    setKm(value.replace(/\B(?=(\d{3})+(?!\d))/g, "."));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    e.preventDefault();
    let files: FileList | null = null;
    if ('dataTransfer' in e) files = (e as React.DragEvent).dataTransfer.files;
    else files = (e.target as HTMLInputElement).files;

    if (files) {
      const remainingSlots = 14 - vehiclePhotos.length;
      const filesToProcess = Array.from(files).slice(0, remainingSlots);

      filesToProcess.forEach(file => {
        const reader = new FileReader();
        reader.onload = (upload) => {
          const result = upload.target?.result as string;
          setVehiclePhotos(prev => {
            if (prev.length < 14) {
              const newPhotos = [...prev, result];
              setMainPhoto(newPhotos[0]);
              return newPhotos;
            }
            return prev;
          });
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const swapPhotos = (index: number) => {
    if (index === 0 || index >= vehiclePhotos.length) return;
    setVehiclePhotos(prev => {
      const newPhotos = [...prev];
      const temp = newPhotos[0];
      newPhotos[0] = newPhotos[index];
      newPhotos[index] = temp;
      setMainPhoto(newPhotos[0]);
      return newPhotos;
    });
  };

  const removePhoto = (index: number) => {
    setVehiclePhotos(prev => {
      const newPhotos = prev.filter((_, i) => i !== index);
      setMainPhoto(newPhotos.length > 0 ? newPhotos[0] : null);
      return newPhotos;
    });
  };

  const resetAll = () => {
    setStep(1); setSelectedCategory(""); setSelectedBrand(""); setSelectedModel("");
    setSelectedYear(""); setSelectedVersion(""); setKm(""); setMainPhoto(null);
    setVehiclePhotos([]);
    setSelectedHighlights([]); setPvStr(""); setPcStr(""); setDescription(""); setIsManual(false);
    setProvincia(""); setLocalidad(""); setShareUser("");
    setOpenSection(null); 
  };

  const handleGenerateIA = async () => {
    if (!selectedBrand || !selectedModel || iaAttempts === 0 || isGeneratingIA) return;
    
    setIsGeneratingIA(true);
    try {
      const res = await fetch("/api/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: selectedBrand,
          model: selectedModel,
          year: selectedYear,
          km: km,
          highlights: selectedHighlights,
          version: selectedVersion
        }),
      });

      const data = await res.json();
      if (data.text) {
        setDescription(data.text);
        setIaAttempts(prev => prev - 1);
      } else {
        alert(data.error || "No se pudo generar la descripción");
      }
    } catch (err) {
      alert("Error de conexión con la IA");
    } finally {
      setIsGeneratingIA(false);
    }
  };

  const finalizarPublicacion = async () => {
    try {
      const { data, error } = await supabase
        .from('inventario')
        .insert([
          {
            categoria: selectedCategory,
            marca: selectedBrand,
            modelo: selectedModel,
            version: selectedVersion,
            anio: selectedYear,
            km: parseInt(km.replace(/\D/g, "") || "0"),
            provincia: provincia,
            localidad: localidad,
            moneda: currency,
            pv: parseFloat(pvStr.replace(/\D/g, "") || "0"),
            pc: parseFloat(pcStr.replace(/\D/g, "") || "0"),
            ganancia_flipper: flipperGain,
            ganancia_dueno: ownerGain,
            descripcion: description,
            estado: "ACTIVO",
            compartido_con: shareUser,
            fotos: vehiclePhotos,
            puntos_clave: selectedHighlights,
            acepta_permuta: selectedHighlights.includes("Acepta permuta"),
            financiacion: selectedHighlights.includes("Financiación")
          }
        ]);

      if (error) throw error;
      alert("¡Publicación guardada exitosamente!");
      
      if (onClose) onClose();
      router.push("/inventario");
      resetAll();
    } catch (error: any) {
      alert("Error al conectar con Supabase: " + error.message);
    }
  };

  const inputClassName = "w-full h-12 bg-white uppercase font-bold text-gray-800 border-gray-200 focus:border-[#00984a] focus:ring-0 outline-none transition-all border rounded-xl px-4 shadow-sm";

  return (
    <div className="min-h-screen w-full font-sans bg-[#f0f2f5] flex flex-col items-center">
      <Header />
      
      {step === 1 && (
        <div className="w-full animate-in fade-in duration-500 pt-20">
          <div className="w-full h-64 md:h-72 flex flex-col pt-16 md:pt-20 items-center text-center px-6 bg-[#00984a]">
            <h1 className="text-2xl md:text-4xl font-google font-medium text-white mb-2 tracking-tight">Empecemos a trabajar!</h1>
            <p className="text-base md:text-xl font-google font-medium text-white opacity-95 tracking-tight">¿Qué tipo de unidad vas a publicar hoy?</p>
          </div>
          <div className="p-4 md:p-6 -mt-24 md:-mt-28">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 md:gap-5 max-w-5xl mx-auto">
              {categories.map((cat) => (
                <div key={cat.name} className="cursor-pointer bg-white rounded-xl flex flex-col items-center justify-between p-4 aspect-square shadow-lg active:scale-95 transition-transform" onClick={() => { setSelectedCategory(cat.name); setStep(2); }}>
                  <div className="flex-1 flex items-center justify-center w-full">
                    <div className="relative w-[130px] h-[95px] md:w-[145px] md:h-[105px]">
                        <Image src={cat.icon} alt={cat.name} fill className="object-contain" />
                    </div>
                  </div>
                  <p className="text-[11px] md:text-[13px] font-extrabold text-gray-700 uppercase mt-2">{cat.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {step >= 2 && (
        <div className="w-full max-w-[590px] px-4 pt-24 pb-20 flex flex-col items-center gap-10 animate-in fade-in duration-500">
          <div className="flex justify-between items-center w-full">
            <button onClick={() => { if (step === 2) { if (onClose) onClose(); else router.push('/inventario'); } else { setStep(step - 1); } }} className="flex items-center font-bold text-[11px] uppercase text-[#2563eb]"><ArrowLeft className="mr-1 h-3.5 w-3.5" /> Volver</button>
            <button onClick={resetAll} className="flex items-center font-bold text-[11px] uppercase text-red-500 ml-auto"><RefreshCcw className="mr-1 h-3.5 w-3.5" /> Reiniciar</button>
          </div>

          <div ref={brandRef} className="w-full text-left">
            <h2 className="text-xl font-extrabold uppercase text-gray-900 mb-6 tracking-tight font-google">¿Qué marca es tu {selectedCategory}?</h2>
            {selectedBrand && !isManual ? (
              <div className="bg-white p-4 rounded-xl border-2 border-[#00984a] flex items-center justify-between shadow-sm">
                <span className="text-lg font-bold text-gray-800 uppercase">{selectedBrand}</span>
                <button onClick={() => { setSelectedBrand(""); setIsManual(false); setSelectedModel(""); setSelectedYear(""); setSelectedVersion(""); setStep(2); }} className="text-[10px] font-bold text-[#2563eb] uppercase underline">Cambiar</button>
              </div>
            ) : !isManual ? (
              <>
                <div className="flex flex-wrap justify-center gap-2 mb-8">
                  {dynamicTopBrands.map((brand) => (
                    <button key={brand.name} onClick={() => { setSelectedBrand(brand.name.toUpperCase()); smartScroll(modelRef); }} className="bg-white rounded-lg border border-gray-100 flex items-center justify-center shadow-sm hover:border-[#00984a] transition-all p-1 h-[75px] w-[75px]">
                      <div className="relative w-12 h-12"><Image src={brand.logo} alt={brand.name} fill className="object-contain" /></div>
                    </button>
                  ))}
                </div>
                <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                  <div className="p-4 border-b border-gray-50"><input placeholder="BUSCAR OTRA MARCA..." className={inputClassName} value={searchBrand} onChange={(e) => setSearchBrand(e.target.value.toUpperCase())} /></div>
                  <div className="divide-y divide-gray-50 max-h-[250px] overflow-y-auto">
                    {availableBrands.filter(b => b.includes(searchBrand)).map((item) => (
                      <button key={item} onClick={() => { setSelectedBrand(item); smartScroll(modelRef); }} className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 font-semibold uppercase text-sm text-gray-700">{item} <ChevronRight className="h-4 w-4" /></button>
                    ))}
                    <button onClick={() => { setIsManual(true); smartScroll(manualRef); }} className="w-full flex items-center justify-between px-5 py-4 bg-orange-50 font-bold uppercase text-xs text-orange-600">NO ENCUENTRO MI MARCA <PlusCircle className="h-4 w-4" /></button>
                  </div>
                </div>
              </>
            ) : null}
          </div>

          {isManual && (
            <div ref={manualRef} className="w-full animate-in zoom-in-95 duration-300">
               <div className="bg-white p-8 rounded-[32px] shadow-xl border-2 border-[#00984a] flex flex-col gap-6">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-black uppercase text-gray-900 tracking-tight">Características Principales</h2>
                    <p className="text-xs font-bold text-gray-400 lowercase">( Completá la información manual )</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Marca</label>
                      <input placeholder="MARCA" className={inputClassName} value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value.toUpperCase())} />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Modelo</label>
                      <input placeholder="MODELO" className={inputClassName} value={selectedModel} onChange={(e) => setSelectedModel(e.target.value.toUpperCase())} />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Año</label>
                      <input placeholder="AÑO" className={inputClassName} value={selectedYear} onChange={(e) => setSelectedYear(e.target.value.toUpperCase())} />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Versión</label>
                      <input placeholder="VERSIÓN" className={inputClassName} value={selectedVersion} onChange={(e) => setSelectedVersion(e.target.value.toUpperCase())} />
                    </div>
                  </div>
                  <button onClick={() => { setIsManual(false); smartScroll(kmRef); }} className="w-full bg-[#00984a] text-white font-black py-5 rounded-2xl uppercase shadow-lg hover:bg-[#007a3b] transition-all">Siguiente</button>
               </div>
            </div>
          )}

          {selectedBrand && !isManual && (
            <div ref={modelRef} className="w-full text-left animate-in fade-in">
              <h2 className="text-xl font-extrabold uppercase text-gray-900 mb-6 tracking-tight font-google">¿Cuál es el modelo?</h2>
              {selectedModel ? (
                <div className="bg-white p-4 rounded-xl border-2 border-[#00984a] flex items-center justify-between shadow-sm">
                  <span className="text-lg font-bold text-gray-800 uppercase">{selectedModel}</span>
                  <button onClick={() => { setSelectedModel(""); setSelectedYear(""); setSelectedVersion(""); setStep(2); }} className="text-[10px] font-bold text-[#2563eb] uppercase underline">Cambiar</button>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                  <div className="p-4 border-b border-gray-50"><input placeholder="BUSCAR MODELO..." className={inputClassName} value={searchModel} onChange={(e) => setSearchModel(e.target.value.toUpperCase())} /></div>
                  <div className="divide-y divide-gray-50 max-h-[200px] md:max-h-[450px] overflow-y-auto">
                    {availableModels.filter(m => m.includes(searchModel)).map((m) => (
                      <button key={m} onClick={() => { setSelectedModel(m); smartScroll(yearRef); }} className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 font-semibold uppercase text-sm text-gray-700">{m} <ChevronRight className="h-4 w-4" /></button>
                    ))}
                    <button onClick={() => { setIsManual(true); smartScroll(manualRef); }} className="w-full flex items-center justify-between px-5 py-4 bg-orange-50 font-bold uppercase text-xs text-orange-600">NO ENCUENTRO EL MODELO <PlusCircle className="h-4 w-4" /></button>
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedModel && !isManual && (
            <div ref={yearRef} className="w-full text-left animate-in fade-in">
              <h2 className="text-xl font-extrabold uppercase text-gray-900 mb-6 tracking-tight font-google">¿De qué año es?</h2>
              {selectedYear ? (
                <div className="bg-white p-4 rounded-xl border-2 border-[#00984a] flex items-center justify-between shadow-sm">
                  <span className="text-lg font-bold text-gray-800 uppercase">{selectedYear}</span>
                  <button onClick={() => { setSelectedYear(""); setSelectedVersion(""); setStep(2); }} className="text-[10px] font-bold text-[#2563eb] uppercase underline">Cambiar</button>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {YEARS.map((y) => (
                    <button key={y} onClick={() => { setSelectedYear(y); smartScroll(versionRef); }} className="bg-white py-3 rounded-lg border border-gray-100 font-bold text-gray-700 hover:border-[#00984a] active:scale-95 transition-all">{y}</button>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedYear && !isManual && (
            <div ref={versionRef} className="w-full text-left animate-in fade-in">
              <h2 className="text-xl font-extrabold uppercase text-gray-900 mb-6 tracking-tight font-google">¿Qué versión es?</h2>
              {selectedVersion ? (
                <div className="bg-white p-4 rounded-xl border-2 border-[#00984a] flex items-center justify-between shadow-sm">
                  <span className="text-lg font-bold text-gray-800 uppercase">{selectedVersion}</span>
                  <button onClick={() => { setSelectedVersion(""); setStep(2); }} className="text-[10px] font-bold text-[#2563eb] uppercase underline">Cambiar</button>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                  <div className="p-4 border-b border-gray-50"><input placeholder="BUSCAR VERSIÓN..." className={inputClassName} value={searchVersion} onChange={(e) => setSearchVersion(e.target.value.toUpperCase())} /></div>
                  <div className="divide-y divide-gray-50 max-h-[200px] md:max-h-[450px] overflow-y-auto">
                    {availableVersions.filter(v => v.includes(searchVersion)).map((v) => (
                      <button key={v} onClick={() => { setSelectedVersion(v); smartScroll(kmRef); }} className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 font-semibold uppercase text-sm text-gray-700 text-left">{v} <ChevronRight className="h-4 w-4" /></button>
                    ))}
                    <button onClick={() => { setIsManual(true); smartScroll(manualRef); }} className="w-full flex items-center justify-between px-5 py-4 bg-orange-50 font-bold uppercase text-xs text-orange-600">NO ENCUENTRO LA VERSIÓN <PlusCircle className="h-4 w-4" /></button>
                  </div>
                </div>
              )}
            </div>
          )}

          {((selectedVersion && !isManual) || (selectedYear && isManual === false && selectedBrand !== "" && selectedModel !== "")) && (
            <div ref={kmRef} className="w-full text-left animate-in fade-in">
              <h2 className="text-xl font-extrabold uppercase text-gray-900 mb-6 tracking-tight font-google">Kilometros y Ubicacion</h2>
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col gap-6">
                <div className="flex flex-col gap-3">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2 ml-1">¿Cuantos kilometros tiene?</label>
                  <input type="text" placeholder="EJ: 45.000" className="w-full h-12 bg-white uppercase font-bold text-gray-800 border-gray-200 rounded-xl px-4 shadow-sm text-sm outline-none focus:border-[#00984a] transition-all border" value={km} onChange={handleKmChange} />
                </div>
                <div className="flex flex-col gap-3 pt-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2 ml-1">
                      <MapPin size={12} className="text-gray-400"/> selecciona los botones o escribe ubicacion del vehiculo
                    </label>
                    <div className="flex flex-wrap gap-2 mb-1 px-1 items-center">
                        <button type="button" onClick={() => setProvincia("BUENOS AIRES")} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all border flex items-center gap-1.5 ${provincia === "BUENOS AIRES" ? "bg-[#2563eb] border-[#2563eb] text-white shadow-md" : "bg-gray-100 border-gray-200 text-gray-500"}`}><div className={`w-1 h-1 rounded-full ${provincia === "BUENOS AIRES" ? "bg-white animate-pulse" : "bg-gray-300"}`}></div>PROVINCIA: BUENOS AIRES</button>
                        <button type="button" onClick={() => setLocalidad("MERLO")} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all border flex items-center gap-1.5 ${localidad === "MERLO" ? "bg-[#2563eb] border-[#2563eb] text-white shadow-md" : "bg-gray-100 border-gray-200 text-gray-500"}`}><div className={`w-1 h-1 rounded-full ${localidad === "MERLO" ? "bg-white animate-pulse" : "bg-gray-300"}`}></div>LOCALIDAD: MERLO</button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <input type="text" placeholder="PROVINCIA" value={provincia} onChange={(e) => setProvincia(e.target.value.toUpperCase())} className="w-full h-12 bg-white uppercase font-bold text-gray-800 border-gray-200 rounded-xl px-4 shadow-sm text-xs outline-none focus:border-gray-400" />
                        <input type="text" placeholder="LOCALIDAD" value={localidad} onChange={(e) => setLocalidad(e.target.value.toUpperCase())} className="w-full h-12 bg-white uppercase font-bold text-gray-800 border-gray-200 rounded-xl px-4 shadow-sm text-xs outline-none focus:border-gray-400" />
                    </div>
                </div>
                <div className="mt-2 p-5 bg-gray-50 border border-gray-200 rounded-2xl space-y-4 shadow-inner">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-2"><Share2 size={12} className="text-gray-400"/> Flip Compartido</label>
                        <button type="button" onClick={() => shareUser ? setShareUser("") : setShareUser("PUBLICO")} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all border ${shareUser ? "bg-[#2563eb] border-[#2563eb] text-white shadow-md" : "bg-gray-200 border-gray-300 text-gray-500"}`}>{shareUser ? "Flip activado" : "Activar Flip"}</button>
                    </div>
                    <div className={`relative transition-all duration-300 ${shareUser ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10"><span className="text-[7px] font-black text-[#2563eb] uppercase">compartir primero con</span></div>
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1f2937] font-black text-sm">@</div>
                        <input type="text" placeholder="tipear usuario..." value={shareUser === "PUBLICO" ? "" : shareUser} onChange={(e) => setShareUser(e.target.value)} className="w-full h-12 bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-xs outline-none focus:border-[#1f2937] text-gray-800 font-bold uppercase shadow-sm transition-all" />
                    </div>
                </div>
                <button onClick={() => { setStep(2.5); smartScroll(highlightsRef); }} className="w-full mt-2 bg-[#00984a] text-white font-black py-4 rounded-xl uppercase shadow-md active:scale-95 transition-all">Siguiente</button>
              </div>
            </div>
          )}

          {step >= 2.5 && (
            <div ref={highlightsRef} className="w-full text-left animate-in fade-in duration-500">
              <h2 className="text-xl font-extrabold uppercase text-gray-900 mb-6 tracking-tight font-google text-center md:text-left">Condición de Venta, Puntos clave y Descripción</h2>
              <div className="bg-white p-6 rounded-[32px] shadow-lg border border-gray-100 flex flex-col gap-6">
                
                {/* 1. SECCIÓN: CONDICIÓN DE VENTA */}
                <div className="flex flex-col gap-3">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Condición de venta</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Acepta permuta", "Financiación"].map((tag) => (
                      <button key={tag} onClick={() => toggleHighlight(tag)} className={`h-11 px-2 rounded-xl text-[11px] font-bold uppercase transition-all border flex items-center justify-center text-center leading-tight ${selectedHighlights.includes(tag) ? "bg-[#00984a] border-[#00984a] text-white shadow-md" : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"}`}>{tag}</button>
                    ))}
                  </div>
                </div>

                {/* 2. SECCIÓN: PUNTOS CLAVE */}
                <div className="flex flex-col gap-3">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Puntos clave</label>
                  {filteredHighlights.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {filteredHighlights.filter(h => h !== "Acepta permuta" && h !== "Financiación").map((tag) => (
                        <button key={tag} onClick={() => toggleHighlight(tag)} className={`h-11 px-2 rounded-xl text-[10px] font-bold uppercase transition-all border flex items-center justify-center text-center leading-tight ${selectedHighlights.includes(tag) ? "bg-[#00984a] border-[#00984a] text-white shadow-md" : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"}`}>{tag}</button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. SECCIÓN: DESCRIPCIÓN */}
                <div className="flex flex-col gap-3">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Descripción</label>
                  <div className="w-full flex flex-col items-center gap-4">
                    <div className="w-full bg-[#f8f9fa] border border-gray-200 rounded-2xl p-4 flex flex-col items-center gap-2 shadow-inner">
                        <div className="bg-gray-200 text-gray-500 text-[8px] font-black px-3 py-0.5 rounded-full uppercase tracking-tighter">presiona boton azul para generar descripcion por ia</div>
                        <textarea className="w-full min-h-[100px] bg-transparent text-sm text-gray-700 outline-none resize-none text-center font-medium" placeholder="..." value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                    <button 
                      onClick={handleGenerateIA} 
                      disabled={isGeneratingIA || iaAttempts === 0}
                      className="bg-blue-600 text-white font-black py-3 px-8 rounded-xl text-[10px] uppercase flex items-center gap-2 shadow-lg active:scale-95 transition-all w-fit disabled:opacity-50"
                    >
                      <Sparkles className={`h-4 w-4 ${isGeneratingIA ? "animate-spin" : ""}`} /> 
                      {isGeneratingIA ? "Generando..." : "Generar descripción"}
                    </button>
                  </div>
                </div>

                {step === 2.5 && <button onClick={() => { setStep(3); smartScroll(photoRef); }} className="w-full bg-[#00984a] text-white font-black py-4 rounded-xl uppercase shadow-md active:scale-95 transition-all">Siguiente</button>}
                {step > 2.5 && <div className="w-full flex justify-end"><button onClick={() => {setStep(2.5); smartScroll(highlightsRef);}} className="text-[10px] font-bold text-[#2563eb] uppercase underline">Editar descripción</button></div>}
              </div>
            </div>
          )}

          {step >= 3 && step < 4 && (
            <div ref={photoRef} className="w-full text-left animate-in fade-in duration-500">
              <h2 className="text-xl font-extrabold uppercase text-gray-900 mb-1 tracking-tight font-google">Fotos del vehículo</h2>
              <div className="bg-white p-6 rounded-lg shadow-xl border border-gray-100 flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-6 gap-3 items-start">
                    <div onDragOver={(e) => e.preventDefault()} onDrop={handlePhotoUpload} className="col-span-4 aspect-[4/3] bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center relative group overflow-hidden shadow-inner">
                      {vehiclePhotos[0] ? (
                        <div className="relative w-full h-full">
                           <img src={vehiclePhotos[0]} alt="Principal" className="w-full h-full object-contain object-center" style={{ filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${shadows}%)` }} />
                          <button onClick={() => removePhoto(0)} className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"><RefreshCcw className="h-4 w-4" /></button>
                        </div>
                      ) : (
                        <>
                          <input type="file" multiple onChange={handlePhotoUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" accept="image/*" />
                          <Camera className="h-10 w-10 text-gray-200 mb-3" />
                          <p className="text-[10px] font-bold text-gray-400 uppercase text-center max-w-[150px] leading-relaxed">Subir o arrastrar fotos</p>
                        </>
                      )}
                      <div className="absolute top-3 left-3 text-[#00984a] text-[9px] font-black uppercase tracking-wider">Foto Portada</div>
                    </div>
                    <div className="col-span-2 flex flex-col gap-3">
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-col gap-1">
                          <span className="text-[8px] font-black text-gray-400 uppercase">Brillo</span>
                          <div className="flex items-center bg-gray-100 rounded-lg overflow-hidden h-8 shadow-inner">
                            <button onClick={() => setBrightness(prev => Math.max(0, prev - 10))} className="flex-1 text-gray-500 font-bold text-lg">-</button>
                            <button onClick={() => setBrightness(prev => Math.min(200, prev + 10))} className="flex-1 text-gray-500 font-bold text-lg border-l border-gray-200">+</button>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[8px] font-black text-gray-400 uppercase">Contraste</span>
                          <div className="flex items-center bg-gray-100 rounded-lg overflow-hidden h-8 shadow-inner">
                            <button onClick={() => setContrast(prev => Math.max(0, prev - 10))} className="flex-1 text-gray-500 font-bold text-lg">-</button>
                            <button onClick={() => setContrast(prev => Math.min(200, prev + 10))} className="flex-1 text-gray-500 font-bold text-lg border-l border-gray-200">+</button>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[8px] font-black text-gray-400 uppercase">Sombras</span>
                          <div className="flex items-center bg-gray-100 rounded-lg overflow-hidden h-8 shadow-inner">
                            <button onClick={() => setShadows(prev => Math.max(0, prev - 10))} className="flex-1 text-gray-500 font-bold text-lg">-</button>
                            <button onClick={() => setShadows(prev => Math.min(200, prev + 10))} className="flex-1 text-gray-500 font-bold text-lg border-l border-gray-200">+</button>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[1, 2].map((i) => (
                          <div key={i} className="aspect-square bg-gray-50 rounded-lg border-2 border-dashed border-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors relative group overflow-hidden">
                            {vehiclePhotos[i] ? (
                              <>
                                <img src={vehiclePhotos[i]} alt={`Photo ${i}`} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                                  <button onClick={() => swapPhotos(i)} className="text-[8px] font-black text-white uppercase bg-[#00984a] px-2 py-1 rounded">Portada</button>
                                  <button onClick={() => removePhoto(i)} className="text-[8px] font-black text-white uppercase bg-red-500 px-2 py-1 rounded">Borrar</button>
                                </div>
                              </>
                            ) : (
                              <>
                                <input type="file" multiple onChange={handlePhotoUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" accept="image/*" />
                                <ImageIcon className="h-4 w-4 text-gray-200" />
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-6 gap-3">
                    {[3, 4, 5, 6, 7, 8].map((i) => (
                      <div key={i} className="aspect-square bg-gray-50 rounded-lg border-2 border-dashed border-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors relative group overflow-hidden">
                        {vehiclePhotos[i] ? (
                          <>
                            <img src={vehiclePhotos[i]} alt={`Photo ${i}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                              <button onClick={() => swapPhotos(i)} className="text-[8px] font-black text-white uppercase bg-[#00984a] px-2 py-1 rounded">Portada</button>
                              <button onClick={() => removePhoto(i)} className="text-[8px] font-black text-white uppercase bg-red-500 px-2 py-1 rounded">Borrar</button>
                            </div>
                          </>
                        ) : (
                          <>
                            <input type="file" multiple onChange={handlePhotoUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" accept="image/*" />
                            <ImageIcon className="h-4 w-4 text-gray-200" />
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-6 gap-3">
                    {[9, 10, 11, 12, 13, 14].map((i) => (
                      <div key={i} className="aspect-square bg-gray-50 rounded-lg border-2 border-dashed border-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors relative group overflow-hidden">
                        {vehiclePhotos[i] ? (
                          <>
                            <img src={vehiclePhotos[i]} alt={`Photo ${i}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                              <button onClick={() => swapPhotos(i)} className="text-[8px] font-black text-white uppercase bg-[#00984a] px-2 py-1 rounded">Portada</button>
                              <button onClick={() => removePhoto(i)} className="text-[8px] font-black text-white uppercase bg-red-500 px-2 py-1 rounded">Borrar</button>
                            </div>
                          </>
                        ) : (
                          <>
                            <input type="file" multiple onChange={handlePhotoUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" accept="image/*" />
                            <ImageIcon className="h-4 w-4 text-gray-200" />
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-4 mt-2">
                  <button onClick={() => iaAttempts > 0 && setIaAttempts(prev => prev - 1)} disabled={iaAttempts === 0} className={`w-fit self-center py-1.5 px-4 rounded-lg font-bold uppercase text-[9px] flex items-center justify-center gap-2 transition-all shadow-sm ${iaAttempts > 0 ? "bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] text-white hover:scale-[1.01]" : "bg-gray-200 text-gray-400 shadow-none"}`}><Sparkles className={`h-3 w-3 ${iaAttempts > 0 ? "animate-pulse" : ""}`} />Mejorar portada IA ({iaAttempts})</button>
                  <button disabled={vehiclePhotos.length === 0} onClick={() => {setStep(4); smartScroll(finalRef);}} className={`w-full font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors uppercase shadow-md active:scale-95 ${vehiclePhotos.length > 0 ? 'bg-[#00984a] text-white' : 'bg-gray-200 text-gray-400 shadow-none'}`}>Siguiente</button>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div ref={finalRef} className="w-full text-left animate-in fade-in duration-500 pb-10">
              <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div 
                  onClick={() => setOpenSection(openSection === 'fotos' ? null : 'fotos')} 
                  className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-black uppercase text-gray-500 tracking-widest">Fotos</span>
                    {vehiclePhotos[0] && (
                      <div className="w-6 h-6 rounded bg-gray-200 overflow-hidden border border-gray-300">
                        <img src={vehiclePhotos[0]} alt="Thumb" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                  {openSection === 'fotos' ? (
                    <ChevronDown size={18} className="text-[#00984a]"/>
                  ) : (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setStep(3); }} 
                      className="text-[10px] font-bold text-[#2563eb] uppercase underline"
                    >
                      Editar
                    </button>
                  )}
                </div>
                {openSection === 'fotos' && (
                  <div className="p-4 border-t border-gray-100 animate-in slide-in-from-top duration-300 flex justify-center">
                    <div className="w-32 aspect-video relative rounded-lg overflow-hidden border border-gray-200">
                      <img src={vehiclePhotos[0] || ""} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  </div>
                )}
              </div>

              <h2 className="text-xl font-extrabold uppercase text-gray-900 mb-6 tracking-tight font-google">Finalizar Publicación</h2>
              <div className="bg-white p-8 rounded-lg shadow-xl border border-gray-100 flex flex-col gap-8">
                <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit">
                    {["ARS", "USD"].map(m => (<button key={m} onClick={() => setCurrency(m)} className={`px-6 py-2 rounded-lg text-xs font-black transition-all ${currency === m ? "bg-white shadow-sm text-[#00984a]" : "text-gray-400"}`}>{m}</button>))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase">Precio Venta (PV)</label>
                    <input type="text" className={inputClassName} placeholder="0.00" value={pvStr} onChange={(e) => handlePriceChange(e.target.value, "pv")} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase">Precio Costo (PC)</label>
                    <input type="text" className={inputClassName} placeholder="0.00" value={pcStr} onChange={(e) => handlePriceChange(e.target.value, "pc")} />
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-5 border border-gray-100 flex flex-col items-center">
                  <div className="grid grid-cols-2 gap-8 w-full mb-4">
                    <div className="flex flex-col gap-1 opacity-50">
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter text-center">Comisión Flipper (Info)</span>
                      <div className="bg-transparent font-bold text-lg text-gray-400 py-1 uppercase text-center">{currency} {flipperGain.toLocaleString()}</div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest text-center">Mi Ganancia Real</span>
                      <div className="text-xl font-black text-[#00984a] py-1 uppercase text-center">{currency} {ownerGain.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="text-[#00984a] text-[10px] font-black uppercase text-center">Ganancia por esta unidad</div>
                </div>
                <div className="flex flex-col gap-4 border-t border-gray-100 pt-6">
                  <button onClick={finalizarPublicacion} className="w-full bg-[#00984a] text-white font-black py-5 rounded-lg text-sm uppercase shadow-lg hover:bg-[#007a3b] transition-all active:scale-95">Finalizar y Publicar</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}