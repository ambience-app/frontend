"use client";

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, Funnel } from 'lucide-react';
import { useState } from 'react';

type RoomFilter = {
  query: string;
  isPrivate: boolean | null;
  minMembers: number | null;
};



/**
 * RoomSearch component
 *
 * A comprehensive search and filtering interface for rooms with real-time filtering,
 * advanced search options, and filter state management.
 *
 * Features:
 * - Text-based room search with query filtering
 * - Advanced filters for room type (public/private)
 * - Minimum member count filtering
 * - Collapsible filter panel for better UX
 * - Clear filters functionality
 * - Real-time search updates
 * - Visual filter state indicators
 *
 * @component
 * @param {RoomSearchProps} props - Component props
 * @param {(filters: RoomFilter) => void} props.onSearch - Callback called when search filters change
 * @param {string} [props.className] - Additional CSS classes to apply
 *
 * @example
 * ```tsx
 * // Basic usage
 * <RoomSearch onSearch={(filters) => setSearchFilters(filters)} />
 *
 * // With custom styling
 * <RoomSearch 
 *   onSearch={handleSearch}
 *   className="bg-white p-4 rounded-lg shadow"
 * />
 *
 * // With controlled filters
 * <RoomSearch onSearch={handleSearch} />
 * ```
 *
 * @example
 * ```tsx
 * // Filter structure example
 * const filters = {
 *   query: 'blockchain',
 *   isPrivate: false, // or null for all rooms
 *   minMembers: 10    // or null for no minimum
 * };
 * ```
 */
interface RoomSearchProps {
  onSearch: (filters: RoomFilter) => void;
  className?: string;
}

export function RoomSearch({ onSearch, className = '' }: RoomSearchProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<RoomFilter>({
    query: '',
    isPrivate: null,
    minMembers: null,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(filters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      query: '',
      isPrivate: null,
      minMembers: null,
    };
    setFilters(clearedFilters);
    onSearch(clearedFilters);
  };

  const hasActiveFilters = filters.query || filters.isPrivate !== null || filters.minMembers !== null;

  return (
    <div className={`space-y-4 ${className}`}>
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search rooms..."
            className="pl-10"
            value={filters.query}
            onChange={(e) => setFilters({ ...filters, query: e.target.value })}
          />
        </div>
        <Button type="submit" variant="outline">
          Search
        </Button>
        <Button
          type="button"
          variant={showFilters ? 'default' : 'outline'}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Funnel className="h-4 w-4 mr-2" />
          Filters
        </Button>
        {hasActiveFilters && (
          <Button type="button" variant="ghost" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </form>

      {showFilters && (
        <div className="bg-muted/50 p-4 rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Room Type</label>
              <div className="space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio"
                    checked={filters.isPrivate === null}
                    onChange={() => setFilters({ ...filters, isPrivate: null })}
                  />
                  <span className="ml-2">All</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio"
                    checked={filters.isPrivate === false}
                    onChange={() => setFilters({ ...filters, isPrivate: false })}
                  />
                  <span className="ml-2">Public</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio"
                    checked={filters.isPrivate === true}
                    onChange={() => setFilters({ ...filters, isPrivate: true })}
                  />
                  <span className="ml-2">Private</span>
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="minMembers" className="block text-sm font-medium mb-1">
                Min Members
              </label>
              <Input
                id="minMembers"
                type="number"
                min="0"
                placeholder="Any"
                value={filters.minMembers || ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    minMembers: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
