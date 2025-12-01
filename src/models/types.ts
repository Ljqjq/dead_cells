

export const CellStateMap = {
    HEALTHY: 'HEALTHY',
    MUTATED: 'MUTATED',
    DEAD: 'DEAD',
} as const;
export type CellState = typeof CellStateMap[keyof typeof CellStateMap];

export interface NutrientComponent {
    level: number;
    diffusionRate: number;
}

export interface Nutrient {
    oxygen: NutrientComponent;
    glucose: NutrientComponent;
}

export interface CellNutrientParams {
    consumptionRate: number; 
    survivalThreshold: number; 
}

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

export interface SimulationParams {
    gridWidth: number;
    gridHeight: number;
    simulationSpeedMs: number;
    maxDensityThreshold: number;
    initialCellCount: number;

    initialCellGrowthRate: number; 
    initialCellMutationChance: number;
    
    initialOxygenLevel: number;
    oxygenDiffusionRate: number;
    
    initialGlucoseLevel: number;
    glucoseDiffusionRate: number;
    
    initialCellConsumptionRate: number; 
    initialCellSurvivalThreshold: number; 

    cellSizePx: number; 
}

export interface Coordinate { x: number, y: number }



