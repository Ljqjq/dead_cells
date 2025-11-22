// src/components/InteractiveGrid.tsx (ОНОВЛЕНО)

import React, { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { type RootState } from '../store/store';
import InteractivePlayground from './InteractivePlayground'; 
import GridVisualizer from './GridVisualizer'; // ВИКОРИСТОВУЄМО ОНОВЛЕНИЙ КОМПОНЕНТ

const InteractiveGrid: React.FC = () => {
    const { isRunning, params, rootColonies } = useSelector((state: RootState) => state.simulation);
    const [isPlaygroundOpen, setIsPlaygroundOpen] = useState(false);
    const [lastClickCoords, setLastClickCoords] = useState<{ x: number, y: number } | null>(null);

    const CELL_SIZE = params.cellSizePx || 10;
    const isInitialized = rootColonies.length > 0;
    
    // --- Обробник Кліку для Canvas ---
    const handleGridClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
        // Кліки працюють, тільки якщо Playground відкритий, і симуляція на паузі
        if (!isInitialized || !isPlaygroundOpen || isRunning) return; 

        // ВИКОРИСТОВУЄМО offsetX/offsetY: Координати відносно елемента Canvas, 
        // що усуває проблеми зі зсувом.
        const clickX = event.nativeEvent.offsetX;
        const clickY = event.nativeEvent.offsetY;
        
        const x = Math.floor(clickX / CELL_SIZE);
        const y = Math.floor(clickY / CELL_SIZE);
        setLastClickCoords({ x, y });

    }, [isPlaygroundOpen, isRunning, CELL_SIZE, isInitialized]); 

    
    const isInteractive = isPlaygroundOpen && !isRunning && isInitialized; 
    const cursorStyle = isInteractive ? 'crosshair' : 'default';

    return (
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
                    cursor: 'pointer'
                }}
            >
                {isPlaygroundOpen ? 'Сховати Інтерактивний Майданчик ✖' : 'Відкрити Інтерактивний Майданчик 🎮'}
            </button>

            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                
                {/* 1. GridVisualizer тепер приймає обробник кліків та стиль курсора */}
                <div style={{ overflow: 'auto', flexShrink: 1 }}>
                    <GridVisualizer 
                        onClick={handleGridClick} 
                        cursorStyle={cursorStyle}
                    />
                </div>
                

                {/* 2. ПАНЕЛЬ ІНТЕРАКТИВНОСТІ (Тільки якщо відкрито) */}
                {isPlaygroundOpen && (
                    <InteractivePlayground 
                        onClickCoords={lastClickCoords}
                        gridWidth={params.gridWidth}
                        gridHeight={params.gridHeight}
                    />
                )}
            </div>
        </div>
    );
};

export default InteractiveGrid;