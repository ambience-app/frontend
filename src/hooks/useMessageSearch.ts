import { useState, useMemo, useCallback, useEffect } from 'react';
import { Message } from '@/types/message';
import { Address } from '@/types';

interface SearchOptions {
  query: string;
  sender?: Address;
  roomId?: string;
  fromDate?: Date;
  toDate?: Date;
  caseSensitive?: boolean;
  matchWholeWord?: boolean;
}

interface SearchResult {
  messages: Message[];
  total: number;
  pageInfo: {
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

const DEFAULT_PAGE_SIZE = 20;

/**
 * useMessageSearch hook
 *
 * A hook for searching and filtering messages with pagination support.
 * It allows searching messages based on various criteria, and paginating the results.
 *
 * @returns {Object} An object with functions to search messages, paginate results, and get search results.
 * @property {function} searchMessages - A function to search messages.
 * @property {function} paginateResults - A function to paginate the results.
 * @property {function} getSearchResults - A function to get the search results.
 * 
 * @param {Message[]} messages - Array of messages to search through
 * @param {SearchOptions} options - Search configuration
 * @param {number} pageSize - Number of messages per page (default: 20)
 * @returns {SearchResult} Search results and pagination controls
 */

const useMessageSearch = (
  messages: Message[],
  options: SearchOptions,
  pageSize: number = DEFAULT_PAGE_SIZE
) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<Error | null>(null);

  // Reset to first page when search options change
  useEffect(() => {
    setCurrentPage(1);
  }, [options.query, options.sender, options.roomId, options.fromDate, options.toDate]);

  // Memoize the search results to avoid recalculating on every render
  const searchResults = useMemo<SearchResult>(() => {
    if (!options.query && !options.sender && !options.roomId && !options.fromDate && !options.toDate) {
      // If no search criteria, return all messages with pagination
      const totalPages = Math.ceil(messages.length / pageSize);
      const startIndex = (currentPage - 1) * pageSize;
      const paginatedMessages = messages.slice(startIndex, startIndex + pageSize);
      
      return {
        messages: paginatedMessages,
        total: messages.length,
        pageInfo: {
          currentPage,
          totalPages,
          hasNextPage: currentPage < totalPages,
          hasPreviousPage: currentPage > 1,
        },
      };
    }

    try {
      setIsSearching(true);
      
      // Create a case-insensitive regex if needed
      const queryRegex = options.query
        ? new RegExp(
            options.matchWholeWord 
              ? `\\b${options.query}\\b` 
              : options.query,
            options.caseSensitive ? '' : 'i'
          )
        : null;

      // Filter messages based on search criteria
      const filtered = messages.filter((message) => {
        // Filter by sender
        if (options.sender) {
          const senderAddress = typeof message.sender === 'string' 
            ? message.sender 
            : (message.sender as any).address || '';
          
          if (senderAddress.toLowerCase() !== options.sender?.toLowerCase()) {
            return false;
          }
        }

        // Filter by room
        if (options.roomId && message.roomId !== options.roomId) {
          return false;
        }

        // Filter by date range
        const messageDate = new Date(message.timestamp);
        if (options.fromDate && messageDate < options.fromDate) {
          return false;
        }
        if (options.toDate && messageDate > options.toDate) {
          return false;
        }

        // Filter by search query
        if (queryRegex && !queryRegex.test(message.content)) {
          return false;
        }

        return true;
      });

      // Apply pagination
      const total = filtered.length;
      const totalPages = Math.ceil(total / pageSize);
      const startIndex = (currentPage - 1) * pageSize;
      const paginatedMessages = filtered.slice(startIndex, startIndex + pageSize);

      return {
        messages: paginatedMessages,
        total,
        pageInfo: {
          currentPage,
          totalPages,
          hasNextPage: currentPage < totalPages,
          hasPreviousPage: currentPage > 1,
        },
      };
    } catch (error) {
      console.error('Error searching messages:', error);
      setSearchError(error instanceof Error ? error : new Error('Search failed'));
      return {
        messages: [],
        total: 0,
        pageInfo: {
          currentPage: 1,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
    } finally {
      setIsSearching(false);
    }
  }, [
    messages, 
    options.query, 
    options.sender, 
    options.roomId, 
    options.fromDate, 
    options.toDate,
    options.caseSensitive,
    options.matchWholeWord,
    currentPage,
    pageSize,
  ]);

  // Navigation functions
  const goToNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, searchResults.pageInfo.totalPages));
  }, [searchResults.pageInfo.totalPages]);

  const goToPreviousPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }, []);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, searchResults.pageInfo.totalPages)));
  }, [searchResults.pageInfo.totalPages]);

  return {
    // Search results
    ...searchResults,
    
    // Loading and error states
    isSearching,
    error: searchError,
    
    // Pagination controls
    nextPage: goToNextPage,
    previousPage: goToPreviousPage,
    goToPage,
    setPageSize: (newSize: number) => {
      setCurrentPage(1);
      // Note: The pageSize is currently a parameter, not state.
      // You might want to lift this to the parent component or use state if needed.
    },
    
    // Current search options
    searchOptions: options,
  };
};

export default useMessageSearch;
