// src/App.tsx (Повний вміст)
import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from './store/store';
import SimulationPanel from './components/SimulationPanel';
import GridVisualizer from './components/GridVisualizer';
import AnalysisChart from './components/AnalysisChart'; 

const App: React.FC = () => {
    return (
        <div className="app-container"> {/* Замість flex flex-col h-screen bg-gray-100 p-4 */}
            <h1 className="app-title"> {/* Замість text-3xl font-bold mb-4 text-center text-gray-800 */}
                Dead Cells: Моделювання Популяції 🦠
            </h1>
            
            <div className="content-area"> {/* Замість flex flex-grow overflow-hidden */}
                {/* Панель Керування та Графіки */}
                <div className="panel-container"> {/* Замість w-1/4 bg-white p-4 shadow-lg rounded-lg mr-4 overflow-y-auto */}
                    <SimulationPanel />
                    <div className="chart-section"> {/* Замість mt-6 border-t pt-4 */}
                        <h2 className="chart-title">Аналіз Популяції</h2> {/* Замість text-xl font-bold mb-2 */}
                        <AnalysisChart /> 
                    </div>
                </div>

                {/* Візуалізатор Сітки */}
                <div className="visualizer-container"> {/* Замість w-3/4 flex justify-center items-center bg-white shadow-lg rounded-lg p-4 */}
                    <GridVisualizer />
                </div>
            </div>
            
        </div>
    );
};

export default App;