// src/services/simulationService.ts

import { createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState } from '../store/store';
import { initializeSimulation, updateGrid, addAnalysisData, expandGrid } from '../store/simulationSlice';
import { 
    createInitialGrid, 
    placeInitialCells, 
    createNewCell, 
    expandGridCells // ВИКОРИСТОВУЄТЬСЯ ДЛЯ РОЗШИРЕННЯ
} from '../utils/initialization';
import { 
    Cell, 
    CellStateMap, 
    type GridCell, 
    type SerializedCell, 
    type SimulationParams 
} from '../models/types';
import { getRandomInt } from '../utils/random';


// ----------------------------------------------------------------------
// A. ASYNC THUNKS
// ----------------------------------------------------------------------

/** * Ініціалізує сітку та колонії. 
 */
export const startInitialization = createAsyncThunk(
    'simulation/startInitialization',
    async (_, { getState, dispatch }) => {
        const params: SimulationParams = (getState() as RootState).simulation.params;
        
        let grid = createInitialGrid(params.gridWidth, params.gridHeight, params);
        const { grid: initializedGrid, colonies } = placeInitialCells(grid, params);
        
        dispatch(initializeSimulation({ grid: initializedGrid, colonies }));
    }
);

/** * Виконує один крок симуляції (споживання, ріст/поділ, дифузія).
 */
export const runSimulationStep = createAsyncThunk(
    'simulation/runSimulationStep',
    async (_, { getState, dispatch }) => {
        const state = getState() as RootState;
        const params = state.simulation.params;
        
        let newGrid: GridCell[][] = JSON.parse(JSON.stringify(state.simulation.grid));
        
        const checkProbability = (prob: number) => Math.random() < prob;
        
        let healthyCount = 0;
        let mutatedCount = 0;

        // 1. STAGE: GROWTH, MUTATION, CONSUMPTION, AND DEATH
        for (let y = 0; y < params.gridHeight; y++) {
            for (let x = 0; x < params.gridWidth; x++) {
                const gridCell = newGrid[y][x];
                
                if (gridCell.cell && gridCell.cell.state !== CellStateMap.DEAD) {
                    
                    const cellInstance = new Cell(gridCell.cell as SerializedCell); 
                    const nutrient = gridCell.nutrient;
                    const cellData = cellInstance.dataSnapshot; 
                    
                    // --- 1.1. Mutation ---
                    cellInstance.attemptMutation(checkProbability);

                    // --- 1.2. Consumption and Viability Check ---
                    
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
                    
                    // --- 1.3. Growth and Division ---
                    if (checkProbability(cellData.growthRate)) {
                        attemptDivision(newGrid, x, y, cellInstance.dataSnapshot, params);
                    }
                    
                    // --- 1.4. Age ---
                    cellInstance.ageCell();

                    // --- 1.5. Metrics ---
                    if (cellData.state === CellStateMap.MUTATED) {
                        mutatedCount++;
                    } else {
                        healthyCount++;
                    }
                    
                    newGrid[y][x].cell = cellInstance.toSerialized(); 
                }
            }
        }
        
        // 2. STAGE: DIFFUSION 
        newGrid = runDiffusionStep(newGrid, params.gridWidth, params.gridHeight);
        
        // **Етап Decay (Розпаду) ВИДАЛЕНО**
        
        // 3. STAGE: EXPANSION CHECK (РОЗШИРЕННЯ ВІДНОВЛЕНО)
        const totalCells = healthyCount + mutatedCount;
        const maxCells = params.gridWidth * params.gridHeight;
        
        if (totalCells / maxCells > params.maxDensityThreshold) {
             const { newGrid: expandedGrid, newWidth, newHeight } = expandGridCells(newGrid, 2, params);
             
             dispatch(expandGrid({ newGrid: expandedGrid, newWidth, newHeight }));
             
             // Зупиняємо поточний крок, очікуючи на наступний крок з новою сіткою
             return; 
        }

        // 4. DISPATCH UPDATES
        dispatch(updateGrid(newGrid));
        dispatch(addAnalysisData({
            step: state.simulation.currentStep + 1,
            healthy: healthyCount,
            mutated: mutatedCount,
            total: totalCells,
        }));
    }
);


// ----------------------------------------------------------------------
// B. DIVISION LOGIC
// ----------------------------------------------------------------------

function attemptDivision(grid: GridCell[][], x: number, y: number, parentCell: SerializedCell, params: SimulationParams): boolean {
    const { gridWidth, gridHeight } = params;
    
    const neighborsPos = getNeighbors(x, y, gridWidth, gridHeight);
    const emptyNeighbors = neighborsPos.filter(pos => grid[pos.y][pos.x].cell === null);

    if (emptyNeighbors.length === 0) {
        return false; 
    }

    const targetPos = emptyNeighbors[getRandomInt(0, emptyNeighbors.length - 1)];
    
    const newCellData = createNewCell(
        targetPos.x, 
        targetPos.y, 
        parentCell.rootColonyId, 
        parentCell.color, 
        parentCell.state === CellStateMap.MUTATED, 
        params
    );

    grid[targetPos.y][targetPos.x].cell = newCellData;
    
    return true;
}


// ----------------------------------------------------------------------
// C. HELPER FUNCTIONS 
// ----------------------------------------------------------------------

function runDiffusionStep(grid: GridCell[][], width: number, height: number): GridCell[][] {
    const newGrid = JSON.parse(JSON.stringify(grid));
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const currentCell = grid[y][x];
            const neighborsPos = getNeighbors(x, y, width, height);
            
            let sumO2Level = currentCell.nutrient.oxygen.level;
            let sumGluLevel = currentCell.nutrient.glucose.level;
            
            const count = neighborsPos.length + 1; 

            neighborsPos.forEach(pos => {
                const neighborNutrient = grid[pos.y][pos.x].nutrient;
                sumO2Level += neighborNutrient.oxygen.level;
                sumGluLevel += neighborNutrient.glucose.level;
            });
            
            const avgO2Level = sumO2Level / count;
            const avgGluLevel = sumGluLevel / count;

            const diffRateO2 = currentCell.nutrient.oxygen.diffusionRate;
            const diffRateGlu = currentCell.nutrient.glucose.diffusionRate;
            
            const newO2Level = currentCell.nutrient.oxygen.level + diffRateO2 * (avgO2Level - currentCell.nutrient.oxygen.level);
            const newGluLevel = currentCell.nutrient.glucose.level + diffRateGlu * (avgGluLevel - currentCell.nutrient.glucose.level);
            
            newGrid[y][x].nutrient.oxygen.level = Math.max(0, newO2Level);
            newGrid[y][x].nutrient.glucose.level = Math.max(0, newGluLevel);
        }
    }
    return newGrid;
}

function getNeighbors(x: number, y: number, width: number, height: number): { x: number, y: number }[] {
    const neighbors = [];
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue; 
            
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                neighbors.push({ x: nx, y: ny });
            }
        }
    }
    return neighbors;
}