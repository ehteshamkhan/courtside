export interface ScoreboardPeriod {
  period: number;
  periodType: string;
  score: number;
}

export interface ScoreboardTeam {
  teamId: number;
  teamName: string;
  teamCity: string;
  teamTricode: string;
  teamSlug: string;
  wins: number;
  losses: number;
  score: number;
  seed: number;
  inBonus: boolean | null;
  timeoutsRemaining: number;
  periods: ScoreboardPeriod[];
}

export interface ScoreboardLeader {
  personId: number;
  name: string;
  playerSlug: string;
  jerseyNum: string;
  position: string;
  teamTricode: string;
  points: number;
  rebounds: number;
  assists: number;
}

export interface ScoreboardLeaders {
  homeLeaders: ScoreboardLeader;
  awayLeaders: ScoreboardLeader;
  seasonLeadersFlag?: number;
}

export interface ScoreboardBroadcaster {
  broadcasterId: number;
  broadcastDisplay: string;
  broadcasterTeamId: number;
  broadcasterDescription: string;
}

export interface ScoreboardBroadcasters {
  nationalBroadcasters: ScoreboardBroadcaster[];
  nationalRadioBroadcasters: ScoreboardBroadcaster[];
  nationalOttBroadcasters: ScoreboardBroadcaster[];
  homeTvBroadcasters: ScoreboardBroadcaster[];
  homeRadioBroadcasters: ScoreboardBroadcaster[];
  homeOttBroadcasters: ScoreboardBroadcaster[];
  awayTvBroadcasters: ScoreboardBroadcaster[];
  awayRadioBroadcasters: ScoreboardBroadcaster[];
  awayOttBroadcasters: ScoreboardBroadcaster[];
}

export interface ScoreboardGame {
  gameId: string;
  gameCode: string;
  gameStatus: number;
  gameStatusText: string;
  period: number;
  gameClock: string;
  gameTimeUTC: string;
  gameEt: string;
  regulationPeriods: number;
  seriesGameNumber: string;
  gameLabel: string;
  gameSubLabel: string;
  seriesText: string;
  ifNecessary: boolean;
  seriesConference: string;
  poRoundDesc: string;
  gameSubtype: string;
  isNeutral: boolean;
  gameLeaders: ScoreboardLeaders;
  teamLeaders: ScoreboardLeaders;
  broadcasters: ScoreboardBroadcasters;
  homeTeam: ScoreboardTeam;
  awayTeam: ScoreboardTeam;
}

export interface Scoreboard {
  gameDate: string;
  leagueId: string;
  leagueName: string;
  games: ScoreboardGame[];
}

export interface ScoreboardResponse {
  ok: boolean;
  date: string;
  scoreboard: Scoreboard;
}

export type ScoreStatus =
  | 'scheduled'
  | 'live'
  | 'final'
  | 'postponed'
  | 'canceled'
  | 'delayed'
  | 'unknown';
