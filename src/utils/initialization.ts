// src/utils/initialization.ts
import { CellStateMap } from '../models/types';
import type  { SimulationParams, GridCell, Nutrient, Cell, } from '../models/types';  
import { getRandomInt, generateId } from './random'; 

// Початкова конфігурація ресурсів
export const initialNutrientConfig: Nutrient = {
    oxygen: { level: 100, consumptionRate: 5, diffusionRate: 0.1, decayRate: 0.01, threshold: 10 },
    glucose: { level: 100, consumptionRate: 8, diffusionRate: 0.05, decayRate: 0.02, threshold: 15 },
};

// Початкові параметри симуляції
export const initialSimulationParams: SimulationParams = {
    gridWidth: 30,
    gridHeight: 30,
    initialCellCount: 5, 
    initialNutrientLevel: 100,
    maxDensityThreshold: 0.75,
    simulationSpeedMs: 100,
};

// Створення порожньої сітки з ресурсами
export function createInitialGrid(width: number, height: number): GridCell[][] {
    const grid: GridCell[][] = [];
    for (let y = 0; y < height; y++) {
        const row: GridCell[] = [];
        for (let x = 0; x < width; x++) {
            row.push({
                cell: null,
                nutrient: {
                    oxygen: { ...initialNutrientConfig.oxygen, level: initialSimulationParams.initialNutrientLevel },
                    glucose: { ...initialNutrientConfig.glucose, level: initialSimulationParams.initialNutrientLevel },
                }
            });
        }
        grid.push(row);
    }
    return grid;
}

// Функція для створення нової клітини
export function createNewCell(
    x: number,
    y: number,
    rootId: string,
    color: string,
    isMutated: boolean = false
): Cell {
    return {
        id: generateId(),
        rootColonyId: rootId,
        position: { x, y },
        state: isMutated ? CellStateMap.MUTATED : CellStateMap.HEALTHY, 
        age: 0,
        growthRate: 0.15,
        mutationProbability: 0.02,
        color: color,
    };
}

// Функція для розміщення початкових клітин-засновників
export function placeInitialCells(
    grid: GridCell[][],
    params: SimulationParams
): { grid: GridCell[][], colonies: { id: string, color: string }[] } {
    
    let currentGrid = JSON.parse(JSON.stringify(grid)); 
    const colonies: { id: string, color: string }[] = [];
    const colors = ['#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#33FFF6']; 

    for (let i = 0; i < params.initialCellCount; i++) {
        const rootId = generateId();
        const colonyColor = colors[i % colors.length];

        let x, y;
        do {
            x = getRandomInt(0, params.gridWidth - 1);
            y = getRandomInt(0, params.gridHeight - 1);
        } while (currentGrid[y][x].cell !== null);

        const newCell = createNewCell(x, y, rootId, colonyColor);
        currentGrid[y][x].cell = newCell;
        
        colonies.push({ id: rootId, color: colonyColor });
    }

    return { grid: currentGrid, colonies };
}