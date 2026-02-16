'use client';
///Ce fichier n est presentement est utile. Il servira a implementer des filtres par categories dans le futur.
import { useRouter, useSearchParams } from 'next/navigation';

const FILTERS = [
  { label: 'Tout', value: 'all' },
  { label: '🔥 Populaire', value: 'popular' },
  { label: '💻 Ingénierie', value: 'engineering' },
  { label: '🏥 Médecine', value: 'medicine' },
  { label: '💰 Bourse Complète', value: 'scholarship' },
  { label: '🏙️ Grandes Villes', value: 'big_city' },
];

export function CategoryFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentFilter = searchParams.get('category') || 'all';

  const handleFilterClick = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') {
      params.delete('category');
    } else {
      params.set('category', value);
    }
    router.push(`/?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex overflow-x-auto gap-3 pb-8 md:justify-center no-scrollbar items-center">
      {FILTERS.map((filter) => {
        const isActive = currentFilter === filter.value || (filter.value === 'all' && !currentFilter);
        
        return (
          <button
            key={filter.value}
            onClick={() => handleFilterClick(filter.value)}
            className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm border ${
              isActive
                ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20 scale-105'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:shadow-md'
            }`}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
