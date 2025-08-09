import { describe, expect, test } from 'vitest';
import type { CaptainCandidate } from '../types';
import { 
  calculateCaptainScore, 
  updateCaptainScores, 
  getTopCandidates, 
  benchmarkCalculation 
} from './captainScore';

// Test data representing various real-world scenarios
const testPlayers: CaptainCandidate[] = [
  {
    // Haaland in good form against weak team
    player_id: 1,
    name: "Erling Haaland",
    team: "Manchester City",
    position: "FWD",
    price: 14.5,
    ownership: 85.5,
    expected_ownership: 90.0,
    form_score: 8.5, // High form
    fixture_difficulty: 2, // Easy fixture
    minutes_risk: 10, // Very likely to start
    xgi_per_90: 1.8, // High xGI
    captain_score: 0 // Will be calculated
  },
  {
    // Salah against top 6 opponent
    player_id: 2,
    name: "Mohamed Salah",
    team: "Liverpool",
    position: "MID",
    price: 13.2,
    ownership: 65.3,
    expected_ownership: 68.0,
    form_score: 7.0, // Good form
    fixture_difficulty: 4, // Tough fixture
    minutes_risk: 5, // Almost certain to start
    xgi_per_90: 1.2, // Good xGI
    captain_score: 0
  },
  {
    // Rotation risk premium player
    player_id: 3,
    name: "Phil Foden",
    team: "Manchester City",
    position: "MID",
    price: 10.5,
    ownership: 25.0,
    expected_ownership: 22.0,
    form_score: 6.5,
    fixture_difficulty: 3, // Same as Salah to isolate rotation risk impact
    minutes_risk: 40, // Significant rotation risk
    xgi_per_90: 1.0,
      captain_score: 0
    },
    {
      // Out of form premium
      player_id: 4,
      name: "Harry Kane",
      team: "Bayern Munich",
      position: "FWD",
      price: 12.8,
      ownership: 45.0,
      expected_ownership: 40.0,
      form_score: 4.0, // Poor form
      fixture_difficulty: 3,
      minutes_risk: 0, // Nailed on
      xgi_per_90: 0.8,
      captain_score: 0
  }
];

describe('Captain Score Calculation', () => {
  test('should calculate higher scores for in-form players against weak teams', () => {
    const scores = updateCaptainScores(testPlayers);
    const haaland = scores.find((p: CaptainCandidate) => p.name === "Erling Haaland");
    const salah = scores.find((p: CaptainCandidate) => p.name === "Mohamed Salah");

    expect(haaland?.captain_score).toBeGreaterThan(80); // Should be a very high score
    expect(haaland?.captain_score).toBeGreaterThan(salah?.captain_score || 0); // Haaland should outscore Salah
  });

  test('should penalize rotation risks', () => {
    const scores = updateCaptainScores(testPlayers);
    const foden = scores.find((p: CaptainCandidate) => p.name === "Phil Foden");
    const salah = scores.find((p: CaptainCandidate) => p.name === "Mohamed Salah");

    expect(foden?.captain_score).toBeLessThan(salah?.captain_score || 0); // Rotation risk should hurt score
  });

  test('should calculate reasonable scores for all scenarios', () => {
    const scores = updateCaptainScores(testPlayers);
    
    scores.forEach((player: CaptainCandidate) => {
      expect(player.captain_score).toBeGreaterThanOrEqual(0);
      expect(player.captain_score).toBeLessThanOrEqual(100);
    });

    // Sort by score to verify relative rankings
    const sortedScores = scores.sort((a: CaptainCandidate, b: CaptainCandidate) => b.captain_score - a.captain_score);
    expect(sortedScores[0].name).toBe("Erling Haaland"); // Should be top captain
    expect(sortedScores[3].name).toBe("Harry Kane"); // Should be worst captain
  });
});

