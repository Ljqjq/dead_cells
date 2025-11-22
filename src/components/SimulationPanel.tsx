import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store/store';
import { startInitialization, runSimulationStep } from '../services/simulationService';
import { toggleRunning, setParams } from '../store/simulationSlice';
import type { SimulationParams, GridCell } from '../models/types'; 

import InteractivePlayground from './InteractivePlayground'; 


// --- ДОПОМІЖНА ФУНКЦІЯ ---
const getGridCoordsFromClick = (event: React.MouseEvent<HTMLDivElement, MouseEvent>, cellWidth: number, cellHeight: number): { x: number, y: number } => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / cellWidth);
    const y = Math.floor((event.clientY - rect.top) / cellHeight);
    return { x, y };
};


const SimulationPanel: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { isRunning, currentStep, params, rootColonies, analysisHistory, grid } = useSelector((state: RootState) => state.simulation);
    
    // --- СТАНИ ДЛЯ ВІЗУАЛІЗАЦІЇ ТА ІНТЕРАКТИВНОСТІ ---
    const [isPlaygroundOpen, setIsPlaygroundOpen] = useState(false);
    const [lastClickCoords, setLastClickCoords] = useState<{ x: number, y: number } | null>(null);
    const CELL_SIZE = params.cellSizePx || 10; 
    
    // --- СТАРІ СТАНИ ТА РЕФИ ---
    const [displaySpeed, setDisplaySpeed] = useState(1000 / params.simulationSpeedMs); 
    const intervalRef = useRef<number | null>(null);
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
    
    
    // --- Обробник Кліку для Сітки ---
    const handleGridClick = useCallback((event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (!isInitialized || !isPlaygroundOpen || isRunning) return; 

        const { x, y } = getGridCoordsFromClick(event, CELL_SIZE, CELL_SIZE);
        setLastClickCoords({ x, y });

    }, [isPlaygroundOpen, isRunning, CELL_SIZE, isInitialized]); 

    
    // --- Функція Рендерингу Сітки (ОНОВЛЕНО: ДОДАНО СКРОЛІНГ) ---
    const renderGrid = () => {
    if (!isInitialized || !grid || grid.length === 0) {
         return <div style={{ minWidth: '500px', height: '500px', border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            Сітка не ініціалізована. Натисніть "Ініціалізувати Симуляцію".
        </div>;
    }

    const canvasWidth = params.gridWidth * CELL_SIZE;
    const canvasHeight = params.gridHeight * CELL_SIZE;
    
    // Логіка курсора: показуємо 'crosshair' тільки коли інтерактивність дозволена
    const isInteractive = isPlaygroundOpen && !isRunning && isInitialized; 
    const cursorStyle = isInteractive ? 'crosshair' : 'default';

    return (
        // Контейнер для скролінгу (виправляє обрізання сітки на вузьких екранах)
        <div style={{ 
            overflow: 'auto', 
            flexShrink: 1, 
        }}> 
            <div 
                style={{ 
                    // Внутрішній елемент має фіксовані розміри сітки
                    width: canvasWidth, 
                    height: canvasHeight, 
                    display: 'grid', 
                    gridTemplateColumns: `repeat(${params.gridWidth}, ${CELL_SIZE}px)`,
                    border: '1px solid #ccc',
                    cursor: cursorStyle, // Застосування стилю курсора
                }}
                onClick={handleGridClick}
            >
                {grid.flat().map((gridCell: GridCell, index: number) => {
                    return (
                        <div
                            key={index}
                            style={{
                                width: CELL_SIZE,
                                height: CELL_SIZE,
                                backgroundColor: gridCell.cell 
                                    ? gridCell.cell.color
                                    : `rgba(0, 100, 0, ${Math.min(1, gridCell.nutrient.oxygen.level / 100)})`, // Відображення O₂
                                border: '1px dotted #eee',
                                boxSizing: 'border-box'
                            }}
                            title={`[${index % params.gridWidth}, ${Math.floor(index / params.gridWidth)}]`}
                        />
                    );
                })}
            </div>
        </div>
    );
};


    return (
        <div style={{ padding: '16px', display: 'flex', gap: '30px', minHeight: '80vh' }}>
            
            {/* 1. ЛІВА ПАНЕЛЬ: КЕРУВАННЯ ТА НАЛАШТУВАННЯ */}
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

            {/* 2. ПРАВА ПАНЕЛЬ: ВІЗУАЛІЗАЦІЯ ТА ІНТЕРАКТИВНІСТЬ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flexGrow: 1 }}>
                
                {/* Кнопка Тоггл для Інтерактивного Майданчика */}
                <button 
                    onClick={() => setIsPlaygroundOpen(!isPlaygroundOpen)}
                    disabled={!isPlaygroundOpen && (isRunning || !isInitialized)} 
                    style={{ 
                        padding: '10px 20px', 
                        backgroundColor: isPlaygroundOpen ? '#f59e0b' : '#3b82f6', 
                        color: 'white', 
                        border: 'none',
                        cursor: (!isPlaygroundOpen && (isRunning || !isInitialized)) ? 'not-allowed' : 'pointer'
                    }}
                >
                    {isPlaygroundOpen ? 'Сховати Інтерактивний Майданчик ✖' : 'Відкрити Інтерактивний Майданчик 🎮'}
                </button>

                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                    
                    {/* Відображення Сітки */}
                    {renderGrid()}

                    {/* Інтерактивний Майданчик (Тільки якщо відкрито) */}
                    {isPlaygroundOpen && (
                        <InteractivePlayground 
                            onClickCoords={lastClickCoords}
                            gridWidth={params.gridWidth}
                            gridHeight={params.gridHeight}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default SimulationPanel;