
import React, { useState } from 'react';
import SimulationControls from './components/SimulationControls'; 
import InteractiveGrid from './components/InteractiveGrid';       
import GridVisualizer from './components/GridVisualizer'; 
import AnalysisChart from './components/AnalysisChart'; 

// --- Тип для вибору, що відображати у головній області ---
type DisplayMode = 'VISUALIZER' | 'PLAYGROUND';

const App: React.FC = () => {
    // Починаємо з "красивого" режиму (GridVisualizer)
    const [displayMode, setDisplayMode] = useState<DisplayMode>('VISUALIZER'); 
     
    const GridAreaComponent = displayMode === 'VISUALIZER' ? GridVisualizer : InteractiveGrid;
    
    const toggleMode = () => {
        setDisplayMode(prev => 
            prev === 'VISUALIZER' ? 'PLAYGROUND' : 'VISUALIZER'
        );
    };

    return (
        <div className="app-container" style={{ padding: '16px' }}>
            <h1 className="app-title">Dead Cells: Моделювання Популяції 🦠</h1>
            
            <div className="content-area" style={{ display: 'flex', gap: '30px' }}>
                
                {/* 1. ЛІВА ПАНЕЛЬ: КЕРУВАННЯ (ЗАВЖДИ ВИДИМА) */}
                <div className="controls-container" style= {{overflowY: 'auto', height: '100%',}}>
                    <SimulationControls />
                    <div className="chart-section" style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', marginTop: '20px' }}>
                        <h2 className="chart-title" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Аналіз Популяції</h2>
                        <AnalysisChart /> 
                    </div>
                </div>

                {/* 2. ПРАВА ПАНЕЛЬ: ВІЗУАЛІЗАЦІЯ (ПЕРЕКЛЮЧАЄТЬСЯ) */}
                <div className="visualizer-container" style={{ flexGrow: 1 }}>
                    
                    {/* КНОПКА ПЕРЕМИКАННЯ */}
                    <button 
                        onClick={toggleMode}
                        style={{ 
                            padding: '10px 20px', 
                            marginBottom: '20px', 
                            backgroundColor: displayMode === 'VISUALIZER' ? '#3b82f6' : '#f59e0b', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '5px',
                            cursor: 'pointer'
                        }}
                    >
                        {displayMode === 'VISUALIZER' 
                            ? '🎮 Увімкнути Режим Редагування (Playground)' 
                            : '👁️ Повернутися до Візуалізації (Simulation)'}
                    </button>
                    
                    {/* Умовне відображення візуалізатора */}
                    <GridAreaComponent /> 
                    
                </div>
            </div>
            
        </div>
    );
};

export default App;