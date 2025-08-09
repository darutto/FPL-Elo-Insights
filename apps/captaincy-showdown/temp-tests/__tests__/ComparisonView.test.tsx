import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ComparisonView } from '../ComparisonView';
import type { CaptainCandidate } from '../../types';

// Mock player data for testing
const mockPlayerA: CaptainCandidate = {
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

const mockPlayerB: CaptainCandidate = {
  player_id: 2,
  name: "Mohamed Salah",
  team: "Liverpool",
  position: "MID",
  price: 13.2,
  ownership: 65.3,
  expected_ownership: 68.0,
  form_score: 7.0,
  fixture_difficulty: 4,
  minutes_risk: 5,
  xgi_per_90: 1.2,
  captain_score: 73.8
};

describe('ComparisonView Component', () => {
  test('should display both players when provided', () => {
    render(
      <ComparisonView 
        candidateA={mockPlayerA} 
        candidateB={mockPlayerB} 
      />
    );
    
    expect(screen.getAllByText('Erling Haaland')).toHaveLength(2); // In card and comparison
    expect(screen.getByText('Mohamed Salah')).toBeInTheDocument();
    expect(screen.getByText('VS')).toBeInTheDocument();
  });

  test('should show empty slots when no players provided', () => {
    render(<ComparisonView candidateA={null} candidateB={null} />);
    
    expect(screen.getByText('Select Player A')).toBeInTheDocument();
    expect(screen.getByText('Select Player B')).toBeInTheDocument();
    expect(screen.getByText('VS')).toBeInTheDocument();
  });

  test('should show comparison summary when both players are selected', () => {
    render(
      <ComparisonView 
        candidateA={mockPlayerA} 
        candidateB={mockPlayerB} 
      />
    );
    
    expect(screen.getByText('Quick Comparison')).toBeInTheDocument();
    expect(screen.getByText('Better Score')).toBeInTheDocument();
    expect(screen.getByText('Price Diff')).toBeInTheDocument();
    expect(screen.getByText('Ownership Diff')).toBeInTheDocument();
    
    // Haaland should be better (check in the comparison summary)
    expect(screen.getAllByText('Erling Haaland')).toHaveLength(2); // One in card, one in summary
  });

  test('should handle player selection callbacks', () => {
    const handleSelectA = vi.fn();
    const handleSelectB = vi.fn();
    
    render(
      <ComparisonView 
        candidateA={mockPlayerA} 
        candidateB={mockPlayerB}
        onSelectPlayerA={handleSelectA}
        onSelectPlayerB={handleSelectB}
      />
    );
    
    // Find player cards by their button role
    const playerCards = screen.getAllByRole('button');
    
    // Click on first player card (Player A)
    fireEvent.click(playerCards[0]);
    expect(handleSelectA).toHaveBeenCalledWith(mockPlayerA);
    
    // Click on second player card (Player B)
    fireEvent.click(playerCards[1]);
    expect(handleSelectB).toHaveBeenCalledWith(mockPlayerB);
  });

  test('should apply different layout modes correctly', () => {
    const { container: horizontalContainer } = render(
      <ComparisonView 
        candidateA={mockPlayerA} 
        candidateB={mockPlayerB}
        layout="horizontal"
      />
    );
    
    expect(horizontalContainer.querySelector('.lg\\:flex-row')).toBeInTheDocument();
    
    const { container: verticalContainer, unmount } = render(
      <ComparisonView 
        candidateA={mockPlayerA} 
        candidateB={mockPlayerB}
        layout="vertical"
      />
    );
    
    expect(verticalContainer.querySelector('.flex-col')).toBeInTheDocument();
    
    unmount();
  });

  test('should apply different sizes correctly', () => {
    const sizes = ['small', 'medium', 'large'] as const;
    
    sizes.forEach(size => {
      const { unmount } = render(
        <ComparisonView 
          candidateA={mockPlayerA} 
          candidateB={mockPlayerB}
          size={size}
        />
      );
      
      // Component should render without errors
      expect(screen.getAllByText('Erling Haaland')).toHaveLength(2);
      
      unmount();
    });
  });

  test('should handle mixed selection states', () => {
    // Only Player A selected
    const { rerender } = render(
      <ComparisonView candidateA={mockPlayerA} candidateB={null} />
    );
    
    expect(screen.getAllByText('Erling Haaland')).toHaveLength(1); // Only in Player A card
    expect(screen.getByText('Select Player B')).toBeInTheDocument();
    expect(screen.queryByText('Quick Comparison')).not.toBeInTheDocument();
    
    // Only Player B selected
    rerender(
      <ComparisonView candidateA={null} candidateB={mockPlayerB} />
    );
    
    expect(screen.getByText('Select Player A')).toBeInTheDocument();
    expect(screen.getByText('Mohamed Salah')).toBeInTheDocument();
    expect(screen.queryByText('Quick Comparison')).not.toBeInTheDocument();
  });

  test('should calculate price and ownership differences correctly', () => {
    render(
      <ComparisonView 
        candidateA={mockPlayerA} 
        candidateB={mockPlayerB} 
      />
    );
    
    // Price difference: |14.5 - 13.2| = 1.3
    expect(screen.getByText('£1.3m')).toBeInTheDocument();
    
    // Ownership difference: |85.5 - 65.3| = 20.2
    expect(screen.getByText('20.2%')).toBeInTheDocument();
  });

  test('should have proper accessibility attributes', () => {
    render(
      <ComparisonView 
        candidateA={mockPlayerA} 
        candidateB={mockPlayerB} 
      />
    );
    
    const comparisonRegion = screen.getByRole('region');
    expect(comparisonRegion).toHaveAttribute('aria-label', 'Captain candidate comparison');
  });

  test('should handle tie in captain scores', () => {
    const tiedPlayer = { ...mockPlayerB, captain_score: 87.3 }; // Same as Player A
    
    render(
      <ComparisonView 
        candidateA={mockPlayerA} 
        candidateB={tiedPlayer} 
      />
    );
    
    expect(screen.getByText('Tie')).toBeInTheDocument();
  });
});
