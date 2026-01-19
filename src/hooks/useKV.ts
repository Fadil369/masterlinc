import { useState, useEffect, Dispatch, SetStateAction } from 'react';

/**
 * A simple key-value storage hook that persists data to localStorage
 * This replaces the @github/spark useKV hook with local storage functionality
 * 
 * @param key - The storage key
 * @param defaultValue - Default value if key doesn't exist
 * @returns A tuple of [value, setValue] similar to useState
 */
export function useKV<T>(
  key: string,
  defaultValue: T
): [T, Dispatch<SetStateAction<T>>] {
  // Initialize state from localStorage or use default
  const [value, setValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : defaultValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  // Persist to localStorage whenever value changes
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing to localStorage key "${key}":`, error);
    }
  }, [key, value]);

  return [value, setValue];
}
