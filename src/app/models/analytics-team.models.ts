export interface AnalyticsTeam {
  TEAM_ID: number | string | null;
  TEAM_NAME: string | null;
  GP: number | null;
  W: number | null;
  L: number | null;
  W_PCT: number | null;
  MIN: number | null;
  FGM: number | null;
  FGA: number | null;
  FG_PCT: number | null;
  FG3M: number | null;
  FG3A: number | null;
  FG3_PCT: number | null;
  FTM: number | null;
  FTA: number | null;
  FT_PCT: number | null;
  OREB: number | null;
  DREB: number | null;
  REB: number | null;
  AST: number | null;
  TOV: number | null;
  STL: number | null;
  BLK: number | null;
  BLKA: number | null;
  PF: number | null;
  PFD: number | null;
  PTS: number | null;
  PLUS_MINUS: number | null;
}

export interface AnalyticsTeamsResponse {
  dataState: 'DATA' | 'NO_DATA' | 'API_ERROR';
  source: 'live' | 'fixture';
  season: string;
  resultSet: string;
  rows: AnalyticsTeam[];
  error?: string;
}