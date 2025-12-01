import { createNewCell } from '../utils/initialization';

import type {
    Nutrient,
    NutrientComponent,
    CellState,
    SerializedCell,
    CellNutrientParams,
    SimulationParams,
    GridCell,
    Coordinate

} from "./types";

import {CellStateMap} from "./types"

export class Cell {
    private data: SerializedCell;

    constructor(serializedData: SerializedCell) {
        this.data = { ...serializedData }; 
    }

    private _getNeighbors(x: number, y: number, width: number, height: number): Coordinate[] {
        const neighbors = [];
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue; 
                
                const nx = x + dx;
                const ny = y + dy;
                
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                    neighbors.push({ x: nx, y: ny });
                }
            }
        }
        return neighbors;
    }

    /** Отримання випадкового цілого числа (перенесено з локальної функції) */
    private _getRandomInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    public attemptMutation(checkProbability: (prob: number) => boolean): void {
        if (this.data.state === CellStateMap.HEALTHY && checkProbability(this.data.mutationProbability)) {
            this.data.state = CellStateMap.MUTATED;
            this.data.growthRate *= 1.2; 
            this.data.oxygenParams.consumptionRate *= 1.5;
            this.data.glucoseParams.consumptionRate *= 1.5;
            this.data.oxygenParams.survivalThreshold *= 2.0; 
            this.data.glucoseParams.survivalThreshold *= 2.0;
        }
    }
    
    public ageCell(): void {
        this.data.age++;
    }
    
    public attemptAgeDeath(checkProbability: (prob: number) => boolean): boolean {
        const BASE_LIFESPAN = 100; 
        const AGE_START_DEATH = 50; 

        if (this.data.age < AGE_START_DEATH) {
            return false; 
        }

        const ageFactor = (this.data.age - AGE_START_DEATH) / BASE_LIFESPAN;
        const deathChance = Math.min(1.0, ageFactor); 
        
        if (checkProbability(deathChance)) {
            this.data.state = CellStateMap.DEAD;
            return true;
        }
        return false;
    }
    
    public checkViability(hasEnoughO2: boolean, hasEnoughGlu: boolean): boolean {
        if (!hasEnoughO2 || !hasEnoughGlu) { 
            this.data.state = CellStateMap.DEAD;
            return false;
        }
        return true;
    }
    
    // --- ООП: МЕТОД ПОДІЛУ ---
    public attemptDivision(
        checkProbability: (prob: number) => boolean, 
        grid: GridCell[][], 
        params: SimulationParams
    ): { targetPos: { x: number, y: number }, newCellData: SerializedCell } | null {
        
        if (!checkProbability(this.data.growthRate)) {
             return null;
        }

        const { gridWidth, gridHeight } = params;
        const x = this.data.x;
        const y = this.data.y;
        
        // Тут потрібен імпорт getNeighbors
        const neighborsPos = this._getNeighbors(x, y, gridWidth, gridHeight);
        const emptyNeighbors = neighborsPos.filter(pos => grid[pos.y][pos.x].cell === null);

        if (emptyNeighbors.length === 0) {
            return null;
        }

        // Тут потрібен імпорт getRandomInt
        const targetPos = emptyNeighbors[this._getRandomInt(0, emptyNeighbors.length - 1)];
        
        // Тут потрібен імпорт createNewCell
        const newCellData = createNewCell(
            targetPos.x, 
            targetPos.y, 
            this.data.rootColonyId, 
            this.data.color, 
            this.data.state === CellStateMap.MUTATED, 
            params
        );
        
        this.data.age = 0; 

        return { targetPos, newCellData };
    }


    public toSerialized(): SerializedCell {
        return this.data;
    }
    
    public get dataSnapshot(): Readonly<SerializedCell> {
        return this.data;
    }
}