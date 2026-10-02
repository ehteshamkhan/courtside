/*
 * COURTSIDE — MILESTONE 6
 * NBA leagueleaders data contract
 *
 * Source of truth:
 * NBA Stats leagueleaders endpoint verified during
 * the Milestone 6 read-only audit.
 *
 * Do not add fields here unless they are actually
 * returned by a verified NBA endpoint.
 */

export interface NbaLeagueLeaderRow {
  PLAYER_ID: number | string;
  PLAYER_NAME: string;

  TEAM_ID?: number | string;
  TEAM_ABBREVIATION?: string;
  TEAM_NAME?: string;

  GP?: number;
  MIN?: number;

  PTS?: number;
  FGM?: number;
  FGA?: number;
  FG_PCT?: number;

  FG3M?: number;
  FG3A?: number;
  FG3_PCT?: number;

  FTM?: number;
  FTA?: number;
  FT_PCT?: number;

  OREB?: number;
  DREB?: number;
  REB?: number;

  AST?: number;
  TOV?: number;
  STL?: number;
  BLK?: number;
  PF?: number;

  PLUS_MINUS?: number;

  [key: string]: unknown;
}

export interface NbaLeadersResponse {
  ok?: boolean;
  season?: string;
  seasonType?: string;
  perMode?: string;
  statCategory?: string;

  leaders?: NbaLeagueLeaderRow[];

  dataStatus?: string;
  cached?: boolean;
  cachedAt?: string;

  [key: string]: unknown;
}

export type StatsSortKey =
  | 'PLAYER_NAME'
  | 'TEAM_ABBREVIATION'
  | 'GP'
  | 'MIN'
  | 'PTS'
  | 'FG_PCT'
  | 'FG3_PCT'
  | 'FT_PCT'
  | 'REB'
  | 'AST'
  | 'STL'
  | 'BLK'
  | 'TOV'
  | 'PLUS_MINUS';

export type StatsSortDirection =
  | 'asc'
  | 'desc';

export type StatsSeasonType =
  | 'Regular Season'
  | 'Pre Season'
  | 'Playoffs';

export type StatsPerMode =
  | 'PerGame'
  | 'Totals';

export type StatsCategory =
  | 'PTS'
  | 'REB'
  | 'AST'
  | 'STL'
  | 'BLK'
  | 'FG_PCT'
  | 'FG3_PCT'
  | 'FT_PCT';

export interface StatsFilters {
  search: string;
  team: string;
  position: string;
  conference: string;
  season: string;
  seasonType: StatsSeasonType;
  perMode: StatsPerMode;
  statCategory: StatsCategory;
}

export interface PlayerComparison {
  left: NbaLeagueLeaderRow | null;
  right: NbaLeagueLeaderRow | null;
}
