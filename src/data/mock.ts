import { Vehicle, SearchTicket, Alert, CommunityStats, UserProfile } from '../lib/types';

export const initialInventory: Vehicle[] = [
    { id: 'v1', brand: 'Toyota', model: 'Corolla SEG', year: 2018, operationType: 'CONSIGNACION_PROPIA', prices: { purchasePrice: 15000000, salePrice: 18000000 }, publishedAt: '2026-01-09T10:00:00Z', status: 'ACTIVE', images: [], analytics: { views: 2500, clicks: 120, leads: 15, adSpend: 30000 } },
    { id: 'v2', brand: 'Volkswagen', model: 'Golf GTI', year: 2016, operationType: 'FLIP_COMPARTIDO', prices: { purchasePrice: 20000000, salePrice: 24000000, flipPercent: 40 }, publishedAt: '2026-01-14T10:00:00Z', status: 'ACTIVE', images: [], analytics: { views: 3500, clicks: 200, leads: 38, adSpend: 45000 } },
    { id: 'v3', brand: 'Ford', model: 'Ranger Raptor', year: 2021, operationType: 'FLIP_COMPARTIDO', prices: { purchasePrice: 40000000, salePrice: 48000000, flipPercent: 50 }, publishedAt: '2025-12-30T10:00:00Z', status: 'ACTIVE', images: [], analytics: { views: 800, clicks: 50, leads: 4, adSpend: 80000 } },
    { id: 'v4', brand: 'Peugeot', model: '208 Feline', year: 2014, operationType: 'CONSIGNACION_PROPIA', prices: { purchasePrice: 8000000, salePrice: 10000000 }, publishedAt: '2025-11-20T10:00:00Z', status: 'ACTIVE', images: [], analytics: { views: 1200, clicks: 45, leads: 2, adSpend: 50000 } },
    { id: 'v5', brand: 'Chevrolet', model: 'Cruze', year: 2019, operationType: 'CONSIGNACION_PROPIA', prices: { purchasePrice: 12000000 }, publishedAt: '2026-01-17T10:00:00Z', status: 'INCOMPLETE', images: [], analytics: { views: 50, clicks: 2, leads: 0, adSpend: 0 } },
    { id: 'v6', brand: 'Fiat', model: 'Cronos', year: 2022, operationType: 'CONSIGNACION_PROPIA', prices: { purchasePrice: 14000000, salePrice: 16500000 }, publishedAt: '2026-01-18T10:00:00Z', status: 'ACTIVE', images: [], analytics: { views: 400, clicks: 20, leads: 5, adSpend: 15000 } },
    // VENDIDOS PARA CALCULO DE DIAS (Ejemplo: Publicado hace 20 días, vendido hoy)
    { id: 'v7', brand: 'Ford', model: 'Focus', year: 2018, operationType: 'CONSIGNACION_PROPIA', prices: { purchasePrice: 11000000, salePrice: 13500000 }, publishedAt: '2025-12-25T10:00:00Z', soldAt: '2026-01-10T10:00:00Z', status: 'SOLD', images: [], analytics: { views: 300, leads: 8 } },
    { id: 'v8', brand: 'VW', model: 'Nivus', year: 2021, operationType: 'CONSIGNACION_PROPIA', prices: { purchasePrice: 18000000, salePrice: 22000000 }, publishedAt: '2026-01-01T10:00:00Z', soldAt: '2026-01-19T10:00:00Z', status: 'SOLD', images: [], analytics: { views: 500, leads: 14 } }
];

export const mockCommunityStats: CommunityStats = {
    activeUsers: 142,
    activeFlips: 0, // Se calculará dinámicamente
    leadsToday: 0, // Se calculará dinámicamente
    messagesExchanged: 843
};

export const mockSearchTickets: SearchTicket[] = [];
export const initialAlerts: Alert[] = [];
export const mockUser: UserProfile = { id: 'u1', username: 'agenciamendo', displayName: 'Agencia Mendo', plan: 'PRO', isPublicWebEnabled: true, themeColor: '#3b82f6' };