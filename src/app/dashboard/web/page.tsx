'use client';

import { useState } from 'react';
import { mockUser } from '@/data/mock';
import { Globe, Share2, Copy, Sparkles, LayoutTemplate } from 'lucide-react';

export default function MiWebPage() {
    const [enabled, setEnabled] = useState(mockUser.isPublicWebEnabled);
    const publicUrl = `hotcars.com.ar/u/${mockUser.username}`;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-white mb-2">Mi Web Pública</h1>
                <p className="text-text-secondary">Gestioná tu presencia digital y compartí tu inventario.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Configuration Card */}
                <div className="bg-card border border-border rounded-xl p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-primary/10 rounded-lg">
                                <Globe className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">Estado del Sitio</h3>
                                <p className="text-sm text-text-secondary">{enabled ? 'Tu web está visible' : 'Tu web está oculta'}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setEnabled(!enabled)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${enabled ? 'bg-success/20 text-success' : 'bg-gray-700 text-gray-400'}`}
                        >
                            {enabled ? 'Online' : 'Offline'}
                        </button>
                    </div>

                    <div className="bg-background/50 p-4 rounded-lg flex items-center justify-between border border-border/50">
                        <code className="text-primary text-sm">{publicUrl}</code>
                        <div className="flex gap-2">
                            <button className="p-2 hover:bg-white/10 rounded text-text-secondary hover:text-white transition-colors" title="Copiar Link">
                                <Copy className="w-4 h-4" />
                            </button>
                            <button className="p-2 hover:bg-white/10 rounded text-text-secondary hover:text-white transition-colors" title="Compartir">
                                <Share2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="border-t border-border/50 pt-4">
                        <h4 className="text-sm font-medium text-white mb-3">Estadísticas Rápidas</h4>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-background/30 p-3 rounded text-center">
                                <span className="block text-xl font-bold text-white">1,240</span>
                                <span className="text-xs text-text-secondary">Visitas mes</span>
                            </div>
                            <div className="bg-background/30 p-3 rounded text-center">
                                <span className="block text-xl font-bold text-success">48</span>
                                <span className="text-xs text-text-secondary">Leads Web</span>
                            </div>
                            <div className="bg-background/30 p-3 rounded text-center">
                                <span className="block text-xl font-bold text-warning">2.4m</span>
                                <span className="text-xs text-text-secondary">Tiempo prom.</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* AI & Premium Features */}
                <div className="bg-gradient-to-br from-card to-primary/5 border border-primary/20 rounded-xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Sparkles className="w-32 h-32 text-primary" />
                    </div>

                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles className="text-primary w-5 h-5" />
                            <h2 className="text-lg font-bold text-white">Potenciado con IA</h2>
                            <span className="px-2 py-0.5 rounded text-[10px] bg-primary text-white font-bold ml-2">PRO</span>
                        </div>

                        <p className="text-text-secondary text-sm">
                            Tu plan PRO incluye herramientas de inteligencia artificial para maximizar tus ventas.
                        </p>

                        <div className="space-y-3">
                            <FeatureRow icon={<LayoutTemplate className="w-4 h-4" />} text="Diseño optimizado para conversión" />
                            <FeatureRow icon={<Sparkles className="w-4 h-4" />} text="Generación automática de descripciones" />
                            <FeatureRow icon={<Globe className="w-4 h-4" />} text="Dominio personalizado (Próximamente)" />
                        </div>

                        <button className="w-full mt-4 bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/20">
                            Configurar Diseño
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function FeatureRow({ icon, text }: { icon: React.ReactNode, text: string }) {
    return (
        <div className="flex items-center gap-3 text-sm text-text-main">
            <div className="p-1.5 bg-primary/20 rounded text-primary">
                {icon}
            </div>
            {text}
        </div>
    );
}