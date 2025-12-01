// src/services/simulationService.ts

import { createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState, AppThunk } from '../store/store';
import { initializeSimulation, updateGrid, addAnalysisData, expandGrid } from '../store/simulationSlice';
import { 
    expandGridCells, 
    createInitialGrid, 
    placeInitialCells,
    createNewCell 
} from '../utils/initialization';
import { 
    CellStateMap, 
    type GridCell, 
    type SerializedCell, 
    type SimulationParams, 
    type Nutrient,
} from '../models/types';
import { Cell } from '../models/Cell';
import { getRandomInt } from '../utils/random';
import { NutrientDiffusion, ClusterAnalyzer } from './analyzer'; // !!! НОВІ ООП-КЛАСИ !!!


// ====================================================================
// 1. ВАЛІДАЦІЯ ТА ІНІЦІАЛІЗАЦІЯ
// ====================================================================

function validateSimulationParams(params: SimulationParams): void {
   const errorMessages: string[] = [];
    if (params.gridWidth <= 0 || params.gridHeight <= 0) {
        errorMessages.push("Grid dimensions must be positive integers.");
    }
    if (params.simulationSpeedMs <= 0) {
        errorMessages.push("Simulation speed must be greater than 0 ms.");
    }
    if (params.oxygenDiffusionRate < 0 || params.oxygenDiffusionRate > 1.0) {
        errorMessages.push("Diffusion Rate for Oxygen must be between 0.0 and 1.0.");
    }
    if (params.glucoseDiffusionRate < 0 || params.glucoseDiffusionRate > 1.0) {
        errorMessages.push("Diffusion Rate for Glucose must be between 0.0 and 1.0.");
    }
    if (params.maxDensityThreshold <= 0 || params.maxDensityThreshold > 1.0) {
        errorMessages.push("Max Density Threshold must be between 0.0 and 1.0.");
    }
    if (params.initialCellGrowthRate <= 0) {
        errorMessages.push("Initial Cell Growth Rate must be positive.");
    }
    if (params.initialCellMutationChance < 0 || params.initialCellMutationChance > 1.0) {
        errorMessages.push("Initial Mutation Chance must be between 0.0 and 1.0.");
    }
    if (params.initialOxygenLevel < 0 || params.initialGlucoseLevel < 0) {
        errorMessages.push("Initial Nutrient levels must be non-negative.");
    }
    if (params.initialCellConsumptionRate <= 0) {
         errorMessages.push("Initial Consumption Rate must be positive.");
    }
    if (params.initialCellSurvivalThreshold < 0) {
        errorMessages.push("Initial Survival Threshold must be non-negative.");
    }
    const maxCells = params.gridWidth * params.gridHeight;
    if (params.initialCellCount <= 0 || params.initialCellCount > maxCells) {
        errorMessages.push(`Initial cell count must be between 1 and ${maxCells}.`);
    }

    if (errorMessages.length > 0) {
        const fullErrorMessage = "InvalidParameterException: " + errorMessages.join(" | ");
        throw new Error(fullErrorMessage);
    }
}


export const startInitialization = createAsyncThunk(
    'simulation/startInitialization',
    async (_, { getState, dispatch }) => {
        const state = getState() as RootState;
        const params = state.simulation.params;
        
        try {
            validateSimulationParams(params); 
            
            let grid = createInitialGrid(params.gridWidth, params.gridHeight, params);
            const { grid: initializedGrid, colonies } = placeInitialCells(grid, params);
            
            dispatch(initializeSimulation({ grid: initializedGrid, colonies }));
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during initialization.";
            alert("Simulation initialization failed: " + errorMessage);
            throw new Error(errorMessage);
        }
    }
);


// ====================================================================
// 2. ЯДРО СИМУЛЯЦІЇ (runSimulationStep)
// ====================================================================

