
import { Vehicle, OperationType } from './types';

// Deterministic AI Logic (Simulacra)

export const AI_FEATURES = {
    GENERATE_DESCRIPTION: 'Generación de descripciones de venta',
    PRICE_SUGGESTION: 'Sugerencia de precio de mercado',
    OPPORTUNITY_ANALYSIS: 'Análisis de oportunidades de inversión'
};

const EMOTIONS = ['🔥', '🚀', '💎', '✅', '⭐', '🏎️'];

export function generateSalesCopy(vehicle: Vehicle): string {
    const { brand, model, year, operationType, prices } = vehicle;

    const intro = [
        `¡Oportunidad única! Vendo ${brand} ${model} año ${year}.`,
        `Se vende ${brand} ${model} ${year} en excelente estado.`,
        `¿Buscás un ${model}? Mirá este ${brand} ${year}.`
    ];

    const body = [
        `Unidad seleccionada por HotCars.`,
        operationType === 'FLIP_COMPARTIDO' ? 'Ideal para inversión con rentabilidad asegurada.' : 'Papeles al día, listo para transferir.',
        `Precio de oportunidad: $${prices.salePrice?.toLocaleString('es-AR')}`
    ];

    const cta = [
        '¡Consultame ahora!',
        'Escribime y coordinamos una visita.',
        'No te pierdas esta joya.'
    ];

    // Randomize slightly for "AI" feel
    const r = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
    const e = () => EMOTIONS[Math.floor(Math.random() * EMOTIONS.length)];

    return `${e()} ${r(intro)}\n\n${r(body)}\n\n${e()} ${r(cta)}`;
}

export function suggestPrice(vehicle: Vehicle): { min: number; max: number; reason: string } {
    // Mock logic: +/- 5-10% around current purchase price to suggest sale price
    const base = vehicle.prices.purchasePrice || 10000000;
    const markup = vehicle.operationType === 'FLIP_COMPARTIDO' ? 1.30 : 1.20; // 30% or 20% margin

    const suggested = base * markup;

    return {
        min: suggested * 0.95,
        max: suggested * 1.05,
        reason: `Basado en unidades similares de ${vehicle.brand} ${vehicle.model} ${vehicle.year} en el mercado actual.`
    };
}

export function analyzeOpportunity(vehicle: Vehicle): string[] {
    const insights = [];

    if (vehicle.operationType === 'FLIP_COMPARTIDO') {
        insights.push('Alta rentabilidad potencial para inversores.');
    }

    if ((vehicle.year || 0) > 2020) {
        insights.push('Vehículo seminuevo con alta liquidez.');
    }

    // "AI" detects if price is low
    if (vehicle.prices.purchasePrice && vehicle.prices.purchasePrice < 12000000) {
        insights.push('Precio de entrada accesible, ideal para venta rápida.');
    }

    return insights;
}