describe('Error Handling & Data Validation', () => {
  test('should handle missing player data gracefully', () => {
    const invalidPlayers = [
      null,
      undefined,
      {},
      { name: "Test Player" } // Missing required fields
    ] as any[];

    expect(() => updateCaptainScores(invalidPlayers)).not.toThrow();
    const result = updateCaptainScores(invalidPlayers);
    expect(Array.isArray(result)).toBe(true);
  });

  test('should provide default values for missing stats', () => {
    const playerWithMissingData: Partial<CaptainCandidate> = {
      player_id: 999,
      name: "Test Player",
      team: "Test FC",
      position: "MID",
      price: 8.0,
      ownership: 10.0,
      expected_ownership: 12.0,
      // Missing: form_score, fixture_difficulty, minutes_risk, xgi_per_90
    };

    const score = calculateCaptainScore({
      form: (playerWithMissingData as any).form_score,
      fixture_difficulty: (playerWithMissingData as any).fixture_difficulty,
      xgi_per_90: (playerWithMissingData as any).xgi_per_90,
      minutes_risk: (playerWithMissingData as any).minutes_risk
    });

    expect(typeof score).toBe('number');
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  test('should handle invalid numeric values', () => {
    const invalidStats = {
      form: NaN,
      fixture_difficulty: "invalid" as any,
      xgi_per_90: null as any,
      minutes_risk: undefined as any
    };

    expect(() => calculateCaptainScore(invalidStats)).not.toThrow();
    const score = calculateCaptainScore(invalidStats);
    expect(typeof score).toBe('number');
  });

  test('should handle empty candidate arrays', () => {
    expect(updateCaptainScores([])).toEqual([]);
    expect(getTopCandidates([])).toEqual([]);
    expect(getTopCandidates([], 5)).toEqual([]);
  });
});

describe('Performance Requirements', () => {
  test('should process 600+ players in under 100ms', () => {
    // Generate 650 test players
    const largeCandidateSet = Array.from({ length: 650 }, (_, i) => ({
      player_id: i + 1000,
      name: `Player ${i + 1000}`,
      team: `Team ${Math.floor(i / 30) + 1}`,
      position: ['GKP', 'DEF', 'MID', 'FWD'][i % 4],
      price: 4.0 + (Math.random() * 12),
      ownership: Math.random() * 100,
      expected_ownership: Math.random() * 100,
      form_score: Math.random() * 10,
      fixture_difficulty: Math.floor(Math.random() * 5) + 1,
      minutes_risk: Math.random() * 100,
      xgi_per_90: Math.random() * 2,
      captain_score: 0
    }));

    const benchmark = benchmarkCalculation(largeCandidateSet);
    
    expect(benchmark.candidatesProcessed).toBe(650);
    expect(benchmark.meetsPerformanceTarget).toBe(true);
    expect(benchmark.processingTime).toBeLessThan(100);
  });

  test('should maintain performance with optimize flag', () => {
    const candidates = Array.from({ length: 100 }, (_, i) => ({
      player_id: i,
      name: `Player ${i}`,
      team: "Test FC",
      position: "MID",
      price: 8.0,
      ownership: 50.0,
      expected_ownership: 50.0,
      form_score: 5.0,
      fixture_difficulty: 3,
      minutes_risk: 20,
      xgi_per_90: 0.8,
      captain_score: 0
    }));

    const startTime = performance.now();
    updateCaptainScores(candidates, { optimize: true });
    const endTime = performance.now();

    expect(endTime - startTime).toBeLessThan(50); // Should be very fast for 100 players
  });
});

describe('Top Candidates Selection', () => {
  test('should return top N candidates sorted by score', () => {
    const scoredPlayers = updateCaptainScores(testPlayers);
    const top2 = getTopCandidates(scoredPlayers, 2);
    
    expect(top2).toHaveLength(2);
    expect(top2[0].captain_score).toBeGreaterThanOrEqual(top2[1].captain_score);
  });

  test('should handle edge cases for top candidates', () => {
    expect(getTopCandidates([], 5)).toEqual([]);
    expect(getTopCandidates(testPlayers, 0)).toEqual([]);
    expect(getTopCandidates(testPlayers, -1)).toEqual([]);
    
    const singlePlayer = [testPlayers[0]];
    expect(getTopCandidates(singlePlayer, 5)).toHaveLength(1);
  });
});