export const runSimulationStep = createAsyncThunk(
    'simulation/runSimulationStep',
    async (_, { getState, dispatch }) => {
        const state = getState() as RootState;
        const params = state.simulation.params;
        
        let newGrid: GridCell[][] = JSON.parse(JSON.stringify(state.simulation.grid));
        
        const checkProbability = (prob: number) => Math.random() < prob;
        
        let healthyCount = 0;
        let mutatedCount = 0;
        let totalCells = 0; 

        // --- ЕТАП 1: ОБРОБКА КОЖНОЇ КЛІТИНИ (ООП з класом Cell) ---
        for (let y = 0; y < params.gridHeight; y++) {
            for (let x = 0; x < params.gridWidth; x++) {
                const gridCell = newGrid[y][x];
                
                if (gridCell.cell && gridCell.cell.state !== CellStateMap.DEAD) {
                    
                    // Створення екземпляра класу Cell з даних Redux
                    const cellInstance = new Cell(gridCell.cell as SerializedCell); 
                    const nutrient = gridCell.nutrient;
                    const cellData = cellInstance.dataSnapshot; 
                    
                    // 1. Мутація
                    cellInstance.attemptMutation(checkProbability);

                    // 2. Смерть від віку
                    if (cellInstance.attemptAgeDeath(checkProbability)) {
                        newGrid[y][x].cell = null; 
                        continue;
                    }

                    // 3. Споживання та перевірка життєздатності
                    const consumedO2 = cellData.growthRate * cellData.oxygenParams.consumptionRate;
                    const consumedGlu = cellData.growthRate * cellData.glucoseParams.consumptionRate;

                    const hasEnoughO2 = nutrient.oxygen.level >= cellData.oxygenParams.survivalThreshold;
                    const hasEnoughGlu = nutrient.glucose.level >= cellData.glucoseParams.survivalThreshold;

                    nutrient.oxygen.level = Math.max(0, nutrient.oxygen.level - consumedO2);
                    nutrient.glucose.level = Math.max(0, nutrient.glucose.level - consumedGlu);
                    
                    if (!cellInstance.checkViability(hasEnoughO2, hasEnoughGlu)) { 
                        newGrid[y][x].cell = null; 
                        continue; 
                    }
                    
                    // 4. Поділ (Використовує метод класу Cell з types.ts)
                    const divisionResult = cellInstance.attemptDivision(checkProbability, newGrid, params);
                    if (divisionResult) {
                        const { targetPos, newCellData } = divisionResult;
                        newGrid[targetPos.y][targetPos.x].cell = newCellData;
                    }

                    // 5. Старіння
                    cellInstance.ageCell();

                    // 6. Підрахунок
                    if (cellInstance.dataSnapshot.state === CellStateMap.MUTATED) {
                        mutatedCount++;
                    } else {
                        healthyCount++;
                    }
                    totalCells++;
                    
                    // Зберігаємо змінений об'єкт назад у формат Redux
                    newGrid[y][x].cell = cellInstance.toSerialized(); 
                }
            }
        }
        
        // --- ЕТАП 2: ДИФУЗІЯ (ООП з класом NutrientDiffusion) ---
        const diffusionAnalyzer = new NutrientDiffusion(newGrid, params.gridWidth, params.gridHeight);
        newGrid = diffusionAnalyzer.runDiffusionStep(); 
        
        // --- ЕТАП 3: АНАЛІЗ КЛАСТЕРІВ (ООП з класом ClusterAnalyzer) ---
        const clusterAnalyzer = new ClusterAnalyzer(newGrid, params.gridWidth, params.gridHeight);
        const { 
            totalClusters, 
            healthyClusters, 
            mutatedClusters 
        } = clusterAnalyzer.analyze(); 
        
        // --- ЕТАП 4: РОЗШИРЕННЯ СІТКИ ---
        const maxCells = params.gridWidth * params.gridHeight;
        
        if (totalCells > 0 && totalCells / maxCells > params.maxDensityThreshold) {
             const { newGrid: expandedGrid, newWidth, newHeight } = expandGridCells(newGrid, 2, params);
             
             dispatch(expandGrid({ newGrid: expandedGrid, newWidth, newHeight }));
             return; 
        }

        // --- ЕТАП 5: ОНОВЛЕННЯ СТАНУ ---
        dispatch(updateGrid(newGrid));
        dispatch(addAnalysisData({
            step: state.simulation.currentStep + 1,
            healthy: healthyCount,
            mutated: mutatedCount,
            total: totalCells,
            
            totalClusters: totalClusters,
            healthyClusters: healthyClusters,
            mutatedClusters: mutatedClusters,
        }));
    }
);


