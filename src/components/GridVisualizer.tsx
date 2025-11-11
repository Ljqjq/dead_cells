// src/components/GridVisualizer.tsx
import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store'; // <-- ВИПРАВЛЕНО
import { CellStateMap } from '../models/types'; 
import type { GridCell } from '../models/types'; 

const GridVisualizer: React.FC = () => {
    const { grid, params, currentStep } = useSelector((state: RootState) => state.simulation);

    const cellSize = 15; // Розмір клітинки в пікселях

    const renderCell = (cell: GridCell) => {
        if (cell.cell) {
            // Клітина є
            if (cell.cell.state === CellStateMap.DEAD) {
                return 'bg-gray-700 opacity-50';
            }
            if (cell.cell.state === CellStateMap.MUTATED) {
                return `bg-red-500 border border-red-700`;
            }
            // Колір здорової клітини залежить від колонії
            return `border border-gray-900`; 
        } else {
            // Клітина порожня - відображаємо ресурс (наприклад, Glucose)
            const glucoseLevel = cell.nutrient.glucose.level;
            // Масштабування для візуального відображення рівня (від 0 до 900)
            const intensity = Math.min(900, Math.floor(glucoseLevel * 9)); 
            
            // Використовуємо фіксований синій колір для фону, залежний від інтенсивності.
            const blueValue = Math.round(255 * (intensity / 900));
            // const hexColor = `rgb(200, 200, ${blueValue})`;

            return `opacity-50`; 
        }
    };

    return (
        <div className="flex flex-col items-center">
            <h3 className="text-lg font-semibold mb-2">Крок симуляції: {currentStep}</h3>
            <div 
                className="grid shadow-xl bg-gray-200"
                style={{
                    gridTemplateColumns: `repeat(${params.gridWidth}, ${cellSize}px)`,
                    gridTemplateRows: `repeat(${params.gridHeight}, ${cellSize}px)`,
                }}
            >
                {grid.map((row, y) => 
                    row.map((gridCell, x) => (
                        <div 
                            key={`${x}-${y}`} 
                            className={`
                                w-[${cellSize}px] h-[${cellSize}px]
                            `}
                            style={{ 
                                backgroundColor: gridCell.cell 
                                    ? gridCell.cell.color 
                                    : `rgb(200, 200, ${Math.min(255, Math.floor(gridCell.nutrient.glucose.level * 2.5))})`,
                                ...gridCell.cell && { 
                                    borderColor: '#000', 
                                    borderWidth: '1px' 
                                }
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