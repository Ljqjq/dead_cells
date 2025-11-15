// src/components/SimulationPanel.tsx 

import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store/store';
import { startInitialization, runSimulationStep } from '../services/simulationService';
import { toggleRunning, setParams } from '../store/simulationSlice';
import type { SimulationParams } from '../models/types'; 

const SimulationPanel: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { isRunning, currentStep, params, rootColonies } = useSelector((state: RootState) => state.simulation);
    
    const [speed, setSpeed] = useState(params.simulationSpeedMs); 

    const intervalRef = useRef<number | null>(null);

    // --- Логіка Таймера ---
    useEffect(() => {
        if (isRunning) {
            const runStep = () => {
                dispatch(runSimulationStep());
            };
            
            intervalRef.current = window.setInterval(runStep, params.simulationSpeedMs);
        } else {
            if (intervalRef.current !== null) {
                clearInterval(intervalRef.current);
            }
        }

        return () => {
            if (intervalRef.current !== null) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isRunning, dispatch, params.simulationSpeedMs]);


    const handleInit = () => {
        dispatch(startInitialization());
    };

    const handleToggle = () => {
        dispatch(toggleRunning());
    };
    
    const handleSpeedChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newSpeed = parseInt(event.target.value, 10);
        setSpeed(newSpeed); 
        dispatch(setParams({ simulationSpeedMs: newSpeed }));
    };

    // Обробник змін числових параметрів
    const handleParamChange = (key: keyof SimulationParams, value: string) => {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
            dispatch(setParams({ [key]: numValue }));
        }
    };
    
    const isInitialized = rootColonies.length > 0;
    const startPauseClass = isRunning ? 'btn-pause' : 'btn-start';
    const isDisabled = !isInitialized && !isRunning; 

    return (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Керування Симуляцією</h2>
            
            <button
                onClick={handleInit}
                className="panel-button btn-init"
            >
                Ініціалізувати Симуляцію
            </button>

            <button
                onClick={handleToggle}
                className={`panel-button ${startPauseClass} ${isDisabled ? 'btn-disabled' : ''}`}
                disabled={isDisabled}
            >
                {isRunning ? 'Пауза' : 'Старт Симуляції'}
            </button>
            
            <div className="panel-stat">
                Поточний Крок: **{currentStep}**
            </div>

            ---
            
            <div className="panel-setting-group">
                 <h3 className="panel-setting-title">⚙️ Налаштування</h3>
                 
                 <label className="label-text">
                    Швидкість (кроків/мс): {speed}
                 </label>
                 <input
                    type="range"
                    min="10"
                    max="1000"
                    value={speed}
                    onChange={handleSpeedChange}
                    className="range-input"
                 />
                 
                 {/* --- ВІЗУАЛІЗАЦІЯ --- */}
                 <h4 style={{ fontWeight: 'bold', marginTop: '15px' }}>🖼️ Візуалізація</h4>
                 
                 <label className="label-text">
                    Розмір Клітинки (px): {params.cellSizePx}
                 </label>
                 <input
                    type="range"
                    min="3" 
                    max="20"
                    step="1"
                    value={params.cellSizePx}
                    onChange={(e) => handleParamChange('cellSizePx', e.target.value)}
                    className="range-input"
                 />
                 
                 {/* --- ПАРАМЕТРИ КЛІТИН --- */}
                 <h4 style={{ fontWeight: 'bold', marginTop: '10px' }}>🦠 Клітини (Базові)</h4>
                 
                 <label className="label-text">
                    Шанс Мутації (0.0001 - 0.1):
                 </label>
                 <input
                    type="number"
                    step="0.0001"
                    min="0"
                    max="1"
                    value={params.initialCellMutationChance}
                    onChange={(e) => handleParamChange('initialCellMutationChance', e.target.value)}
                    style={{ border: '1px solid #ccc', padding: '4px', width: '100%' }}
                 />
                 
                 <label className="label-text">
                    Швидкість Росту (0.01 - 1.0):
                 </label>
                 <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="1.0"
                    value={params.initialCellGrowthRate}
                    onChange={(e) => handleParamChange('initialCellGrowthRate', e.target.value)}
                    style={{ border: '1px solid #ccc', padding: '4px', width: '100%' }}
                 />
                 
                 <label className="label-text">
                    Базове Споживання (Consumption Rate):
                 </label>
                 <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={params.initialCellConsumptionRate}
                    onChange={(e) => handleParamChange('initialCellConsumptionRate', e.target.value)}
                    style={{ border: '1px solid #ccc', padding: '4px', width: '100%' }}
                 />

                 <label className="label-text">
                    Базовий Поріг Виживання (Threshold):
                 </label>
                 <input
                    type="number"
                    step="1"
                    min="0"
                    value={params.initialCellSurvivalThreshold}
                    onChange={(e) => handleParamChange('initialCellSurvivalThreshold', e.target.value)}
                    style={{ border: '1px solid #ccc', padding: '4px', width: '100%' }}
                 />

                 
                 {/* --- ПАРАМЕТРИ СЕРЕДОВИЩА: КИСЕНЬ ТА ГЛЮКОЗА --- */}
                 
                 <h4 style={{ fontWeight: 'bold', marginTop: '15px', color: '#3b82f6' }}>🌬️ Середовище: Кисень ($O_2$)</h4>
                 
                 <label className="label-text">
                    Початковий Рівень $O_2$:
                 </label>
                 <input
                    type="number"
                    step="5"
                    min="0"
                    value={params.initialOxygenLevel}
                    onChange={(e) => handleParamChange('initialOxygenLevel', e.target.value)}
                    style={{ border: '1px solid #ccc', padding: '4px', width: '100%' }}
                 />

                 <label className="label-text">
                    Швидкість Дифузії $O_2$ (0.0 - 1.0):
                 </label>
                 <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    value={params.oxygenDiffusionRate}
                    onChange={(e) => handleParamChange('oxygenDiffusionRate', e.target.value)}
                    style={{ border: '1px solid #ccc', padding: '4px', width: '100%' }}
                 />
                 
                 {/* Decay Rate для O2 ВИДАЛЕНО */}


                 <h4 style={{ fontWeight: 'bold', marginTop: '10px', color: '#22c55e' }}>🍚 Середовище: Глюкоза (Glucose)</h4>
                 
                 <label className="label-text">
                    Початковий Рівень Glucose:
                 </label>
                 <input
                    type="number"
                    step="5"
                    min="0"
                    value={params.initialGlucoseLevel}
                    onChange={(e) => handleParamChange('initialGlucoseLevel', e.target.value)}
                    style={{ border: '1px solid #ccc', padding: '4px', width: '100%' }}
                 />

                 <label className="label-text">
                    Швидкість Дифузії Glucose (0.0 - 1.0):
                 </label>
                 <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    value={params.glucoseDiffusionRate}
                    onChange={(e) => handleParamChange('glucoseDiffusionRate', e.target.value)}
                    style={{ border: '1px solid #ccc', padding: '4px', width: '100%' }}
                 />
                 
                 {/* Decay Rate для Glucose ВИДАЛЕНО */}

            </div>
        </div>
    );
};

export default SimulationPanel;