import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { WhatsNewModal } from './WhatsNewModal';
import { Commit } from '../types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback: string) => fallback,
  }),
}));

const mockCommits: Commit[] = [
  { hash: '123', date: '2026-09-08 14:00', message: 'feat: added a shiny new feature', author: 'test' },
  { hash: '456', date: '2026-09-08 10:00', message: 'fix: resolved an annoying bug', author: 'test' }
];

describe('WhatsNewModal', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(<WhatsNewModal isOpen={false} commits={mockCommits} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders commits correctly when isOpen is true', () => {
    render(<WhatsNewModal isOpen={true} commits={mockCommits} onClose={vi.fn()} />);
    
    // Check that title is rendered
    expect(screen.getByText('Nyheter')).toBeVisible();
    
    // Check that parsed messages are rendered
    expect(screen.getByText('Added a shiny new feature')).toBeVisible();
    expect(screen.getByText('Resolved an annoying bug')).toBeVisible();
  });

  it('calls onClose when clicking close button', () => {
    const onCloseMock = vi.fn();
    render(<WhatsNewModal isOpen={true} commits={mockCommits} onClose={onCloseMock} />);
    
    const closeButtons = screen.getAllByRole('button', { name: /stäng/i });
    fireEvent.click(closeButtons[0]);
    
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when pressing Escape', () => {
    const onCloseMock = vi.fn();
    render(<WhatsNewModal isOpen={true} commits={mockCommits} onClose={onCloseMock} />);
    
    fireEvent.keyDown(document, { key: 'Escape' });
    
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
});
