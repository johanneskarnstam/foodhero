import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { WhatsNewModal } from './WhatsNewModal';
import { Commit } from '../types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback: string) => fallback,
  }),
}));

const mockCommits: Commit[] = [
  { hash: '123', date: '2026-09-08 14:00', message: 'feat: added a shiny new feature', author: 'test' },
  { hash: '456', date: '2026-09-08 10:00', message: 'fix: resolved an annoying bug', author: 'test' },
  { hash: '789', date: '2026-09-07 10:00', message: 'feat(ui): nice layout update', author: 'test' },
  { hash: 'abc', date: '2026-09-07 09:00', message: 'fix(auth): login redirect issue', author: 'test' },
  { hash: 'def', date: '2026-09-06 12:00', message: 'refactor: clean up hook logic', author: 'test' },
  { hash: 'ghi', date: '2026-09-06 11:00', message: 'refactor(theme): optimize colors', author: 'test' },
  { hash: 'jkl', date: 'invalid-date', message: 'chore: miscellaneous update', author: 'test' },
];

describe('WhatsNewModal', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(<WhatsNewModal isOpen={false} commits={mockCommits} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders commits correctly when isOpen is true', () => {
    render(<WhatsNewModal isOpen={true} commits={mockCommits} onClose={vi.fn()} />);
    
    // Check that title is rendered
    expect(screen.getByText('Nyheter sedan ditt senaste besök')).toBeVisible();
    
    // Check that parsed messages are rendered
    expect(screen.getByText('Added a shiny new feature')).toBeVisible();
    expect(screen.getByText('Resolved an annoying bug')).toBeVisible();
    expect(screen.getByText('Nice layout update')).toBeVisible();
    expect(screen.getByText('Login redirect issue')).toBeVisible();
    expect(screen.getByText('Clean up hook logic')).toBeVisible();
    expect(screen.getByText('Optimize colors')).toBeVisible();
    expect(screen.getByText('Chore: miscellaneous update')).toBeVisible();
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

  it('calls onClose when clicking backdrop', () => {
    const onCloseMock = vi.fn();
    const { container } = render(<WhatsNewModal isOpen={true} commits={mockCommits} onClose={onCloseMock} />);
    
    // Backdrop is the outermost fixed div
    const backdrop = container.firstElementChild as HTMLElement;
    fireEvent.click(backdrop);
    
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when clicking inside the modal dialog', () => {
    const onCloseMock = vi.fn();
    render(<WhatsNewModal isOpen={true} commits={mockCommits} onClose={onCloseMock} />);
    
    const dialog = screen.getByRole('dialog');
    fireEvent.click(dialog);
    
    expect(onCloseMock).not.toHaveBeenCalled();
  });
});
