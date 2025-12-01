import { 
    type GridCell, 
    type Coordinate 
} from '../models/types'; 

// ====================================================================
// КЛАС: NutrientDiffusion (Керування Дифузією Поживних Речовин)
// ====================================================================

/** * Інкапсулює логіку поширення поживних речовин 
 * (кисню та глюкози) по сітці на основі середнього значення сусідів. 
 */
export class NutrientDiffusion {
    private grid: GridCell[][];
    private width: number;
    private height: number;

    constructor(initialGrid: GridCell[][], width: number, height: number) {
        this.grid = initialGrid; 
        this.width = width;
        this.height = height;
    }

    private getNeighbors(x: number, y: number): Coordinate[] {
        const neighbors = [];
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue; 
                
                const nx = x + dx;
                const ny = y + dy;
                
                if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
                    neighbors.push({ x: nx, y: ny });
                }
            }
        }
        return neighbors;
    }

    /** * Запускає крок дифузії та повертає нову сітку з оновленими рівнями поживних речовин. 
     */
    public runDiffusionStep(): GridCell[][] {
        // Створення глибокої копії для обчислення нових значень
        // Примітка: При роботі з Redux це необхідно, оскільки ми змінюємо стан
        const newGrid = JSON.parse(JSON.stringify(this.grid));

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const currentCell = this.grid[y][x];
                const neighborsPos = this.getNeighbors(x, y);
                
                let sumO2Level = currentCell.nutrient.oxygen.level;
                let sumGluLevel = currentCell.nutrient.glucose.level;
                
                // Включаємо поточну клітину в обчислення середнього значення (для згладжування)
                const count = neighborsPos.length + 1; 

                neighborsPos.forEach(pos => {
                    const neighborNutrient = this.grid[pos.y][pos.x].nutrient;
                    sumO2Level += neighborNutrient.oxygen.level;
                    sumGluLevel += neighborNutrient.glucose.level;
                });
                
                const avgO2Level = sumO2Level / count;
                const avgGluLevel = sumGluLevel / count;

                const diffRateO2 = currentCell.nutrient.oxygen.diffusionRate;
                const diffRateGlu = currentCell.nutrient.glucose.diffusionRate;
                
                // Формула: Level_new = Level_current + Rate * (Avg_neighbor - Level_current)
                const newO2Level = currentCell.nutrient.oxygen.level + diffRateO2 * (avgO2Level - currentCell.nutrient.oxygen.level);
                const newGluLevel = currentCell.nutrient.glucose.level + diffRateGlu * (avgGluLevel - currentCell.nutrient.glucose.level);
                
                // Забезпечуємо, що рівні не можуть бути від'ємними
                newGrid[y][x].nutrient.oxygen.level = Math.max(0, newO2Level);
                newGrid[y][x].nutrient.glucose.level = Math.max(0, newGluLevel);
            }
        }
        return newGrid;
    }
}