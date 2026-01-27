import { Vehicle, CalculatedGain } from './types';

export const DEFAULT_FLIP_PERCENT = 40;
export const CLAVO_DAYS_THRESHOLD = 45;

export function calculateGain(vehicle: Vehicle): CalculatedGain | null {
    const { purchasePrice, salePrice, flipPercent } = vehicle.prices;

    // Validation: Must have PC and PV
    if (!purchasePrice || !salePrice) {
        return null;
    }

    const baseGain = salePrice - purchasePrice;

    if (vehicle.operationType === 'CONSIGNACION_PROPIA') {
        return {
            totalPotentialGain: baseGain,
            userGain: baseGain, // 100%
            isProportional: false,
            baseGain
        };
    } else {
        // FLIP_COMPARTIDO
        const pct = flipPercent !== undefined ? flipPercent : DEFAULT_FLIP_PERCENT;
        const userGain = baseGain * (pct / 100);
        return {
            totalPotentialGain: baseGain,
            userGain: userGain,
            isProportional: true,
            baseGain
        };
    }
}

export function isClavo(vehicle: Vehicle): boolean {
    if (!vehicle.publishedAt) return false;

    const published = new Date(vehicle.publishedAt);
    const now = new Date(); // In a real app we might pass this in for testability
    // Use user context time if strictly needed, but system time is fine for logic here

    const diffTime = Math.abs(now.getTime() - published.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > CLAVO_DAYS_THRESHOLD;
}

export function isValidForKPI(vehicle: Vehicle): boolean {
    if (vehicle.status === 'INCOMPLETE' || vehicle.status === 'DRAFT' || vehicle.status === 'SOLD') {
        return false;
    }
    const gain = calculateGain(vehicle);
    return gain !== null;
}

// --- PHASE 2 LOGIC ---

// Check if a vehicle matches a specific ticket
export function isMatch(vehicle: Vehicle, ticket: SearchTicket): boolean {
  // 1. Basic matching needed for example (Case insensitive roughly)
  if (!vehicle.brand.toLowerCase().includes(ticket.brand.toLowerCase())) return false;
  if (!vehicle.model.toLowerCase().includes(ticket.model.toLowerCase())) return false;
  
  // 2. Ranges
  if (vehicle.year < ticket.yearRange.min || vehicle.year > ticket.yearRange.max) return false;
  
  // 3. Price (Sale Price vs Budget)
  // If undefined Price, assume no match or potential match? Stricter: must have price within range.
  if (!vehicle.prices.salePrice) return false;
  if (vehicle.prices.salePrice < ticket.budget.min || vehicle.prices.salePrice > ticket.budget.max) return false;
  
  return true;
}

// Generate alerts based on inventory matching community search tickets
export function generateMatchingAlerts(inventory: Vehicle[], tickets: SearchTicket[]): Alert[] {
  const alerts: Alert[] = [];
  
  inventory.forEach(vehicle => {
    if (vehicle.status !== 'ACTIVE') return; 
    
    tickets.forEach(ticket => {
       if (isMatch(vehicle, ticket)) {
         alerts.push({
           id: `alert_match_${vehicle.id}_${ticket.id}`,
           type: 'SEARCH_MATCH',
           message: `Usuario busca ${ticket.brand} ${ticket.model} (${ticket.yearRange.min}-${ticket.yearRange.max}) - Tu unidad coincide.`,
           date: new Date().toISOString(), // Fresh alert
           relatedId: vehicle.id,
           actionLabel: 'Ofrecer Unidad',
           isRead: false
         });
       }
    });
  });
  
  return alerts;
}