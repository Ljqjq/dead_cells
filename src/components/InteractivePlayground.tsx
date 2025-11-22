import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { type RootState } from '../store/store';
import { placeNewColony, removeCellAt, setNutrientLevel } from '../services/simulationService';
import { type Nutrient } from '../models/types'; 

// --- Типи для внутрішнього стану ---
type InteractionMode = 'VIEW' | 'ADD_CELL' | 'DELETE_CELL' | 'EDIT_NUTRIENT';
type NutrientType = keyof Nutrient; 

interface InteractivePlaygroundProps {
    onClickCoords: { x: number, y: number } | null;
    gridWidth: number;
    gridHeight: number;
}

const InteractivePlayground: React.FC<InteractivePlaygroundProps> = ({ onClickCoords, gridWidth, gridHeight }) => {
    const dispatch = useDispatch();
    const grid = useSelector((state: RootState) => state.simulation.grid);

    // --- ЛОКАЛЬНІ СТАНИ ---
    const [mode, setMode] = useState<InteractionMode>('VIEW');
    const [selectedCellCoords, setSelectedCellCoords] = useState<{ x: number, y: number } | null>(null);

    const [o2Input, setO2Input] = useState(0);
    const [glucoseInput, setGlucoseInput] = useState(0);

    // --- Обробка Кліку ---
    useEffect(() => {
        if (!onClickCoords) return;

        const { x, y } = onClickCoords;
        
        if (mode !== 'EDIT_NUTRIENT') {
            setSelectedCellCoords(null); 
        }

        try {
            switch (mode) {
                case 'ADD_CELL':
                    dispatch(placeNewColony({ x, y }) as any);
                    break;
                case 'DELETE_CELL':
                    dispatch(removeCellAt({ x, y }) as any);
                    break;
                case 'EDIT_NUTRIENT':
                    setSelectedCellCoords({ x, y });
                    
                    if (grid[y] && grid[y][x]?.nutrient) {
                        setO2Input(grid[y][x].nutrient.oxygen.level);
                        setGlucoseInput(grid[y][x].nutrient.glucose.level);
                    }
                    break;
                case 'VIEW':
                default:
                    break;
            }
        } catch (error) {
            console.error("Interaction failed:", error);
        }

    }, [onClickCoords, mode, dispatch, grid]); 

    
    // --- Логіка Редагування Ресурсів ---
    const handleSaveNutrients = () => {
        if (!selectedCellCoords) return;
        const { x, y } = selectedCellCoords;

        if (o2Input < 0 || glucoseInput < 0) {
            alert('Рівень поживних речовин не може бути від’ємним.');
            return;
        }
        
        const currentData = grid[y][x]?.nutrient;
        
        if (currentData && o2Input !== currentData.oxygen.level) {
            dispatch(setNutrientLevel({ x, y, type: 'oxygen' as NutrientType, value: o2Input }) as any);
        }
        
        if (currentData && glucoseInput !== currentData.glucose.level) {
            dispatch(setNutrientLevel({ x, y, type: 'glucose' as NutrientType, value: glucoseInput }) as any);
        }
        
        setSelectedCellCoords(null); 
    };

    const handleCancelNutrients = () => {
        setSelectedCellCoords(null);
    };

    const getModeStyle = (m: InteractionMode) => ({
        backgroundColor: mode === m ? '#e0f7fa' : '#ffffff',
        color: mode === m ? '#007985' : '#00bcd4',
        fontWeight: mode === m ? 'bold' : 'normal',
        border: '1px solid #00bcd4',
        padding: '8px 10px',
        cursor: 'pointer',
        textAlign: 'left' as const, 
        width: '100%', 
        borderRadius: '3px',
        transition: 'background-color 0.2s',
    });

    return (
        <div style={{ 
            padding: '15px', 
            border: '1px solid #00bcd4', 
            backgroundColor: '#f5f5f5', 
            borderRadius: '5px', 
            height: 'fit-content', 
            minWidth: '220px',
            minHeight: '300px' 
        }}>
            <h3 style={{ marginBottom: '15px' }}>🛠️ Панель Інтерактивності</h3>
            
            {/* Керування Режимами (Вертикальний список) */}
            <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '8px', 
                marginBottom: '15px' 
            }}>
                <button style={getModeStyle('VIEW')} onClick={() => setMode('VIEW')}>
                    👁 Перегляд
                </button>
                <button style={getModeStyle('ADD_CELL')} onClick={() => setMode('ADD_CELL')}>
                    ➕ Додати Клітину
                </button>
                <button style={getModeStyle('DELETE_CELL')} onClick={() => setMode('DELETE_CELL')}>
                    ❌ Видалити Клітину
                </button>
                <button style={getModeStyle('EDIT_NUTRIENT')} onClick={() => setMode('EDIT_NUTRIENT')}>
                    🧪 Редагувати Ресурси
                </button>
            </div>
            
            <p style={{ fontWeight: 'bold' }}>Поточний Режим: {mode}</p>
            
            {/* ВБУДОВАНА ФОРМА РЕДАГУВАННЯ РЕСУРСІВ */}
            {mode === 'EDIT_NUTRIENT' && selectedCellCoords && (
                <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ccc', backgroundColor: '#ffffff' }}>
                    <h4>🧪 Редагування ресурсів</h4>
                    <p style={{ fontSize: '0.9em' }}>Координати: ({selectedCellCoords.x}, {selectedCellCoords.y})</p>
                    
                    <div style={{ marginBottom: '10px' }}>
                        <label style={{ display: 'block' }}>O₂ Рівень (0+):</label>
                        <input 
                            type="number" 
                            value={o2Input} 
                            onChange={(e) => setO2Input(parseFloat(e.target.value))} 
                            min="0"
                            style={{ width: '100%', padding: '5px' }}
                        />
                    </div>
                    
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block' }}>Глюкоза Рівень (0+):</label>
                        <input 
                            type="number" 
                            value={glucoseInput} 
                            onChange={(e) => setGlucoseInput(parseFloat(e.target.value))} 
                            min="0"
                            style={{ width: '100%', padding: '5px' }}
                        />
                    </div>
                    
                    <button onClick={handleSaveNutrients} style={{ marginRight: '10px', padding: '8px 15px', backgroundColor: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer' }}>Зберегти</button>
                    <button onClick={handleCancelNutrients} style={{ padding: '8px 15px', backgroundColor: '#f44336', color: 'white', border: 'none', cursor: 'pointer' }}>Скасувати</button>
                </div>
            )}
        </div>
    );
};

export default InteractivePlayground;