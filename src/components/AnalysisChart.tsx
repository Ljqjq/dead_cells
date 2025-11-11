// src/components/AnalysisChart.tsx
import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

// Реєстрація необхідних компонентів Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const AnalysisChart: React.FC = () => {
    const { analysisData, rootColonies } = useSelector((state: RootState) => state.simulation);

    if (analysisData.length === 0) {
        return <div className="text-center text-gray-500 mt-5">Запустіть симуляцію для відображення даних.</div>;
    }

    // --- Підготовка даних для графіка ---
    
    const labels = analysisData.map(d => d.step);

    const healthyData = analysisData.map(d => d.healthy);
    const mutatedData = analysisData.map(d => d.mutated);
    const totalData = analysisData.map(d => d.total);
    
    const data = {
        labels,
        datasets: [
            {
                label: 'Загальна популяція',
                data: totalData,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                tension: 0.2,
                borderWidth: 2,
                pointRadius: 1,
            },
            {
                label: 'Здорові клітини',
                data: healthyData,
                borderColor: 'rgb(53, 162, 235)',
                backgroundColor: 'rgba(53, 162, 235, 0.5)',
                tension: 0.2,
                borderWidth: 2,
                pointRadius: 1,
                hidden: true, 
            },
            {
                label: 'Мутовані клітини',
                data: mutatedData,
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                tension: 0.2,
                borderWidth: 2,
                pointRadius: 1,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false, 
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Крок Симуляції',
                },
            },
            y: {
                title: {
                    display: true,
                    text: 'Кількість Клітин',
                },
            },
        },
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: false,
                text: 'Динаміка Клітинної Популяції',
            },
        },
    };

    return (
        <div className="h-64">
            <Line options={options} data={data} />
        </div>
    );
};

export default AnalysisChart;