export type OperationType = 'CONSIGNACION_PROPIA' | 'FLIP_COMPARTIDO';

export type PublicationStatus = 'ACTIVE' | 'PAUSED' | 'SOLD' | 'DRAFT' | 'INCOMPLETE';

export interface GainRules {
    purchasePrice?: number; // PC
    salePrice?: number; // PV
    flipPercent?: number; // Default 40 for FLIP_COMPARTIDO
}

export interface Vehicle {
    id: string;
    brand: string;
    model: string;
    year: number;
    domain?: string; // Patente
    mileage?: number;
    publishedAt: string; // ISO Date

    operationType: OperationType;
    prices: GainRules;

    status: PublicationStatus;

    // Metadata for UI
    images: string[];

    // Phase 2: Analytics
    analytics?: {
        views: number;
        clicks: number; // For CTR calculation (or we use views vs leads? - User said CTR = Click Through Rate. Usually Impressions -> Clicks -> Leads)
        // Prompt says: "Conversión de Inventario: Porcentaje de autos vistos vs. consultas realizadas." -> Leads / Views.
        // Prompt says: "CTR... Click Through Rate". Let's assume Views = Impressions, Clicks = Detail Views.
        // To be safe and simple: 
        // views = Impressions on list
        // leads = Consultas
        // We will add 'adSpend' for Costo por Lead.

        leads: number;
        adSpend: number;
    };
}

export interface CalculatedGain {
    totalPotentialGain: number; // PV - PC
    userGain: number; // Percibido por el usuario
    isProportional: boolean;
    baseGain: number;
}

// --- PHASE 2 MODELS ---

export interface SearchTicket {
    id: string;
    userId: string;
    brand: string;
    model: string;
    yearRange: { min: number; max: number };
    budget: { min: number; max: number };
    features: string[]; // e.g., "GNC", "Automatico"
    createdAt: string;
}

export type AlertType = 'SEARCH_MATCH' | 'PRICE_CHANGE' | 'LEAD' | 'FLIP_REQ' | 'CLAVO_RISK';

export interface Alert {
    id: string;
    type: AlertType;
    message: string;
    date: string;
    relatedId?: string; // ID of vehicle, ticket, or user
    actionLabel?: string;
    isRead: boolean;
}

export interface CommunityStats {
    activeUsers: number;
    activeFlips: number;
    leadsToday: number;
    messagesExchanged: number;
}

// --- PHASE 3 MODELS ---

export type UserPlan = 'FREE' | 'PRO' | 'PREMIUM';

export interface UserProfile {
    id: string;
    username: string; // unique handle
    displayName: string;
    plan: UserPlan;
    isPublicWebEnabled: boolean;
    themeColor: string; // for custom web branding
    avatarUrl?: string;
}