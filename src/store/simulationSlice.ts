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

// Функція для створення початкової порожньої сітки (потрібна лише для початкового стану)
const createInitialEmptyGrid = (width: number, height: number, initialNutrientLevel: number): GridCell[][] => {
    const grid: GridCell[][] = [];
    // Використовуємо лише параметри, що залежать від середовища
    const initialNutrientComponent = { 
        level: initialNutrientLevel, 
        diffusionRate: 0, // У початковому стані використовуємо нульові значення для швидкості
        decayRate: 0, 
    };
    
    for (let y = 0; y < height; y++) {
        const row: GridCell[] = [];
        for (let x = 0; x < width; x++) {
            row.push({
                x,
                y,
                cell: null,
                nutrient: {
                    oxygen: JSON.parse(JSON.stringify(initialNutrientComponent)),
                    glucose: JSON.parse(JSON.stringify(initialNutrientComponent)),
                },
            });
        }
        grid.push(row);
    }
    return grid;
};


const initialState: SimulationState = {
    params: initialSimulationParams,
    // Примітка: використовуємо початкові параметри для створення порожньої сітки
    grid: createInitialEmptyGrid(
        initialSimulationParams.gridWidth, 
        initialSimulationParams.gridHeight, 
        initialSimulationParams.initialNutrientLevel
    ),
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
            // При зміні ключових параметрів, що впливають на сітку/клітини, скидаємо стан
            if (action.payload.gridWidth || 
                action.payload.gridHeight || 
                action.payload.initialCellCount ||
                action.payload.initialCellConsumptionRate !== undefined || // НОВЕ
                action.payload.initialCellSurvivalThreshold !== undefined // НОВЕ
            ) {
                 state.currentStep = 0;
                 state.isRunning = false;
                 state.rootColonies = [];
                 state.analysisHistory = [];
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