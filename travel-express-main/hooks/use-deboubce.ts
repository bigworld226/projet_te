import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // On définit un timer qui mettra à jour la valeur après le délai
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Si la valeur change avant la fin du délai (l'utilisateur tape encore), 
    // on annule le timer précédent et on en recommence un nouveau
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}