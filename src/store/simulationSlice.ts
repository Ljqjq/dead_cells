// src/store/simulationSlice.ts
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit'; 
import type { GridCell, SimulationParams } from '../models/types'; 
import { initialSimulationParams, createInitialGrid } from '../utils/initialization';
import { runSimulationStep, startInitialization } from '../services/simulationService'; 

// --- State Interface ---
export interface SimulationState { 
    grid: GridCell[][];
    params: SimulationParams;
    currentStep: number;
    isRunning: boolean;
    analysisData: { step: number, healthy: number, mutated: number, total: number }[];
    rootColonies: { id: string, color: string }[];
}

// --- Initial State ---
const initialState: SimulationState = {
    params: initialSimulationParams,
    grid: createInitialGrid(initialSimulationParams.gridWidth, initialSimulationParams.gridHeight),
    currentStep: 0,
    isRunning: false,
    analysisData: [],
    rootColonies: []
};

export const simulationSlice = createSlice({
    name: 'simulation',
    initialState,
    reducers: {
        toggleRunning: (state) => {
            state.isRunning = !state.isRunning;
        },
        updateGrid: (state, action: PayloadAction<GridCell[][]>) => {
            state.grid = action.payload;
        },
        setParams: (state, action: PayloadAction<Partial<SimulationParams>>) => {
            state.params = { ...state.params, ...action.payload };
        },
        addAnalysisData: (state, action: PayloadAction<SimulationState['analysisData'][0]>) => {
            state.analysisData.push(action.payload);
        },
        initializeSimulation: (state, action: PayloadAction<{ grid: GridCell[][], colonies: SimulationState['rootColonies'] }>) => {
            state.grid = action.payload.grid;
            state.rootColonies = action.payload.colonies;
            state.currentStep = 0;
            state.analysisData = [];
            state.isRunning = false;
        },
        expandGrid: (state, action: PayloadAction<{ newGrid: GridCell[][], newWidth: number, newHeight: number }>) => {
            state.grid = action.payload.newGrid;
            state.params.gridWidth = action.payload.newWidth;
            state.params.gridHeight = action.payload.newHeight; 
        }
    },
    // --- Async Thunk Handlers ---
    extraReducers: (builder) => {
        builder.addCase(runSimulationStep.fulfilled, (state) => {
            state.currentStep += 1;
        });
        builder.addCase(startInitialization.fulfilled, (state) => {
            // No action needed here
        });
    }
});

export const { toggleRunning, updateGrid, setParams, addAnalysisData, initializeSimulation, expandGrid } = simulationSlice.actions;
export default simulationSlice.reducer;