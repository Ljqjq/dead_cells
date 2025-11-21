import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { type RootState } from '../store/store';
import { placeNewColony, removeCellAt, setNutrientLevel } from '../services/simulationService';
import { type Nutrient } from '../models/types'; // Припускаємо імпорт інтерфейсу Nutrient

// --- Типи для внутрішнього стану ---
type InteractionMode = 'VIEW' | 'ADD_CELL' | 'DELETE_CELL' | 'EDIT_NUTRIENT';
// Використовуємо keyof Nutrient, як ви просили, для типобезпеки
type NutrientType = keyof Nutrient; 

interface InteractivePlaygroundProps {
    // Координати останнього кліку, передані з батьківського компонента (SimulationPanel)
    onClickCoords: { x: number, y: number } | null;
    gridWidth: number;
    gridHeight: number;
}

const InteractivePlayground: React.FC<InteractivePlaygroundProps> = ({ onClickCoords, gridWidth, gridHeight }) => {
    const dispatch = useDispatch();
    const grid = useSelector((state: RootState) => state.simulation.grid);

    // Локальний стан: керує обраним режимом
    const [mode, setMode] = useState<InteractionMode>('VIEW');
    
    // Координати комірки, відкритої для редагування (використовується для форми ресурсів)
    const [selectedCellCoords, setSelectedCellCoords] = useState<{ x: number, y: number } | null>(null);

    // Локальний стан для значень у формі редагування ресурсів
    const [o2Input, setO2Input] = useState(0);
    const [glucoseInput, setGlucoseInput] = useState(0);

    // --- Обробка Кліку (Реагує на зміни onClickCoords з батьківського компонента) ---
    useEffect(() => {
        if (!onClickCoords) return;

        const { x, y } = onClickCoords;
        
        // 1. Скидаємо selectedCellCoords, якщо не в режимі редагування
        if (mode !== 'EDIT_NUTRIENT') {
            setSelectedCellCoords(null); 
        }

        try {
            switch (mode) {
                case 'ADD_CELL':
                    // Додати Клітину
                    dispatch(placeNewColony({ x, y }) as any);
                    break;
                case 'DELETE_CELL':
                    // Видалити Клітину
                    dispatch(removeCellAt({ x, y }) as any);
                    break;
                case 'EDIT_NUTRIENT':
                    // Встановлюємо координати для відображення форми
                    setSelectedCellCoords({ x, y });
                    
                    // Ініціалізуємо поля форми поточними значеннями
                    if (grid[y] && grid[y][x]?.nutrient) {
                        setO2Input(grid[y][x].nutrient.oxygen.level);
                        setGlucoseInput(grid[y][x].nutrient.glucose.level);
                    }
                    break;
                case 'VIEW':
                default:
                    // Просто перегляд
                    break;
            }
        } catch (error) {
            console.error("Interaction failed:", error);
            // Тут можна відобразити помилку
        }

    // Включаємо grid у залежності, щоб оновлювати локальні стани при зміні сітки
    }, [onClickCoords, mode, dispatch, grid]); 

    
    // --- Логіка Редагування Ресурсів (ВБУДОВАНА) ---

    const handleSaveNutrients = () => {
        if (!selectedCellCoords) return;
        const { x, y } = selectedCellCoords;

        // 1. Валідація: значення не може бути від'ємним
        if (o2Input < 0 || glucoseInput < 0) {
            alert('Рівень поживних речовин не може бути від’ємним.');
            return;
        }
        
        // Отримуємо поточні значення для перевірки, чи дійсно щось змінилося
        const currentData = grid[y][x]?.nutrient;
        
        // 2. Виклик Thunk для оновлення O2
        if (currentData && o2Input !== currentData.oxygen.level) {
            dispatch(setNutrientLevel({ x, y, type: 'oxygen' as NutrientType, value: o2Input }) as any);
        }
        
        // 3. Виклик Thunk для оновлення Глюкози
        if (currentData && glucoseInput !== currentData.glucose.level) {
            dispatch(setNutrientLevel({ x, y, type: 'glucose' as NutrientType, value: glucoseInput }) as any);
        }
        
        // Закриваємо форму після збереження
        setSelectedCellCoords(null); 
    };

    const handleCancelNutrients = () => {
        setSelectedCellCoords(null);
    };

    const getModeStyle = (m: InteractionMode) => ({
        backgroundColor: mode === m ? '#e0f7fa' : '#ffffff',
        border: '1px solid #00bcd4',
        marginRight: '5px',
        padding: '5px 10px',
        cursor: 'pointer'
    });

    return (
        <div style={{ padding: '15px', border: '1px solid #00bcd4', backgroundColor: '#f5f5f5', borderRadius: '5px', height: 'fit-content' }}>
            <h3>🛠️ Панель Інтерактивності</h3>
            
            {/* Керування Режимами */}
            <div style={{ display: 'flex', marginBottom: '15px' }}>
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
                    <p>Координати: ({selectedCellCoords.x}, {selectedCellCoords.y})</p>
                    
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