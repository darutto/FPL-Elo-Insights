import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlayerCard } from '../PlayerCard';
import type { CaptainCandidate } from '../../types';

// Mock player data for testing
const mockPlayer: CaptainCandidate = {
  player_id: 1,
  name: "Erling Haaland",
  team: "Manchester City",
  position: "FWD",
  price: 14.5,
  ownership: 85.5,
  expected_ownership: 90.0,
  form_score: 8.5,
  fixture_difficulty: 2,
  minutes_risk: 10,
  xgi_per_90: 1.8,
  captain_score: 87.3
};

describe('PlayerCard Component', () => {
  test('should display all required player data fields', () => {
    render(<PlayerCard player={mockPlayer} />);
    
    // Check if all key data is displayed
    expect(screen.getByText(mockPlayer.name)).toBeInTheDocument();
    expect(screen.getByText(mockPlayer.team)).toBeInTheDocument();
    expect(screen.getByText(mockPlayer.position)).toBeInTheDocument();
    expect(screen.getByText('£14.5m')).toBeInTheDocument();
    expect(screen.getByText('85.5%')).toBeInTheDocument();
    expect(screen.getByText('87.3')).toBeInTheDocument(); // Captain score
    expect(screen.getByText('8.5')).toBeInTheDocument(); // Form score
    expect(screen.getByText('1.8')).toBeInTheDocument(); // xGI
    expect(screen.getByText('10%')).toBeInTheDocument(); // Minutes risk
  });

  test('should handle click events correctly', () => {
    const handleClick = vi.fn();
    render(<PlayerCard player={mockPlayer} onClick={handleClick} />);
    
    const card = screen.getByRole('button');
    fireEvent.click(card);
    
    expect(handleClick).toHaveBeenCalledWith(mockPlayer);
  });

  test('should handle keyboard navigation', () => {
    const handleClick = vi.fn();
    render(<PlayerCard player={mockPlayer} onClick={handleClick} />);
    
    const card = screen.getByRole('button');
    
    // Test Enter key
    fireEvent.keyDown(card, { key: 'Enter' });
    expect(handleClick).toHaveBeenCalledWith(mockPlayer);
    
    // Test Space key
    fireEvent.keyDown(card, { key: ' ' });
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  test('should apply correct position colors', () => {
    const positions = ['GKP', 'DEF', 'MID', 'FWD'] as const;
    const expectedColors = [
      'bg-yellow-100 text-yellow-800',
      'bg-green-100 text-green-800',
      'bg-blue-100 text-blue-800',
      'bg-red-100 text-red-800'
    ];

    positions.forEach((position, index) => {
      const testPlayer = { ...mockPlayer, position };
      const { container, unmount } = render(<PlayerCard player={testPlayer} />);
      
      const positionBadge = container.querySelector(`[class*="${expectedColors[index].split(' ')[0]}"]`);
      expect(positionBadge).toBeInTheDocument();
      
      unmount();
    });
  });

  test('should show correct captain score colors based on score ranges', () => {
    const testCases = [
      { score: 90, expectedClass: 'text-green-600 bg-green-50' },
      { score: 70, expectedClass: 'text-yellow-600 bg-yellow-50' },
      { score: 55, expectedClass: 'text-orange-600 bg-orange-50' },
      { score: 30, expectedClass: 'text-red-600 bg-red-50' }
    ];

    testCases.forEach(({ score, expectedClass }) => {
      const testPlayer = { ...mockPlayer, captain_score: score };
      const { container, unmount } = render(<PlayerCard player={testPlayer} />);
      
      const scoreElement = container.querySelector(`[class*="${expectedClass.split(' ')[0]}"]`);
      expect(scoreElement).toBeInTheDocument();
      
      unmount();
    });
  });

  test('should apply different sizes correctly', () => {
    const sizes = ['small', 'medium', 'large'] as const;
    const expectedPadding = ['p-3', 'p-4', 'p-6'];

    sizes.forEach((size, index) => {
      const { container, unmount } = render(<PlayerCard player={mockPlayer} size={size} />);
      
      const card = container.querySelector(`[class*="${expectedPadding[index]}"]`);
      expect(card).toBeInTheDocument();
      
      unmount();
    });
  });

  test('should show selected state correctly', () => {
    render(<PlayerCard player={mockPlayer} isSelected={true} />);
    
    expect(screen.getByText('Selected')).toBeInTheDocument();
    const card = screen.getByRole('button');
    expect(card).toHaveClass('border-blue-500');
  });

  test('should display fixture difficulty indicators', () => {
    const { container } = render(<PlayerCard player={mockPlayer} />);
    
    // Should have 5 difficulty indicators (dots)
    const difficultyDots = container.querySelectorAll('[class*="w-2 h-2 rounded-full"]');
    expect(difficultyDots).toHaveLength(5);
    
    // First 2 should be filled (difficulty = 2), rest should be empty
    const filledDots = container.querySelectorAll('[class*="bg-red-400"]');
    const emptyDots = container.querySelectorAll('[class*="bg-gray-200"]');
    expect(filledDots).toHaveLength(2);
    expect(emptyDots).toHaveLength(3);
  });

  test('should have proper accessibility attributes', () => {
    render(<PlayerCard player={mockPlayer} />);
    
    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('aria-label', 'Select Erling Haaland as captain candidate');
    expect(card).toHaveAttribute('tabIndex', '0');
    expect(card).toHaveAttribute('aria-pressed', 'false');
  });

  test('should apply side transformation for right side', () => {
    const { container } = render(<PlayerCard player={mockPlayer} side="right" />);
    
    const card = container.firstChild;
    expect(card).toHaveClass('transform', 'scale-x-[-1]');
  });
});
