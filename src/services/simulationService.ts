// src/services/simulationService.ts

import { createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState } from '../store/store';
import { initializeSimulation, updateGrid, addAnalysisData, expandGrid } from '../store/simulationSlice';
import { 
    expandGridCells, 
    createInitialGrid, 
    placeInitialCells,
    createNewCell 
} from '../utils/initialization';
import { 
    Cell, 
    CellStateMap, 
    type GridCell, 
    type SerializedCell, 
    type SimulationParams 
} from '../models/types';
import { getRandomInt } from '../utils/random';


export const startInitialization = createAsyncThunk(
    'simulation/startInitialization',
    async (_, { getState, dispatch }) => {
        const params: SimulationParams = (getState() as RootState).simulation.params;
        
        let grid = createInitialGrid(params.gridWidth, params.gridHeight, params);
        const { grid: initializedGrid, colonies } = placeInitialCells(grid, params);
        
        dispatch(initializeSimulation({ grid: initializedGrid, colonies }));
    }
);

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

        for (let y = 0; y < params.gridHeight; y++) {
            for (let x = 0; x < params.gridWidth; x++) {
                const gridCell = newGrid[y][x];
                
                if (gridCell.cell && gridCell.cell.state !== CellStateMap.DEAD) {
                    
                    const cellInstance = new Cell(gridCell.cell as SerializedCell); 
                    const nutrient = gridCell.nutrient;
                    const cellData = cellInstance.dataSnapshot; 
                    
                    cellInstance.attemptMutation(checkProbability);

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
                    
                    if (checkProbability(cellData.growthRate)) {
                        attemptDivision(newGrid, x, y, cellInstance.dataSnapshot, params);
                    }
                    
                    cellInstance.ageCell();

                    if (cellData.state === CellStateMap.MUTATED) {
                        mutatedCount++;
                    } else {
                        healthyCount++;
                    }
                    totalCells++;
                    
                    newGrid[y][x].cell = cellInstance.toSerialized(); 
                }
            }
        }
        
        newGrid = runDiffusionStep(newGrid, params.gridWidth, params.gridHeight);
        
        const { 
            totalClusters, 
            healthyClusters, 
            mutatedClusters 
        } = findPhysicalClusters(newGrid, params.gridWidth, params.gridHeight); 
        
        const maxCells = params.gridWidth * params.gridHeight;
        
        if (totalCells > 0 && totalCells / maxCells > params.maxDensityThreshold) {
             const { newGrid: expandedGrid, newWidth, newHeight } = expandGridCells(newGrid, 2, params);
             
             dispatch(expandGrid({ newGrid: expandedGrid, newWidth, newHeight }));
             return; 
        }

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


function findPhysicalClusters(grid: GridCell[][], width: number, height: number): { 
    totalClusters: number, 
    healthyClusters: number, 
    mutatedClusters: number 
} {
    const visited: boolean[][] = Array(height).fill(0).map(() => Array(width).fill(false));
    let totalClusters = 0;
    let healthyClusters = 0;
    let mutatedClusters = 0;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const cellData = grid[y][x].cell;
            
            if (cellData && cellData.state !== CellStateMap.DEAD && !visited[y][x]) {
                totalClusters++;
                let isMutatedCluster = false;
                
                const queue: { x: number, y: number }[] = [{ x, y }];
                visited[y][x] = true;

                while (queue.length > 0) {
                    const current = queue.shift()!;
                    const currentCell = grid[current.y][current.x].cell;

                    if (currentCell && currentCell.state === CellStateMap.MUTATED) {
                        isMutatedCluster = true;
                    }
                    
                    const neighborsPos = getNeighbors(current.x, current.y, width, height);

                    for (const pos of neighborsPos) {
                        const nx = pos.x;
                        const ny = pos.y;
                        const neighborCellData = grid[ny][nx].cell;

                        if (neighborCellData && neighborCellData.state !== CellStateMap.DEAD && !visited[ny][nx]) {
                            visited[ny][nx] = true;
                            queue.push(pos);
                        }
                    }
                }
                
                if (isMutatedCluster) {
                    mutatedClusters++;
                } else {
                    healthyClusters++;
                }
            }
        }
    }
    
    return { totalClusters, healthyClusters, mutatedClusters };
}

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