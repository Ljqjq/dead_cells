// src/components/SimulationPanel.tsx (ПОВНА ВЕРСІЯ)
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store/store';
import { startInitialization, runSimulationStep } from '../services/simulationService';
import { toggleRunning, setParams } from '../store/simulationSlice';

const SimulationPanel: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    // ОНОВЛЕНО: Додаємо rootColonies для перевірки ініціалізації
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

    // ВИПРАВЛЕННЯ УМОВИ: Симуляція ініціалізована, якщо є кореневі колонії
    const isInitialized = rootColonies.length > 0;
    
    // Визначення класів
    const startPauseClass = isRunning ? 'btn-pause' : 'btn-start';
    
    // Кнопка Старт/Пауза відключена, лише якщо симуляція ще не ініціалізована І не запущена.
    const isDisabled = !isInitialized && !isRunning; 

    return (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

            <div className="panel-setting-group">
                 <h3 className="panel-setting-title">Налаштування</h3>
                 
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
                 
                 <p className="text-xs" style={{ marginTop: '8px' }}>Ширина: {params.gridWidth}, Висота: {params.gridHeight}</p>
                 <p className="text-xs">Поч. засновників: {params.initialCellCount}</p>
            </div>
        </div>
    );
};

export default SimulationPanel;