// Centralized data source configuration and URL builders for CSV assets
// Mode: 'local' serves from the app's public/ folder; 'remote' fetches from GitHub raw

import { getCsvPath, type DataType } from '../utils/csvPathConfig';

export type DataSourceMode = 'local' | 'remote';

// Defaults can be overridden via Vite env (VITE_*)
const DEFAULT_SEASON = (import.meta as any).env?.VITE_DATA_SEASON ?? '2025-2026';
const DEFAULT_MODE = ((import.meta as any).env?.VITE_DATA_SOURCE_MODE as DataSourceMode) ?? 'local';
const DEFAULT_REPO_OWNER = (import.meta as any).env?.VITE_DATA_REPO_OWNER ?? 'darutto';
const DEFAULT_REPO_NAME = (import.meta as any).env?.VITE_DATA_REPO_NAME ?? 'FPL-Elo-Insights';
// Use the currently active branch by default for raw fetches; overrideable
const DEFAULT_BRANCH = (import.meta as any).env?.VITE_DATA_BRANCH ?? 'stable-captaincy-aug20';

export interface DataConfig {
  mode: DataSourceMode;
  season: string;
  repoOwner: string;
  repoName: string;
  branch: string;
}

export const dataConfig: DataConfig = {
  mode: (typeof window !== 'undefined' && (import.meta as any).env?.VITE_FORCE_REMOTE === 'true') ? 'remote' : DEFAULT_MODE,
  season: DEFAULT_SEASON,
  repoOwner: DEFAULT_REPO_OWNER,
  repoName: DEFAULT_REPO_NAME,
  branch: DEFAULT_BRANCH,
};

export function setDataMode(mode: DataSourceMode) {
  dataConfig.mode = mode;
}

export function setSeason(season: string) {
  dataConfig.season = season;
}

export function getRemoteBaseUrl(cfg: DataConfig = dataConfig): string {
  // e.g., https://raw.githubusercontent.com/darutto/FPL-Elo-Insights/stable-captaincy-aug20
  return `https://raw.githubusercontent.com/${cfg.repoOwner}/${cfg.repoName}/${cfg.branch}`;
}

export function buildDataUrl(path: string, cfg: DataConfig = dataConfig): string {
  // Ensure leading slash for local serving
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (cfg.mode === 'local') {
    // Vite will serve from public/ at root, so keep as-is
    return normalized;
  }
  // Remote: join with raw GitHub base and URL-encode the path
  const encodedPath = encodeURI(normalized);
  return `${getRemoteBaseUrl(cfg)}${encodedPath}`;
}

export interface CsvUrlOptions {
  dataType: DataType;
  season?: string;
  gameweek?: number;
  tournament?: string;
}

// Primary helper: build a fully-qualified URL (remote) or app-served path (local)
export function getCsvUrl(opts: CsvUrlOptions, cfg: DataConfig = dataConfig): string {
  const season = opts.season ?? cfg.season;
  const path = getCsvPath({
    dataType: opts.dataType,
    season,
    gameweek: opts.gameweek,
    tournament: opts.tournament,
  });
  return buildDataUrl(path, cfg);
}

// Convenience shorthands
export const isRemote = () => dataConfig.mode === 'remote';
export const isLocal = () => dataConfig.mode === 'local';

// Example: getCsvUrl({ dataType: 'players' }) →
//  - local:  "/data/2025-2026/players.csv"
//  - remote: "https://raw.githubusercontent.com/darutto/FPL-Elo-Insights/stable-captaincy-aug20/data/2025-2026/players.csv"
