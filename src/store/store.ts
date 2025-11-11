// src/store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import simulationReducer from './simulationSlice.ts';

export const store = configureStore({
    reducer: {
        simulation: simulationReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;