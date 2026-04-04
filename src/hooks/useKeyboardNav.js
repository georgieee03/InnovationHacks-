import { useCallback, useRef } from 'react';

function getFocusableItems(itemRefs) {
  return itemRefs.current.filter((item) => item && !item.disabled);
}

export default function useKeyboardNav({ isEnabled = true, onEscape } = {}) {
  const itemRefs = useRef([]);

  const setItemRef = useCallback((index) => (node) => {
    itemRefs.current[index] = node ?? null;
  }, []);

  const focusItem = useCallback((index) => {
    const focusableItems = getFocusableItems(itemRefs);
    if (!focusableItems.length) return;

    const safeIndex = ((index % focusableItems.length) + focusableItems.length) % focusableItems.length;
    focusableItems[safeIndex].focus();
  }, []);

  const focusFirst = useCallback(() => {
    focusItem(0);
  }, [focusItem]);

  const handleKeyDown = useCallback((event) => {
    if (!isEnabled) return;

    if (event.key === 'Escape') {
      onEscape?.();
      return;
    }

    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;

    const focusableItems = getFocusableItems(itemRefs);
    if (!focusableItems.length) return;

    const currentIndex = focusableItems.findIndex((item) => item === document.activeElement);

    event.preventDefault();

    if (event.key === 'Home') {
      focusableItems[0].focus();
      return;
    }

    if (event.key === 'End') {
      focusableItems[focusableItems.length - 1].focus();
      return;
    }

    if (currentIndex === -1) {
      focusableItems[0].focus();
      return;
    }

    const direction = event.key === 'ArrowDown' ? 1 : -1;
    focusItem(currentIndex + direction);
  }, [focusItem, isEnabled, onEscape]);

  return {
    setItemRef,
    focusFirst,
    handleKeyDown,
  };
}
