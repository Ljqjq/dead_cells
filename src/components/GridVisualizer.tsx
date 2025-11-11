// src/components/GridVisualizer.tsx
import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { CellStateMap } from '../models/types'; 
import type { GridCell } from '../models/types'; 

const GridVisualizer: React.FC = () => {
    const { grid, params, currentStep } = useSelector((state: RootState) => state.simulation);

    const cellSize = 15; // Розмір клітинки в пікселях

    // ВИДАЛЕНО: Функцію renderCell, оскільки вона більше не використовується.
    
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
                    row.map((gridCell, x) => (
                        <div 
                            key={`${x}-${y}`} 
                            style={{ 
                                width: `${cellSize}px`,
                                height: `${cellSize}px`,
                                // Динамічне визначення кольору
                                backgroundColor: gridCell.cell 
                                    ? gridCell.cell.color 
                                    : `rgb(200, 200, ${Math.min(255, Math.floor(gridCell.nutrient.glucose.level * 2.5))})`, 
                                
                                // Стилі для клітин (з бордером)
                                ...(gridCell.cell && gridCell.cell.state !== CellStateMap.DEAD && { 
                                    borderColor: '#000', 
                                    borderWidth: '1px' 
                                }),
                                
                                // Стилі для мертвих/мутованих клітин (якщо потрібно)
                                ...(gridCell.cell && gridCell.cell.state === CellStateMap.DEAD && {
                                    backgroundColor: 'rgba(55, 65, 81, 0.5)', 
                                }),
                                ...(gridCell.cell && gridCell.cell.state === CellStateMap.MUTATED && {
                                    borderColor: '#b91c1c', 
                                }),

                            }}
                            title={`(${x}, ${y}) O2: ${gridCell.nutrient.oxygen.level.toFixed(1)}, Glu: ${gridCell.nutrient.glucose.level.toFixed(1)}`}
                        >
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default GridVisualizer;