// src/store/simulationSlice.ts

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { initialSimulationParams } from '../utils/initialization'; 
// Імпортуємо SerializedRootColony (однина)
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
    // ВИПРАВЛЕНО: Змінено з SerializedRootColonies на SerializedRootColony
    rootColonies: SerializedRootColony[]; 
    currentStep: number;
    isRunning: boolean;
    analysisHistory: AnalysisData[];
}

// Функція для створення початкової порожньої сітки (потрібна лише для початкового стану)
const createInitialEmptyGrid = (width: number, height: number): GridCell[][] => {
    const grid: GridCell[][] = [];
    // Для Redux ініціалізація повинна бути швидкою, тому використовуємо мінімальні дані.
    for (let y = 0; y < height; y++) {
        const row: GridCell[] = [];
        for (let x = 0; x < width; x++) {
            row.push({
                x,
                y,
                cell: null,
                nutrient: {
                    oxygen: { level: 0, diffusionRate: 0, decayRate: 0, consumptionRate: 0, threshold: 0 },
                    glucose: { level: 0, diffusionRate: 0, decayRate: 0, consumptionRate: 0, threshold: 0 },
                },
            });
        }
        grid.push(row);
    }
    return grid;
};


const initialState: SimulationState = {
    params: initialSimulationParams,
    grid: createInitialEmptyGrid(initialSimulationParams.gridWidth, initialSimulationParams.gridHeight),
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
        // Ініціалізація симуляції з початковою сіткою та колоніями
        initializeSimulation: (state, action: PayloadAction<{ grid: GridCell[][], colonies: SerializedRootColony[] }>) => {
            state.grid = action.payload.grid;
            state.rootColonies = action.payload.colonies;
            state.currentStep = 0; 
            state.isRunning = false; 
            state.analysisHistory = [];
        },
        
        // ОНОВЛЕННЯ СІТКИ: Збільшуємо крок після кожного успішного кроку симуляції
        updateGrid: (state, action: PayloadAction<GridCell[][]>) => {
            state.grid = action.payload;
            state.currentStep += 1; 
        },

        // Перемикання стану запуску/паузи
        toggleRunning: (state) => {
            state.isRunning = !state.isRunning;
        },

        // Додавання даних аналізу до історії
        addAnalysisData: (state, action: PayloadAction<AnalysisData>) => {
            state.analysisHistory.push(action.payload);
        },
        
        // Розширення сітки (викликається, коли щільність занадто висока)
        expandGrid: (state, action: PayloadAction<{ newGrid: GridCell[][], newWidth: number, newHeight: number }>) => {
            state.grid = action.payload.newGrid;
            state.params.gridWidth = action.payload.newWidth;
            state.params.gridHeight = action.payload.newHeight;
        },

        // Оновлення параметрів симуляції (наприклад, з панелі керування)
        setParams: (state, action: PayloadAction<Partial<SimulationParams>>) => {
            state.params = { ...state.params, ...action.payload };
            // Якщо змінюються розміри або початкова кількість, скидаємо симуляцію
            if (action.payload.gridWidth || action.payload.gridHeight || action.payload.initialCellCount) {
                 state.currentStep = 0;
                 state.isRunning = false;
                 state.rootColonies = [];
                 state.analysisHistory = [];
                 // Примітка: сама сітка буде переініціалізована в startInitialization
            }
        },
    },
});

// ----------------------------------------------------------------------
// 3. EXPORTS
// ----------------------------------------------------------------------

// Експортуємо всі згенеровані дії (actions)
export const { 
    updateGrid, 
    initializeSimulation, 
    addAnalysisData, 
    expandGrid,
    toggleRunning,
    setParams, 
} = simulationSlice.actions; 

// Експортуємо сам редюсер
export default simulationSlice.reducer;