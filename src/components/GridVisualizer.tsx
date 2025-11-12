// src/components/GridVisualizer.tsx (ПОВНА ВЕРСІЯ)

import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { CellStateMap } from '../models/types'; 
import type { GridCell } from '../models/types'; 

const GridVisualizer: React.FC = () => {
    const { grid, params, currentStep } = useSelector((state: RootState) => state.simulation);

    const cellSize = 15; // Розмір клітинки в пікселях
    const mutationHighlightColor = '#8b5cf6'; // Яскраво-пурпуровий (purple-500)

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '8px' }}>Крок симуляції: {currentStep}</h3>
            <div 
                style={{
                    display: 'grid',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
                    backgroundColor: '#e5e7eb',
                    gridTemplateColumns: `repeat(${params.gridWidth}, ${cellSize}px)`,
                    gridTemplateRows: `repeat(${params.gridHeight}, ${cellSize}px)`,
                }}
            >
                {grid.map((row, y) => 
                    row.map((gridCell, x) => {
                        const cell = gridCell.cell;

                        // Визначення кольору фону: клітина або рівень глюкози
                        let bgColor = cell 
                            ? cell.color 
                            : `rgb(200, 200, ${Math.min(255, Math.floor(gridCell.nutrient.glucose.level * 2.5))})`;
                        
                        // Стилі за замовчуванням
                        let cellStyle: React.CSSProperties = {
                            width: `${cellSize}px`,
                            height: `${cellSize}px`,
                            backgroundColor: bgColor,
                            borderWidth: '1px',
                            borderColor: '#000',
                            boxSizing: 'border-box',
                        };

                        if (cell) {
                            if (cell.state === CellStateMap.DEAD) {
                                // Сірий для мертвих клітин
                                cellStyle.backgroundColor = 'rgba(55, 65, 81, 0.5)'; 
                                cellStyle.borderColor = 'transparent';
                            } else if (cell.state === CellStateMap.MUTATED) {
                                // Пурпуровий контур для мутованих клітин
                                cellStyle.backgroundColor = mutationHighlightColor;
                                cellStyle.borderWidth = '2px'; // Збільшений контур для кращої видимості
                            }
                        } else {
                            // Якщо клітини немає, прибираємо контур, залишаючи колір поживних речовин
                            cellStyle.borderWidth = '0';
                        }
                        
                        return (
                            <div 
                                key={`${x}-${y}`} 
                                style={cellStyle}
                                title={`(${x}, ${y}) O2: ${gridCell.nutrient.oxygen.level.toFixed(1)}, Glu: ${gridCell.nutrient.glucose.level.toFixed(1)}`}
                            >
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default GridVisualizer;