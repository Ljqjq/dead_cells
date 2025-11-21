// src/components/NutrientInspector.tsx

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { type RootState } from '../store/store';
import { setNutrientLevel } from '../services/simulationService';
import { type Nutrient } from '../models/types'; 

/**
 * Використовуємо keyof Nutrient для гарантування типобезпеки.
 * NutrientType буде автоматично 'oxygen' | 'glucose' (або більше, якщо ви додасте нові ресурси).
 */
type NutrientType = keyof Nutrient; 

interface NutrientInspectorProps {
    coords: { x: number, y: number };
    onClose: () => void;
}

const NutrientInspector: React.FC<NutrientInspectorProps> = ({ coords, onClose }) => {
    const dispatch = useDispatch();
    
    // Отримання даних про ресурси вибраної комірки
    const nutrientData = useSelector((state: RootState) => {
        const { x, y } = coords;
        const grid = state.simulation.grid;
        if (y >= 0 && y < grid.length && x >= 0 && x < grid[y].length) {
            return grid[y][x]?.nutrient;
        }
        return null;
    });

    // Локальний стан для введення користувача
    const [o2Input, setO2Input] = useState(nutrientData?.oxygen.level || 0);
    const [glucoseInput, setGlucoseInput] = useState(nutrientData?.glucose.level || 0);

    // Синхронізація локального стану з Redux при зміні вибраної комірки
    useEffect(() => {
        if (nutrientData) {
            setO2Input(nutrientData.oxygen.level);
            setGlucoseInput(nutrientData.glucose.level);
        }
    }, [nutrientData, coords]);

    const handleSave = () => {
        const x = coords.x;
        const y = coords.y;

        // Валідація: значення не може бути від'ємним
        if (o2Input < 0 || glucoseInput < 0) {
            alert('Рівень поживних речовин не може бути від’ємним.');
            return;
        }

        // 1. Виклик Thunk для оновлення O2 (використовуємо 'oxygen' як ключ типу NutrientType)
        if (o2Input !== nutrientData?.oxygen.level) {
            dispatch(setNutrientLevel({ x, y, type: 'oxygen' as NutrientType, value: o2Input }) as any);
        }
        
        // 2. Виклик Thunk для оновлення Глюкози (використовуємо 'glucose' як ключ типу NutrientType)
        if (glucoseInput !== nutrientData?.glucose.level) {
            dispatch(setNutrientLevel({ x, y, type: 'glucose' as NutrientType, value: glucoseInput }) as any);
        }
        
        onClose(); 
    };

    if (!nutrientData) {
        return <div style={{ padding: '20px', minWidth: '300px' }}>Виберіть комірку для редагування.</div>;
    }

    return (
        <div style={{ padding: '20px', borderLeft: '2px solid #ddd', minWidth: '300px', backgroundColor: '#f9f9f9', height: 'fit-content' }}>
            <h4>🧪 Редагування ресурсів</h4>
            <p>Координати: ({coords.x}, {coords.y})</p>
            
            <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block' }}>**O₂ Рівень** (0+):</label>
                <input 
                    type="number" 
                    value={o2Input} 
                    onChange={(e) => setO2Input(parseFloat(e.target.value))} 
                    min="0"
                    style={{ width: '100%', padding: '5px' }}
                />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block' }}>**Глюкоза Рівень** (0+):</label>
                <input 
                    type="number" 
                    value={glucoseInput} 
                    onChange={(e) => setGlucoseInput(parseFloat(e.target.value))} 
                    min="0"
                    style={{ width: '100%', padding: '5px' }}
                />
            </div>
            
            <button onClick={handleSave} style={{ marginRight: '10px', padding: '8px 15px', backgroundColor: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer' }}>**Зберегти**</button>
            <button onClick={onClose} style={{ padding: '8px 15px', backgroundColor: '#f44336', color: 'white', border: 'none', cursor: 'pointer' }}>Скасувати</button>
        </div>
    );
};

export default NutrientInspector;