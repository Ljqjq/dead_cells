
import { v4 as uuidv4 } from 'uuid';

// Генерація унікального ID
export const generateId = (): string => uuidv4();

// Отримання випадкового цілого числа в діапазоні [min, max]
export const getRandomInt = (min: number, max: number): number => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Перевірка імовірності (повертає true, якщо rand(0, 1) < probability)
export const checkProbability = (probability: number): boolean => {
    return Math.random() < probability;
};