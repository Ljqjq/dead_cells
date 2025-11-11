// src/services/simulationService.ts
import { createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState } from '../store/store'; 
import { updateGrid, addAnalysisData, initializeSimulation, type SimulationState } from '../store/simulationSlice.ts'; 
import { placeInitialCells, createInitialGrid, createNewCell } from '../utils/initialization';
import { getRandomInt, checkProbability } from '../utils/random';

// Імпорт ЗНАЧЕНЬ (CellStateMap)
import { CellStateMap } from '../models/types'; 
// Імпорт ТИПІВ
import type { GridCell, SimulationParams } from '../models/types'; 


// ----------------------------------------------------------------------
// A. ІНІЦІАЛІЗАЦІЯ (Thunk)
// ----------------------------------------------------------------------

export const startInitialization = createAsyncThunk(
    'simulation/startInitialization',
    async (_, { getState, dispatch }) => {
        const state = (getState() as RootState).simulation;
        const params = state.params;

        let initialGrid = createInitialGrid(params.gridWidth, params.gridHeight);
        const { grid: finalGrid, colonies } = placeInitialCells(initialGrid, params);

        dispatch(initializeSimulation({ grid: finalGrid, colonies }));
        
        const analysisData = calculateMetrics(finalGrid, colonies, 0);
        dispatch(addAnalysisData(analysisData));
    }
);


// ----------------------------------------------------------------------
// B. ОСНОВНИЙ ЦИКЛ СИМУЛЯЦІЇ (Thunk)
// ----------------------------------------------------------------------

export const runSimulationStep = createAsyncThunk(
    'simulation/runSimulationStep',
    async (_, { getState, dispatch }) => {
        const state = (getState() as RootState).simulation;
        const params = state.params;
        const currentStep = state.currentStep;

        // Deep copy of the grid for safe computations
        let newGrid: GridCell[][] = JSON.parse(JSON.stringify(state.grid));
        
        // 1. STAGE: GROWTH, MUTATION, AND DEATH
        for (let y = 0; y < params.gridHeight; y++) {
            for (let x = 0; x < params.gridWidth; x++) {
                const gridCell = newGrid[y][x];
                
                if (gridCell.cell && gridCell.cell.state !== CellStateMap.DEAD) {
                    const cell = gridCell.cell;
                    const nutrient = gridCell.nutrient;
                    
                    // --- 1.1. Mutation ---
                    if (cell.state === CellStateMap.HEALTHY && checkProbability(cell.mutationProbability)) {
                        cell.state = CellStateMap.MUTATED;
                        cell.growthRate *= 1.2; 
                    }

                    // --- 1.2. Consumption and Viability Check ---
                    const consumedO2 = cell.growthRate * nutrient.oxygen.consumptionRate;
                    const consumedGlu = cell.growthRate * nutrient.glucose.consumptionRate;

                    const hasEnoughO2 = nutrient.oxygen.level >= nutrient.oxygen.threshold;
                    const hasEnoughGlu = nutrient.glucose.level >= nutrient.glucose.threshold;

                    nutrient.oxygen.level = Math.max(0, nutrient.oxygen.level - consumedO2);
                    nutrient.glucose.level = Math.max(0, nutrient.glucose.level - consumedGlu);
                    
                    // Death from resource starvation
                    if (!hasEnoughO2 || !hasEnoughGlu) {
                        cell.state = CellStateMap.DEAD;
                        newGrid[y][x].cell = null; 
                        continue; 
                    }
                    
                    // --- 1.3. Growth / Division ---
                    if (checkProbability(cell.growthRate)) {
                        const neighbors = getNeighbors(x, y, params.gridWidth, params.gridHeight);
                        const emptyNeighbors = neighbors.filter(pos => newGrid[pos.y][pos.x].cell === null);
                        
                        if (emptyNeighbors.length > 0) {
                            const newPos = emptyNeighbors[getRandomInt(0, emptyNeighbors.length - 1)];
                            const isMutated = cell.state === CellStateMap.MUTATED;
                            
                            const newCell = createNewCell(
                                newPos.x,
                                newPos.y,
                                cell.rootColonyId,
                                cell.color,
                                isMutated
                            );
                            if (isMutated) {
                                newCell.growthRate = cell.growthRate;
                            }

                            newGrid[newPos.y][newPos.x].cell = newCell;
                        }
                    }

                    cell.age++;
                }
            }
        }
        
        // 2. STAGE: DIFFUSION AND DECAY
        newGrid = runDiffusionStep(newGrid, params.gridWidth, params.gridHeight);
        
        // Apply Decay after diffusion
        for (let y = 0; y < params.gridHeight; y++) {
             for (let x = 0; x < params.gridWidth; x++) {
                 const n = newGrid[y][x].nutrient;
                 n.oxygen.level = Math.max(0, n.oxygen.level * (1 - n.oxygen.decayRate));
                 n.glucose.level = Math.max(0, n.glucose.level * (1 - n.glucose.decayRate));
             }
        }

        // 3. STAGE: CHECK FOR EXPANSION AND PERSISTENCE
        const metrics = calculateMetrics(newGrid, state.rootColonies, currentStep + 1);
        
        if (metrics.total / (params.gridWidth * params.gridHeight) > params.maxDensityThreshold) {
            console.warn("Density reached threshold. Grid expansion required.");
            // TODO: Implement expansion logic (Step 11)
        }

        // Save new state to Redux
        dispatch(updateGrid(newGrid));
        dispatch(addAnalysisData(metrics));

        return true;
    }
);


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

const calculateMetrics = (
    grid: GridCell[][], 
    colonies: SimulationState['rootColonies'], 
    step: number
): { step: number, healthy: number, mutated: number, total: number } => {
    let healthy = 0;
    let mutated = 0;
    let total = 0;

    grid.forEach(row => row.forEach(gc => {
        if (gc.cell) {
            total++;
            if (gc.cell.state === CellStateMap.HEALTHY) healthy++;
            if (gc.cell.state === CellStateMap.MUTATED) mutated++;
        }
    }));

    return { step, healthy, mutated, total };
};