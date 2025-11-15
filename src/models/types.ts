// src/models/types.ts

// --- 1. CONSTANTS (ЗАМІСТЬ ENUMS) ---

/** Мапа станів клітини */
export const CellStateMap = {
    HEALTHY: 'HEALTHY',
    MUTATED: 'MUTATED',
    DEAD: 'DEAD',
} as const;

// Витягуємо тип стану
export type CellState = typeof CellStateMap[keyof typeof CellStateMap];


// --- 2. INTERFACES for Serialized Data (Redux) ---

/** Параметри поживних речовин */
export interface NutrientComponent {
    level: number;
    diffusionRate: number;
    decayRate: number;
    consumptionRate: number;
    threshold: number; 
}

/** Середовище клітини */
export interface Nutrient {
    oxygen: NutrientComponent;
    glucose: NutrientComponent;
}

/** Серіалізована форма Cell, яка зберігається в Redux */
export interface SerializedCell {
    x: number;
    y: number;
    rootColonyId: string;
    color: string;
    state: CellState; 
    age: number;
    growthRate: number;
    mutationProbability: number;
}

/** Кожна клітинка сітки */
export interface GridCell {
    x: number;
    y: number;
    cell: SerializedCell | null; 
    nutrient: Nutrient;
}

/** Серіалізована форма RootColony */
export interface SerializedRootColony {
    id: string;
    color: string;
}

/** Параметри симуляції, які може налаштовувати користувач */
export interface SimulationParams {
    gridWidth: number;
    gridHeight: number;
    simulationSpeedMs: number;
    maxDensityThreshold: number; 
    initialCellCount: number;

    initialCellGrowthRate: number; 
    initialCellMutationChance: number;

    initialNutrientLevel: number;
    nutrientDiffusionRate: number;
    nutrientDecayRate: number;
    nutrientConsumptionRate: number;
    nutrientSurvivalThreshold: number;
    
    // НОВЕ: Розмір клітинки для візуалізації
    cellSizePx: number; 
}

// --- 3. CLASS for OOP Logic ---

/** Клас, що містить логіку клітини. Приймає/повертає серіалізовані дані. */
export class Cell {
    private data: SerializedCell;

    constructor(serializedData: SerializedCell) {
        this.data = { ...serializedData }; 
    }

    /** Метод для логіки мутації (ООП) */
    public attemptMutation(checkProbability: (prob: number) => boolean): void {
        if (this.data.state === CellStateMap.HEALTHY && checkProbability(this.data.mutationProbability)) {
            this.data.state = CellStateMap.MUTATED;
            this.data.growthRate *= 1.2; 
        }
    }
    
    /** Метод для логіки старіння (ООП) */
    public ageCell(): void {
        this.data.age++;
    }
    
    /** Метод для перевірки життєздатності (ООП) */
    public checkViability(hasEnoughO2: boolean, hasEnoughGlu: boolean): boolean {
        if (!hasEnoughO2 || !hasEnoughGlu) {
            this.data.state = CellStateMap.DEAD;
            return false;
        }
        return true;
    }

    /** Повертає оновлений серіалізований об'єкт для Redux. */
    public toSerialized(): SerializedCell {
        return this.data;
    }
    
    /** Дозволяє отримати доступ до даних для обчислень (наприклад, швидкості росту) */
    public get dataSnapshot(): Readonly<SerializedCell> {
        return this.data;
    }
}