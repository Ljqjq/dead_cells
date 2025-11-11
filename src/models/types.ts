// src/models/types.ts

// --- Базові Переліки (Використання const Object для рядкових літералів) ---

export const CellStateMap = {
    HEALTHY: 'healthy',
    MUTATED: 'mutated',
    DEAD: 'dead',
    EMPTY: 'empty' 
} as const; 

export type CellState = typeof CellStateMap[keyof typeof CellStateMap];

// --- Структура Ресурсу ---
interface Resource {
    level: number;
    consumptionRate: number; 
    diffusionRate: number;   
    decayRate: number;       
    threshold: number;       
}

// --- Поживні Речовини (Двокомпонентні) ---
export interface Nutrient {
    oxygen: Resource;
    glucose: Resource;
}

// --- Клітина (Cell) ---
export interface Cell {
    id: string;
    rootColonyId: string; 
    position: { x: number; y: number };
    state: CellState; 
    age: number;
    growthRate: number; 
    mutationProbability: number;
    color: string; // Колір для візуалізації колонії
}

// --- Комірка Середовища (Сітка) ---
export interface GridCell {
    cell: Cell | null; 
    nutrient: Nutrient;
}

// --- Параметри Симуляції ---
export interface SimulationParams {
    gridWidth: number;
    gridHeight: number;
    initialCellCount: number; 
    initialNutrientLevel: number;
    maxDensityThreshold: number; 
    simulationSpeedMs: number;
}