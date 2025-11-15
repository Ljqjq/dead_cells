// src/components/GridVisualizer.tsx (Нова версія з Canvas)

import React, { useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { CellStateMap } from '../models/types'; 

// Конфігурація відображення
const CELL_SIZE_PX = 10;
const MUTATION_HIGHLIGHT_COLOR = '#8b5cf6'; // Пурпуровий
const EMPTY_COLOR = '#e5e7eb'; // Колір порожнього середовища

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

        // Очищення та встановлення розмірів
        canvas.width = width * CELL_SIZE_PX;
        canvas.height = height * CELL_SIZE_PX;

        // Починаємо малювання
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const gridCell = grid[y][x];
                const cell = gridCell.cell;
                
                let fillColor = EMPTY_COLOR;
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
                    const brightness = Math.min(255, Math.floor(nutrientLevel * 2.5));
                    fillColor = `rgb(200, 200, ${brightness})`; 
                }

                // Малювання заповнення
                ctx.fillStyle = fillColor;
                ctx.fillRect(x * CELL_SIZE_PX, y * CELL_SIZE_PX, CELL_SIZE_PX, CELL_SIZE_PX);

                // Малювання контуру (якщо є)
                if (strokeWidth > 0) {
                    ctx.strokeStyle = strokeColor;
                    ctx.lineWidth = strokeWidth;
                    ctx.strokeRect(x * CELL_SIZE_PX, y * CELL_SIZE_PX, CELL_SIZE_PX, CELL_SIZE_PX);
                }
            }
        }
    }, [grid, params.gridWidth, params.gridHeight]); // Залежність від сітки та розмірів

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '8px' }}>Крок симуляції: {currentStep}</h3>
            
            <div 
                style={{
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #ccc',
                }}
            >
                {/* Елемент Canvas */}
                <canvas ref={canvasRef} /> 
            </div>
            
            <p style={{ marginTop: '10px', fontSize: '12px', color: '#6b7280' }}>
                *Фон відображає рівень поживних речовин (синій відтінок).
            </p>
        </div>
    );
};

export default GridVisualizer;