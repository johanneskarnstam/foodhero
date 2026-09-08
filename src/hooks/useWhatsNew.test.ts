import { renderHook, act } from '@testing-library/react';
import { useWhatsNew } from './useWhatsNew';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the commits json
vi.mock('../commits.json', () => ({
  default: [
    { hash: 'hash3', date: '2026-09-08 14:00', message: 'feat: new feature' },
    { hash: 'hash2', date: '2026-09-08 12:00', message: 'fix: a bug' },
    { hash: 'hash1', date: '2026-09-07 12:00', message: 'chore: initial' }
  ]
}));

const STORAGE_KEY = 'buymilk:whats-new-last-seen';

describe('useWhatsNew', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should mark as seen and not show modal on first visit', () => {
    const { result } = renderHook(() => useWhatsNew());
    
    expect(result.current.showModal).toBe(false);
    expect(result.current.newCommits).toEqual([]);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('hash3');
  });

  it('should show modal with unseen commits if returning visitor', () => {
    localStorage.setItem(STORAGE_KEY, 'hash1'); // User saw hash1 last time
    
    const { result } = renderHook(() => useWhatsNew());
    
    expect(result.current.showModal).toBe(true);
    expect(result.current.newCommits).toHaveLength(2); // hash3 and hash2
    expect(result.current.newCommits[0].hash).toBe('hash3');
    expect(result.current.newCommits[1].hash).toBe('hash2');
  });

  it('should not show modal if user has seen the latest commit', () => {
    localStorage.setItem(STORAGE_KEY, 'hash3'); // User saw latest commit
    
    const { result } = renderHook(() => useWhatsNew());
    
    expect(result.current.showModal).toBe(false);
    expect(result.current.newCommits).toEqual([]);
  });

  it('should update localStorage and close modal when dismissed', () => {
    localStorage.setItem(STORAGE_KEY, 'hash1');
    const { result } = renderHook(() => useWhatsNew());
    
    expect(result.current.showModal).toBe(true);
    
    act(() => {
      result.current.dismiss();
    });
    
    expect(result.current.showModal).toBe(false);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('hash3'); // Updated to the latest unseen commit
  });
});
