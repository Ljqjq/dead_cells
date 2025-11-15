// src/models/types.ts

// --- 1. CONSTANTS ---

export const CellStateMap = {
    HEALTHY: 'HEALTHY',
    MUTATED: 'MUTATED',
    DEAD: 'DEAD',
} as const;
export type CellState = typeof CellStateMap[keyof typeof CellStateMap];

// --- 2. INTERFACES for Serialized Data (Redux) ---

/** Параметри поживних речовин, що залежать від СЕРЕДОВИЩА (ТІЛЬКИ Diffusion) */
export interface NutrientComponent {
    level: number;
    diffusionRate: number;
    // decayRate ВИДАЛЕНО
}

/** Середовище клітини. ТІЛЬКИ OXYGEN ТА GLUCOSE. */
export interface Nutrient {
    oxygen: NutrientComponent;
    glucose: NutrientComponent;
}

/** Параметри виживання, специфічні для типу клітини (Consumption, Threshold) */
export interface CellNutrientParams {
    consumptionRate: number; 
    survivalThreshold: number; 
}

/** Серіалізована форма Cell */
export interface SerializedCell {
    x: number;
    y: number;
    rootColonyId: string;
    color: string;
    state: CellState; 
    age: number;
    growthRate: number;
    mutationProbability: number;
    
    oxygenParams: CellNutrientParams;
    glucoseParams: CellNutrientParams;
}

/** Кожна клітинка сітки */
export interface GridCell {
    x: number;
    y: number;
    cell: SerializedCell | null; 
    nutrient: Nutrient;
}

export interface SerializedRootColony {
    id: string;
    color: string;
}

/** Параметри симуляції */
export interface SimulationParams {
    gridWidth: number;
    gridHeight: number;
    simulationSpeedMs: number;
    maxDensityThreshold: number; 
    initialCellCount: number;

    initialCellGrowthRate: number; 
    initialCellMutationChance: number;
    
    // --- ПАРАМЕТРИ КИСНЮ (OXYGEN) ---
    initialOxygenLevel: number;
    oxygenDiffusionRate: number;
    // oxygenDecayRate ВИДАЛЕНО
    
    // --- ПАРАМЕТРИ ГЛЮКОЗИ (GLUCOSE) ---
    initialGlucoseLevel: number;
    glucoseDiffusionRate: number;
    // glucoseDecayRate ВИДАЛЕНО
    
    initialCellConsumptionRate: number; 
    initialCellSurvivalThreshold: number; 

    cellSizePx: number; 
}

// --- 3. CLASS for OOP Logic ---

export class Cell {
    private data: SerializedCell;

    constructor(serializedData: SerializedCell) {
        this.data = { ...serializedData }; 
    }

    public attemptMutation(checkProbability: (prob: number) => boolean): void {
        if (this.data.state === CellStateMap.HEALTHY && checkProbability(this.data.mutationProbability)) {
            this.data.state = CellStateMap.MUTATED;
            
            this.data.growthRate *= 1.2; 
            this.data.oxygenParams.consumptionRate *= 1.5;
            this.data.glucoseParams.consumptionRate *= 1.5;
            this.data.oxygenParams.survivalThreshold *= 2.0; 
            this.data.glucoseParams.survivalThreshold *= 2.0;
        }
    }
    
    public ageCell(): void {
        this.data.age++;
    }
    
    public checkViability(hasEnoughO2: boolean, hasEnoughGlu: boolean): boolean {
        if (!hasEnoughO2 || !hasEnoughGlu) { 
            this.data.state = CellStateMap.DEAD;
            return false;
        }
        return true;
    }

    public toSerialized(): SerializedCell {
        return this.data;
    }
    
    public get dataSnapshot(): Readonly<SerializedCell> {
        return this.data;
    }
}