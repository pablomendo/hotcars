export default function Dashboard() {
  const kpis = [
    { label: "Vehículos Activos", value: "24" },
    { label: "Mensajes", value: "12" },
    { label: "Flips Compartidos", value: "8" },
    { label: "Días Promedio Venta", value: "15" },
    { label: "Vehículo Buscado", value: "42" },
    { label: "Unidades Clavo", value: "3" },
  ];

  return (
    <main className="min-h-screen bg-[#0b1114] p-8 text-white font-sans tracking-tight">
      {/* Header con Logo Placeholder */}
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-2xl font-black tracking-tighter text-white">
          HOTCARS <span className="text-[#3b82f6]">PRO</span>
        </h1>
        <div className="px-4 py-2 bg-[#1a2c38] border border-[#374151] rounded-lg text-sm text-[#9ca3af]">
          Usuario: Pablo Mendo
        </div>
      </div>
      
      {/* Panel de 6 KPIs Reales (Grilla prolija) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-[#1a2c38] border border-[#374151] p-5 rounded-2xl transition-all hover:border-[#3b82f6]">
            <p className="text-xs font-medium text-[#9ca3af] uppercase mb-2 tracking-widest">{kpi.label}</p>
            <p className="text-3xl font-bold text-white">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Cuerpo Principal del Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Inventario (70%) */}
        <div className="lg:col-span-8 bg-[#1a2c38] border border-[#374151] rounded-3xl p-8 min-h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Inventario de Red</h2>
            <button className="text-sm text-[#3b82f6] font-semibold">Ver Todo</button>
          </div>
          <div className="flex items-center justify-center h-full border-2 border-dashed border-[#374151] rounded-2xl">
            <p className="text-[#4b5563]">Cargando unidades del marketplace...</p>
          </div>
        </div>

        {/* Alertas y Comunidad (30%) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#1a2c38] border border-[#374151] rounded-3xl p-6">
            <h2 className="text-lg font-bold text-white mb-4 italic text-orange-400">Inteligencia de Mercado</h2>
            <div className="space-y-4">
              <div className="p-4 bg-[#0b1114] border-l-4 border-blue-500 rounded-r-xl">
                <p className="text-xs text-[#9ca3af]">MATCH DETECTADO</p>
                <p className="text-sm text-white">Hay un pedido activo para tu Vento GLI.</p>
              </div>
              <div className="p-4 bg-[#0b1114] border-l-4 border-orange-500 rounded-r-xl">
                <p className="text-xs text-[#9ca3af]">UNIDAD CLAVO</p>
                <p className="text-sm text-white">La Hilux 2023 lleva 45 días sin consultas.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}