import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import type { AnalysisData } from '../store/simulationSlice'; 

// --- Конфігурація відображення ---
const CHART_HEIGHT = 200;
const CHART_WIDTH = 480;
const PADDING = 20;

const AnalysisChart: React.FC = () => {
    const analysisHistory = useSelector((state: RootState) => state.simulation.analysisHistory);

    if (analysisHistory.length < 2) {
        return (
            <div style={{ padding: '16px', textAlign: 'center', height: `${CHART_HEIGHT + 40}px`, border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Графік Аналізу</h3>
                <p style={{ marginTop: '10px', color: '#6b7280' }}>Запустіть симуляцію, щоб побачити дані.</p>
            </div>
        );
    }

    // 1. Обчислення масштабів
    const steps = analysisHistory.map(d => d.step);
    const totals = analysisHistory.map(d => d.total);
    
    const maxStep = Math.max(...steps);
    const maxTotal = Math.max(...totals);
    
    // Якщо maxTotal дорівнює 0 (наприклад, якщо всі клітини загинули), запобігаємо діленню на нуль
    const yScale = maxTotal > 0 ? (CHART_HEIGHT - 2 * PADDING) / maxTotal : 0;
    const xScale = maxStep > 0 ? (CHART_WIDTH - 2 * PADDING) / maxStep : 0;

    // 2. Функції мапінгу для SVG
    const getX = (step: number) => PADDING + step * xScale;
    const getY = (value: number) => CHART_HEIGHT - PADDING - value * yScale;
    
    // 3. Генерація SVG-ліній
    const generatePath = (dataKey: keyof Omit<AnalysisData, 'step'>, color: string) => {
        // Перетворюємо точки на рядок path для SVG
        const pathData = analysisHistory
            .map((d, index) => {
                const x = getX(d.step);
                const y = getY(d[dataKey]); // Отримуємо значення 'healthy' або 'mutated'
                return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
            })
            .join(' ');
            
        return <path key={dataKey} d={pathData} fill="none" stroke={color} strokeWidth="2" />;
    };

    const healthyPath = generatePath('healthy', '#22c55e'); // Зелений для здорових
    const mutatedPath = generatePath('mutated', '#ef4444'); // Червоний для мутованих

    // 4. Створення осі X та Y (дуже спрощено)
    
    // Створення маркерів осі Y (максимальне значення)
    const yAxisMarkers = [
        <text key="y-max" x={PADDING - 5} y={PADDING + 5} fontSize="10" textAnchor="end">{maxTotal.toFixed(0)}</text>,
        <text key="y-zero" x={PADDING - 5} y={CHART_HEIGHT - PADDING + 5} fontSize="10" textAnchor="end">0</text>
    ];

    // Створення маркерів осі X (максимальний крок)
    const xAxisMarkers = [
        <text key="x-max" x={CHART_WIDTH - PADDING} y={CHART_HEIGHT - PADDING + 15} fontSize="10" textAnchor="end">{maxStep}</text>,
        <text key="x-zero" x={PADDING} y={CHART_HEIGHT - PADDING + 15} fontSize="10" textAnchor="start">0</text>
    ];


    return (
        <div style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '10px' }}>Графік Динаміки Клітин</h3>
            
            <svg width={CHART_WIDTH} height={CHART_HEIGHT} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
                {/* Сітка/Осі */}
                <line x1={PADDING} y1={PADDING} x2={PADDING} y2={CHART_HEIGHT - PADDING} stroke="#ccc" /> {/* Вісь Y */}
                <line x1={PADDING} y1={CHART_HEIGHT - PADDING} x2={CHART_WIDTH - PADDING} y2={CHART_HEIGHT - PADDING} stroke="#ccc" /> {/* Вісь X */}
                
                {yAxisMarkers}
                {xAxisMarkers}
                
                {/* Лінії даних */}
                {healthyPath}
                {mutatedPath}
                
            </svg>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '10px', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: '10px', height: '10px', backgroundColor: '#22c55e', marginRight: '5px' }}></div>
                    Здорові
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: '10px', height: '10px', backgroundColor: '#ef4444', marginRight: '5px' }}></div>
                    Мутовані
                </div>
            </div>
        </div>
    );
};

export default AnalysisChart;