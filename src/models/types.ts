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
    
    public attemptAgeDeath(checkProbability: (prob: number) => boolean): boolean {
        const BASE_LIFESPAN = 100; 
        const AGE_START_DEATH = 50; 

        if (this.data.age < AGE_START_DEATH) {
            return false; 
        }

        const ageFactor = (this.data.age - AGE_START_DEATH) / BASE_LIFESPAN;
        
        const deathChance = Math.min(1.0, ageFactor); 
        
        if (checkProbability(deathChance)) {
            this.data.state = CellStateMap.DEAD;
            return true;
        }
        return false;
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