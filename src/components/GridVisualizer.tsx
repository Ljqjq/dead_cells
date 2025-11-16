// src/components/GridVisualizer.tsx (Повна Версія)

import React, { useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { CellStateMap } from '../models/types'; 

// Конфігурація відображення
const MUTATION_HIGHLIGHT_COLOR = '#8b5cf6'; // Пурпуровий


const GridVisualizer: React.FC = () => {
    const { grid, params, currentStep } = useSelector((state: RootState) => state.simulation);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    // ВАЖЛИВО: Логіка малювання Canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = params.gridWidth;
        const height = params.gridHeight;
        const cellSize = params.cellSizePx; 
        
        // Встановлюємо максимальний рівень, щоб коректно нормувати колір
        const MAX_NUTRIENT_LEVEL = 100; 

        // Очищення та встановлення розмірів
        canvas.width = width * cellSize;
        canvas.height = height * cellSize;

        // Починаємо малювання
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const gridCell = grid[y][x];
                const cell = gridCell.cell;
                
                let fillColor = 'white'; // Колір за замовчуванням
                let strokeColor = 'transparent';
                let strokeWidth = 0;

                if (cell) {
                    // Якщо клітина є
                    fillColor = cell.color;
                    strokeColor = '#000';
                    strokeWidth = 1;

                    if (cell.state === CellStateMap.DEAD) {
                        fillColor = 'rgba(55, 65, 81, 0.5)'; // Сірий для мертвих
                        strokeColor = 'transparent';
                    } else if (cell.state === CellStateMap.MUTATED) {
                        strokeColor = MUTATION_HIGHLIGHT_COLOR; // Пурпуровий контур
                        strokeWidth = 2; 
                    }
                } else {
                    // Якщо клітини немає, відображаємо рівень глюкози
                    const nutrientLevel = gridCell.nutrient.glucose.level;
                    
                    // Нормалізуємо рівень до діапазону 0-1
                    const normalizedLevel = Math.min(1, nutrientLevel / MAX_NUTRIENT_LEVEL);
                    
                    // Створюємо інвертовану синьо-білу шкалу
                    // Якщо normalizedLevel = 1 (MAX), компоненти G і R будуть 0.
                    // Якщо normalizedLevel = 0 (MIN), G і R будуть 255 (білий).
                    const whiteComponent = Math.round(255 * (1 - normalizedLevel));
                    const blueComponent = Math.round(255 * normalizedLevel);
                    
                    // Ми хочемо, щоб MIN була білою (R=255, G=255, B=255)
                    // і MAX була синьою (R=0, G=0, B=255)
                    
                    // Щоб отримати чистий синій при максимумі:
                    // Інтенсивність синього (B) - завжди 255.
                    // Інтенсивність червоного (R) та зеленого (G) - зменшується до 0.
                    const intensity = Math.round(255 * (1 - normalizedLevel));
                    
                    fillColor = `rgb(${intensity}, ${intensity}, 255)`; 
                    // При MAX_NUTRIENT (рівень 1): intensity = 0. Колір: rgb(0, 0, 255) -> Чистий синій.
                    // При MIN_NUTRIENT (рівень 0): intensity = 255. Колір: rgb(255, 255, 255) -> Чистий білий.
                }

                // Малювання заповнення
                ctx.fillStyle = fillColor;
                ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize); 

                // Малювання контуру (якщо є)
                if (strokeWidth > 0) {
                    ctx.strokeStyle = strokeColor;
                    ctx.lineWidth = strokeWidth;
                    ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize); 
                }
            }
        }
    }, [grid, params.gridWidth, params.gridHeight, params.cellSizePx]); 
   
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '8px' }}>Крок симуляції: {currentStep}</h3>
            
            <div 
                style={{
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #ccc',
                }}
            >
                <canvas ref={canvasRef} /> 
            </div>
            
            <p style={{ marginTop: '10px', fontSize: '12px', color: '#6b7280' }}>
                *Фон відображає рівень поживних речовин: **Синій** (MAX) &rarr; **Білий** (MIN).
            </p>
        </div>
    );
};

export default GridVisualizer;