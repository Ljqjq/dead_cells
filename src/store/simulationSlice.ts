// src/store/simulationSlice.ts

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { initialSimulationParams } from '../utils/initialization'; 
import type { GridCell, SerializedRootColony, SimulationParams } from '../models/types'; 

// ----------------------------------------------------------------------
// 1. STATE DEFINITION
// ----------------------------------------------------------------------

export interface AnalysisData {
    step: number;
    healthy: number;
    mutated: number;
    total: number;
}

export interface SimulationState {
    params: SimulationParams;
    grid: GridCell[][];
    rootColonies: SerializedRootColony[];
    currentStep: number;
    isRunning: boolean;
    analysisHistory: AnalysisData[];
}

// Функція для створення початкової порожньої сітки
const createInitialEmptyGrid = (params: SimulationParams): GridCell[][] => {
    const grid: GridCell[][] = [];
    
    // Створення базових поживних компонентів для порожньої сітки
    const initialNutrientComponentO2 = { 
        level: params.initialOxygenLevel, 
        diffusionRate: params.oxygenDiffusionRate, 
        // decayRate ВИДАЛЕНО
    };
    const initialNutrientComponentGlu = { 
        level: params.initialGlucoseLevel, 
        diffusionRate: params.glucoseDiffusionRate, 
        // decayRate ВИДАЛЕНО
    };
    
    for (let y = 0; y < params.gridHeight; y++) {
        const row: GridCell[] = [];
        for (let x = 0; x < params.gridWidth; x++) {
            row.push({
                x,
                y,
                cell: null,
                nutrient: {
                    oxygen: JSON.parse(JSON.stringify(initialNutrientComponentO2)),
                    glucose: JSON.parse(JSON.stringify(initialNutrientComponentGlu)),
                },
            });
        }
        grid.push(row);
    }
    return grid;
};


const initialState: SimulationState = {
    params: initialSimulationParams,
    grid: createInitialEmptyGrid(initialSimulationParams), 
    rootColonies: [],
    currentStep: 0,
    isRunning: false,
    analysisHistory: [],
};


// ----------------------------------------------------------------------
// 2. SLICE CREATION
// ----------------------------------------------------------------------

const simulationSlice = createSlice({
    name: 'simulation',
    initialState,
    reducers: {
        initializeSimulation: (state, action: PayloadAction<{ grid: GridCell[][], colonies: SerializedRootColony[] }>) => {
            state.grid = action.payload.grid;
            state.rootColonies = action.payload.colonies;
            state.currentStep = 0; 
            state.isRunning = false; 
            state.analysisHistory = [];
        },
        
        updateGrid: (state, action: PayloadAction<GridCell[][]>) => {
            state.grid = action.payload;
            state.currentStep += 1; 
        },

        toggleRunning: (state) => {
            state.isRunning = !state.isRunning;
        },

        addAnalysisData: (state, action: PayloadAction<AnalysisData>) => {
            state.analysisHistory.push(action.payload);
        },
        
        expandGrid: (state, action: PayloadAction<{ newGrid: GridCell[][], newWidth: number, newHeight: number }>) => {
            state.grid = action.payload.newGrid;
            state.params.gridWidth = action.payload.newWidth;
            state.params.gridHeight = action.payload.newHeight;
        },

        setParams: (state, action: PayloadAction<Partial<SimulationParams>>) => {
            state.params = { ...state.params, ...action.payload };
            
            // Перелік усіх параметрів, зміна яких вимагає реініціалізації (скидання сітки)
            const shouldReset = (
                action.payload.gridWidth || 
                action.payload.gridHeight || 
                action.payload.initialCellCount ||
                action.payload.initialCellConsumptionRate !== undefined ||
                action.payload.initialCellSurvivalThreshold !== undefined ||
                
                // ЗМІНА ПОЧАТКОВИХ РІВНІВ ЧИ ДИФУЗІЇ ВИМАГАЄ СКИДАННЯ
                action.payload.initialOxygenLevel !== undefined ||
                action.payload.oxygenDiffusionRate !== undefined ||
                action.payload.initialGlucoseLevel !== undefined ||
                action.payload.glucoseDiffusionRate !== undefined
            );

            if (shouldReset) {
                 state.currentStep = 0;
                 state.isRunning = false;
                 state.rootColonies = [];
                 state.analysisHistory = [];
                 state.grid = createInitialEmptyGrid(state.params); 
            }
        },
    },
});

// ----------------------------------------------------------------------
// 3. EXPORTS
// ----------------------------------------------------------------------

export const { 
    updateGrid, 
    initializeSimulation, 
    addAnalysisData, 
    expandGrid,
    toggleRunning,
    setParams, 
} = simulationSlice.actions; 

export default simulationSlice.reducer;