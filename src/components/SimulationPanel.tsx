// src/components/SimulationPanel.tsx (Повний вміст)
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store/store';
import { startInitialization, runSimulationStep } from '../services/simulationService';
import { toggleRunning, setParams } from '../store/simulationSlice';

const SimulationPanel: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { isRunning, currentStep, params } = useSelector((state: RootState) => state.simulation);
    
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

    // Визначення класу кнопки Старт/Пауза
    const startPauseClass = isRunning ? 'btn-pause' : 'btn-start';
    const disabledClass = (currentStep === 0 && !isRunning) ? 'btn-disabled' : '';

    return (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}> {/* p-4 space-y-4 */}
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Керування Симуляцією</h2>
            
            <button
                onClick={handleInit}
                className="panel-button btn-init"
            >
                Ініціалізувати Симуляцію
            </button>

            <button
                onClick={handleToggle}
                className={`panel-button ${startPauseClass} ${disabledClass}`}
                disabled={currentStep === 0 && !isRunning}
            >
                {isRunning ? 'Пауза' : 'Старт Симуляції'}
            </button>
            
            <div className="panel-stat">
                Поточний Крок: **{currentStep}**
            </div>

            <div className="panel-setting-group">
                 <h3 className="panel-setting-title">Налаштування</h3>
                 
                 {/* Повзунок швидкості */}
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
                 
                 {/* Інші параметри */}
                 <p className="text-xs" style={{ marginTop: '8px' }}>Ширина: {params.gridWidth}, Висота: {params.gridHeight}</p>
                 <p className="text-xs">Поч. засновників: {params.initialCellCount}</p>
            </div>
        </div>
    );
};

export default SimulationPanel;