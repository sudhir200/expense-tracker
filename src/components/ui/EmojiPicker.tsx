'use client';

import React, { useState, useRef, useEffect } from 'react';
import emojis from 'emojis-list';

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
  placeholder?: string;
}

// Common category emojis for quick access
const COMMON_CATEGORY_EMOJIS = [
  '🍕', '🛒', '🚗', '🎬', '🏠', '💡', '🏥', '📚', '👕', '🎮',
  '💰', '📱', '✈️', '🍽️', '☕', '🎵', '🏋️', '🎨', '🔧', '📦',
  '🛍️', '🚌', '⛽', '🍔', '🍺', '🎪', '🏖️', '🎯', '🎲', '🎸'
];

export default function EmojiPicker({ value, onChange, placeholder = '📦' }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('common');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter emojis based on search term
  const getFilteredEmojis = () => {
    if (selectedCategory === 'common') {
      return searchTerm 
        ? COMMON_CATEGORY_EMOJIS.filter(emoji => 
            emoji.includes(searchTerm) || 
            getEmojiName(emoji).toLowerCase().includes(searchTerm.toLowerCase())
          )
        : COMMON_CATEGORY_EMOJIS;
    }

    // For all emojis, limit to first 100 for performance
    const emojiList = searchTerm 
      ? emojis.filter((emoji: string) => 
          emoji.includes(searchTerm) || 
          getEmojiName(emoji).toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 100)
      : emojis.slice(0, 100);

    return emojiList;
  };

  // Get emoji name/description (simplified)
  const getEmojiName = (emoji: string) => {
    const emojiNames: { [key: string]: string } = {
      '🍕': 'pizza food',
      '🛒': 'shopping cart groceries',
      '🚗': 'car transport vehicle',
      '🎬': 'movie entertainment cinema',
      '🏠': 'house home utilities',
      '💡': 'light bulb electricity bills',
      '🏥': 'hospital healthcare medical',
      '📚': 'books education learning',
      '👕': 'clothing fashion shopping',
      '🎮': 'gaming entertainment',
      '💰': 'money finance',
      '📱': 'phone mobile technology',
      '✈️': 'airplane travel',
      '🍽️': 'dining restaurant food',
      '☕': 'coffee drinks',
      '🎵': 'music entertainment',
      '🏋️': 'gym fitness health',
      '🎨': 'art creative',
      '🔧': 'tools maintenance',
      '📦': 'package delivery shopping'
    };
    return emojiNames[emoji] || emoji;
  };

  const handleEmojiSelect = (emoji: string) => {
    onChange(emoji);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Only allow emojis or empty string
    if (inputValue === '' || /^[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(inputValue)) {
      onChange(inputValue || placeholder);
    }
  };

  const filteredEmojis = getFilteredEmojis();

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="w-16 h-10 text-center text-lg border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 cursor-pointer"
          maxLength={2}
          onClick={() => setIsOpen(!isOpen)}
          readOnly
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Pick Emoji
        </button>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-80 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => setSelectedCategory('common')}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  selectedCategory === 'common'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Common
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                All Emojis
              </button>
            </div>
            <input
              type="text"
              placeholder="Search emojis..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Emoji Grid */}
          <div className="p-2 max-h-64 overflow-y-auto">
            {filteredEmojis.length > 0 ? (
              <div className="grid grid-cols-8 gap-1">
                {filteredEmojis.map((emoji: string, index: number) => (
                  <button
                    key={`${emoji}-${index}`}
                    type="button"
                    onClick={() => handleEmojiSelect(emoji)}
                    className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    title={getEmojiName(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                No emojis found
              </div>
            )}
          </div>

          {selectedCategory === 'all' && (
            <div className="p-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
              Showing first 100 emojis. Use search to find specific emojis.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
