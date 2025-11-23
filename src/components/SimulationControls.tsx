
import React, { useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store/store';
import { startInitialization, runSimulationStep } from '../services/simulationService';
import { toggleRunning, setParams } from '../store/simulationSlice';
import type { SimulationParams } from '../models/types'; 

const SimulationControls: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { isRunning, currentStep, params, rootColonies, analysisHistory } = useSelector((state: RootState) => state.simulation);
    
    // --- СТАНИ ТА РЕФИ ---
    const [displaySpeed, setDisplaySpeed] = React.useState(1000 / params.simulationSpeedMs); 
    const intervalRef = useRef<number | null>(null); // Реф для циклу симуляції
    const latestAnalysis = analysisHistory[analysisHistory.length - 1];
    
    // --- EFFECT (Цикл симуляції) ---
    useEffect(() => {
        if (isRunning) {
            const runStep = () => {
                dispatch(runSimulationStep());
            };
            
            if (intervalRef.current !== null) {
                clearInterval(intervalRef.current);
            }
            // Встановлюємо інтервал, який викликає runSimulationStep
            intervalRef.current = window.setInterval(runStep, params.simulationSpeedMs);
        } else {
            if (intervalRef.current !== null) {
                clearInterval(intervalRef.current);
            }
        }

        // Cleanup функція
        return () => {
            if (intervalRef.current !== null) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isRunning, dispatch, params.simulationSpeedMs]);


    // --- ОБРОБНИКИ КЕРУВАННЯ ---
    const handleInit = () => {
        dispatch(startInitialization());
    };

    const handleToggle = () => {
        dispatch(toggleRunning());
    };
    
    const handleSpeedChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const speedValue = parseInt(event.target.value, 10);
        setDisplaySpeed(speedValue); 
        
        const maxDelay = 1000;
        const minDelay = 10;
        
        const delay = maxDelay - ((speedValue - 1) / 99) * (maxDelay - minDelay);
        
        dispatch(setParams({ simulationSpeedMs: Math.round(delay) }));
    };

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
        <div style={{ 
            width: '350px', 
            flexShrink: 0, 
            backgroundColor: '#f9fafb', 
            borderRadius: '8px', 
            padding: '16px',
            overflowY: 'auto', 
            maxHeight: '80vh' 
        }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Керування Симуляцією</h2>
            
            {/* Кнопки Керування */}
            <button
                onClick={handleInit}
                className="panel-button btn-init"
                style={{ padding: '10px', marginBottom: '10px' }}
            >
                Ініціалізувати Симуляцію
            </button>

            <button
                onClick={handleToggle}
                className={`panel-button ${startPauseClass} ${isDisabled ? 'btn-disabled' : ''}`}
                disabled={isDisabled}
                style={{ padding: '10px', marginBottom: '10px' }}
            >
                {isRunning ? 'Пауза' : 'Старт Симуляції'}
            </button>
            
            <div className="panel-stat">
                Поточний Крок: **{currentStep}**
            </div>

            {latestAnalysis && (
                <div style={{ marginTop: '10px', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}>
                    <h4 style={{ fontWeight: 'bold' }}>📊 Аналіз Кластерів (BFS)</h4>
                    <p>Всього Клітин: **{latestAnalysis.total}**</p>
                    <p>Фізичних Кластерів: **{latestAnalysis.totalClusters}**</p>
                    <ul>
                        <li>Здорові: <strong style={{ color: '#22c55e' }}>{latestAnalysis.healthyClusters}</strong></li>
                        <li>Мутовані: <strong style={{ color: '#ef4444' }}>{latestAnalysis.mutatedClusters}</strong></li>
                    </ul>
                </div>
            )}
            
            <hr style={{ margin: '15px 0' }} />
            
            <div className="panel-setting-group">
                <h3 className="panel-setting-title">⚙️ Налаштування</h3>
                
                 <label className="label-text">
                    Швидкість (1 - 100): {Math.round(displaySpeed)}
                 </label>
                 <input
                    type="range"
                    min="1" max="100" value={displaySpeed} onChange={handleSpeedChange} className="range-input"
                 />
                 
                 <h4 style={{ fontWeight: 'bold', marginTop: '15px' }}>🖼️ Візуалізація</h4>
             
                 <label className="label-text">
                    Розмір Клітинки (px): {params.cellSizePx}
                 </label>
                 <input
                    type="range" min="3" max="20" step="1" value={params.cellSizePx} onChange={(e) => handleParamChange('cellSizePx', e.target.value)} className="range-input"
                 />
                 
                 <h4 style={{ fontWeight: 'bold', marginTop: '10px' }}>🦠 Клітини (Базові)</h4>
                 
                 <label className="label-text">
                    Шанс Мутації (0.0001 - 0.1):
                 </label>
                 <input
                    type="number" step="0.0001" min="0" max="1" value={params.initialCellMutationChance} onChange={(e) => handleParamChange('initialCellMutationChance', e.target.value)} style={{ border: '1px solid #ccc', padding: '4px', width: '100%' }}
                 />
                 
                 <label className="label-text">
                    Швидкість Росту (0.01 - 1.0):
                 </label>
                 <input
                    type="number" step="0.01" min="0.01" max="1.0" value={params.initialCellGrowthRate} onChange={(e) => handleParamChange('initialCellGrowthRate', e.target.value)} style={{ border: '1px solid #ccc', padding: '4px', width: '100%' }}
                 />
                 
                 <label className="label-text">
                    Базове Споживання (Consumption Rate):
                 </label>
                 <input
                    type="number" step="0.1" min="0" value={params.initialCellConsumptionRate} onChange={(e) => handleParamChange('initialCellConsumptionRate', e.target.value)} style={{ border: '1px solid #ccc', padding: '4px', width: '100%' }}
                 />

                 <label className="label-text">
                    Базовий Поріг Виживання (Threshold):
                 </label>
                 <input
                    type="number" step="1" min="0" value={params.initialCellSurvivalThreshold} onChange={(e) => handleParamChange('initialCellSurvivalThreshold', e.target.value)} style={{ border: '1px solid #ccc', padding: '4px', width: '100%' }}
                 />

                 
                 <h4 style={{ fontWeight: 'bold', marginTop: '15px', color: '#3b82f6' }}>🌬️ Середовище: Кисень ($O_2$)</h4>
                 
                 <label className="label-text">
                    Початковий Рівень $O_2$:
                 </label>
                 <input
                    type="number" step="5" min="0" value={params.initialOxygenLevel} onChange={(e) => handleParamChange('initialOxygenLevel', e.target.value)} style={{ border: '1px solid #ccc', padding: '4px', width: '100%' }}
                 />

                 <label className="label-text">
                    Швидкість Дифузії $O_2$ (0.0 - 1.0):
                 </label>
                 <input
                    type="number" step="0.05" min="0" max="1" value={params.oxygenDiffusionRate} onChange={(e) => handleParamChange('oxygenDiffusionRate', e.target.value)} style={{ border: '1px solid #ccc', padding: '4px', width: '100%' }}
                 />
                 

                 <h4 style={{ fontWeight: 'bold', marginTop: '10px', color: '#22c55e' }}>🍚 Середовище: Глюкоза (Glucose)</h4>
                 
                 <label className="label-text">
                    Початковий Рівень Glucose:
                 </label>
                 <input
                    type="number" step="5" min="0" value={params.initialGlucoseLevel} onChange={(e) => handleParamChange('initialGlucoseLevel', e.target.value)} style={{ border: '1px solid #ccc', padding: '4px', width: '100%' }}
                 />

                 <label className="label-text">
                    Швидкість Дифузії Glucose (0.0 - 1.0):
                 </label>
                 <input
                    type="number" step="0.05" min="0" max="1" value={params.glucoseDiffusionRate} onChange={(e) => handleParamChange('glucoseDiffusionRate', e.target.value)} style={{ border: '1px solid #ccc', padding: '4px', width: '100%' }}
                 />
                 
            </div>
        </div>
    );
};

export default SimulationControls;