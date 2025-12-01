import { 
    type GridCell, 
    CellStateMap, 
    type Coordinate 
} from '../models/types'; 

// ====================================================================
// КЛАС: ClusterAnalyzer (Аналіз Фізичних Кластерів за допомогою BFS)
// ====================================================================

/**
 * Інкапсулює логіку обходу сітки для знаходження та класифікації 
 * фізично з'єднаних кластерів клітин (здорових/мутованих) за допомогою BFS.
 */
export class ClusterAnalyzer {
    private grid: GridCell[][];
    private width: number;
    private height: number;
    private visited: boolean[][];

    constructor(grid: GridCell[][], width: number, height: number) {
        this.grid = grid;
        this.width = width;
        this.height = height;
        // Ініціалізація visited як порожній масив, він буде скинутий у analyze()
        this.visited = Array(height).fill(0).map(() => Array(width).fill(false)); 
    }

    private getNeighbors(x: number, y: number): Coordinate[] {
        const neighbors: Coordinate[] = [];
        // Перевіряємо 8 сусідів (включаючи діагоналі)
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
    
    /**
     * Запускає обхід в ширину (BFS) для ідентифікації кластера.
     * Повертає true, якщо в цьому кластері знайдено хоча б одну мутовану клітину.
     * @param startX - Початкова координата X
     * @param startY - Початкова координата Y
     */
    private runBFS(startX: number, startY: number): boolean {
        let isMutated = false;
        
        const queue: Coordinate[] = [{ x: startX, y: startY }];
        this.visited[startY][startX] = true;
        
        // Перевіряємо, чи початкова клітина не є мутованою
        if (this.grid[startY][startX].cell?.state === CellStateMap.MUTATED) {
            isMutated = true;
        }

        while (queue.length > 0) {
            const current = queue.shift()!;
            const neighborsPos = this.getNeighbors(current.x, current.y);

            for (const pos of neighborsPos) {
                const nx = pos.x;
                const ny = pos.y;
                const neighborCell = this.grid[ny][nx].cell;

                // Якщо сусід має клітину, вона не мертва і ще не була відвідана
                if (neighborCell && neighborCell.state !== CellStateMap.DEAD && !this.visited[ny][nx]) {
                    
                    this.visited[ny][nx] = true;
                    queue.push(pos);
                    
                    if (neighborCell.state === CellStateMap.MUTATED) {
                        isMutated = true;
                    }
                }
            }
        }
        return isMutated; 
    }

    /**
     * Виконує повний аналіз сітки та повертає статистику кластерів.
     */
    public analyze(): { 
        totalClusters: number, 
        healthyClusters: number, 
        mutatedClusters: number 
    } {
        let totalClusters = 0;
        let healthyClusters = 0;
        let mutatedClusters = 0;

        // Скидаємо visited перед кожним новим аналізом
        this.visited = Array(this.height).fill(0).map(() => Array(this.width).fill(false)); 

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const cellData = this.grid[y][x].cell;
                
                // Якщо є жива клітина, і вона не була відвідана (належить до нового кластера)
                if (cellData && cellData.state !== CellStateMap.DEAD && !this.visited[y][x]) {
                    
                    totalClusters++;
                    
                    const isMutatedCluster = this.runBFS(x, y);
                    
                    if (isMutatedCluster) {
                        mutatedClusters++;
                    } else {
                        healthyClusters++;
                    }
                }
            }
        }
        
        return { totalClusters, healthyClusters, mutatedClusters };
    }
}