// ====================================================================
// 3. ДОПОМІЖНІ ТА ІНТЕРАКТИВНІ МЕТОДИ
// ====================================================================

function generateUniqueId() {
    const uniqueId = Math.floor(Math.random() * 1000);
    return uniqueId.toString();
}

function generateRandomColor() {
    let randomColor = "#";
    const colorsChars = "0123456789ABCDEF";
    for (let i =0; i < 6; i++) {
        const randomIndex = Math.floor(Math.random() * colorsChars.length);
        randomColor += colorsChars[randomIndex];
    }
    return randomColor;
}

export const placeNewColony = createAsyncThunk(
    'simulation/placeNewColony',
    async ({ x, y }: { x: number, y: number }, { getState, dispatch }) => {
        const state = getState() as RootState;
        const params = state.simulation.params;
        const currentGrid = JSON.parse(JSON.stringify(state.simulation.grid));

        if (currentGrid[y][x].cell !== null) {
            throw new Error("Cell already exists at this location.");
        }

        const newColonyId = generateUniqueId();
        const newColor = generateRandomColor(); 

        // Створення нової клітини через фабричну функцію
        const newCellData = createNewCell(
            x, y, newColonyId, newColor, 
            false, 
            params
        );

        currentGrid[y][x].cell = newCellData;
        dispatch(updateGrid(currentGrid));
    }
);

export const removeCellAt = createAsyncThunk(
    'simulation/removeCellAt',
    async ({ x, y }: { x: number, y: number }, { getState, dispatch }) => {
        const state = getState() as RootState;
        const { gridWidth, gridHeight } = state.simulation.params;
        if (x < 0 || x >= gridWidth || y < 0 || y >= gridHeight) {
             throw new Error("InvalidLocationException: Coordinates are outside grid boundaries.");
        }
        
        const currentGrid = JSON.parse(JSON.stringify(state.simulation.grid));
        
        if (currentGrid[y][x].cell === null) {
            return;
        }
        
        try {
            currentGrid[y][x].cell = null;
            dispatch(updateGrid(currentGrid));
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to remove cell due to unknown error.";
            console.error("Remove Cell Failed:", errorMessage);
            throw new Error(errorMessage);
        }
    }
);

export const setNutrientLevel = createAsyncThunk(
    'simulation/setNutrientLevel',
    async ({ x, y, type, value }: { x: number, y: number, type: keyof Nutrient, value: number }, { getState, dispatch }) => {
        
        if (value < 0) {
            throw new Error("InvalidParameterException: Nutrient level cannot be negative.");
        }
        
        const state = getState() as RootState;
        
        const { gridWidth, gridHeight } = state.simulation.params;
        if (x < 0 || x >= gridWidth || y < 0 || y >= gridHeight) {
             throw new Error("InvalidLocationException: Coordinates are outside grid boundaries.");
        }

        const currentGrid = JSON.parse(JSON.stringify(state.simulation.grid));
        
        try {
            currentGrid[y][x].nutrient[type].level = value; 
            dispatch(updateGrid(currentGrid));

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to set nutrient level due to unknown error.";
            console.error("Set Nutrient Level Failed:", errorMessage);
            throw new Error(errorMessage);
        }
    }
);