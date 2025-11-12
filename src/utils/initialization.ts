// src/utils/initialization.ts

import { getRandomInt, generateId } from './random'; 
import { CellStateMap, Cell } from '../models/types'; 
import type { SimulationParams, GridCell, Nutrient, NutrientComponent, SerializedCell, SerializedRootColony } from '../models/types'; 


/** Початкові/стандартні параметри симуляції */
export const initialSimulationParams: SimulationParams = {
    gridWidth: 30,
    gridHeight: 30,
    simulationSpeedMs: 200,
    maxDensityThreshold: 0.75,
    initialCellCount: 5,
    
    initialCellGrowthRate: 0.05,
    initialCellMutationChance: 0.0005,
    
    initialNutrientLevel: 100,
    nutrientDiffusionRate: 0.15,
    nutrientDecayRate: 0.01,
    nutrientConsumptionRate: 0.5,
    nutrientSurvivalThreshold: 5,
};

/** Створює початкові параметри поживних речовин на основі SimulationParams. */
function createNutrientParams(params: SimulationParams): Nutrient {
    const base: NutrientComponent = {
        level: params.initialNutrientLevel,
        diffusionRate: params.nutrientDiffusionRate,
        decayRate: params.nutrientDecayRate,
        consumptionRate: params.nutrientConsumptionRate,
        threshold: params.nutrientSurvivalThreshold,
    };
    
    return {
        oxygen: JSON.parse(JSON.stringify(base)),
        glucose: JSON.parse(JSON.stringify(base)),
    };
}


/** Створює початкову сітку GridCell, заповнену нульовими клітинами та початковими поживними речовинами. */
export function createInitialGrid(width: number, height: number, params: SimulationParams = initialSimulationParams): GridCell[][] {
    const grid: GridCell[][] = [];
    const initialNutrient = createNutrientParams(params); 
    
    for (let y = 0; y < height; y++) {
        const row: GridCell[] = [];
        for (let x = 0; x < width; x++) {
            row.push({
                x,
                y,
                cell: null,
                nutrient: JSON.parse(JSON.stringify(initialNutrient)),
            });
        }
        grid.push(row);
    }
    return grid;
}

/** Створює нову клітину з заданими параметрами. */
export function createNewCell(
    x: number, 
    y: number, 
    rootColonyId: string, 
    color: string, 
    isMutated: boolean = false,
    params: SimulationParams = initialSimulationParams
): SerializedCell { // Повертає SerializedCell
    
    // Створення початкових даних для класу
    let initialData: SerializedCell = {
        x,
        y,
        rootColonyId,
        color,
        state: isMutated ? CellStateMap.MUTATED : CellStateMap.HEALTHY,
        age: 0,
        growthRate: params.initialCellGrowthRate,
        mutationProbability: params.initialCellMutationChance,
    };
    
    const cellInstance = new Cell(initialData);

    // Встановлення мутованих параметрів, якщо потрібно (через внутрішній метод класу)
    if (isMutated) {
        // Ми не можемо викликати attemptMutation, оскільки це ініціалізація,
        // тому маніпулюємо даними напряму або створюємо спеціалізований клас/метод.
        // Для простоти:
        initialData.growthRate = params.initialCellGrowthRate * 1.2;
    }
    
    return cellInstance.toSerialized(); // Повертаємо серіалізовану форму
}

/** Розміщує початкову кількість клітин, створюючи колонії. */
export function placeInitialCells(initialGrid: GridCell[][], params: SimulationParams): { grid: GridCell[][], colonies: SerializedRootColony[] } {
    let grid = initialGrid;
    const { gridWidth, gridHeight, initialCellCount } = params;
    
    const rootColonies: SerializedRootColony[] = []; 
    const colors = ['#22c55e', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899']; 

    for (let i = 0; i < initialCellCount; i++) {
        let x, y;
        let attempts = 0;
        
        do {
            x = getRandomInt(0, gridWidth - 1);
            y = getRandomInt(0, gridHeight - 1);
            attempts++;
            if (attempts > 1000) {
                console.warn("Could not place all initial cells.");
                return { grid, colonies: rootColonies };
            }
        } while (grid[y][x].cell !== null);

        const rootColonyId = generateId();
        const color = colors[i % colors.length];

        const newCell = createNewCell(x, y, rootColonyId, color, false, params); 
        grid[y][x].cell = newCell;
        
        rootColonies.push({ id: rootColonyId, color });
    }

    return { grid, colonies: rootColonies };
}

/**
 * Створює нову, більшу сітку та копіює стару сітку в центр нової.
 */
export function expandGridCells(oldGrid: GridCell[][], factor: number = 2, params: SimulationParams = initialSimulationParams) {
    const oldHeight = oldGrid.length;
    const oldWidth = oldGrid[0].length;
    
    const newWidth = oldWidth * factor;
    const newHeight = oldHeight * factor;

    let newGrid = createInitialGrid(newWidth, newHeight, params);

    const offsetX = Math.floor((newWidth - oldWidth) / 2);
    const offsetY = Math.floor((newHeight - oldHeight) / 2);

    for (let y = 0; y < oldHeight; y++) {
        for (let x = 0; x < oldWidth; x++) {
            const oldCellData = oldGrid[y][x];
            const newY = y + offsetY;
            const newX = x + offsetX;
            
            // Копіюємо дані, оновлюючи координати
            if (oldCellData.cell) {
                 newGrid[newY][newX].cell = { 
                    ...oldCellData.cell, 
                    x: newX, 
                    y: newY 
                 };
            }
            newGrid[newY][newX].nutrient = oldCellData.nutrient;
            newGrid[newY][newX].x = newX;
            newGrid[newY][newX].y = newY;
        }
    }
    
    return { newGrid, newWidth, newHeight };
}