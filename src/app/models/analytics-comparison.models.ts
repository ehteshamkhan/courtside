import { AnalyticsPlayer } from './analytics-player.models';
import { AnalyticsTeam } from './analytics-team.models';

export interface AnalyticsComparison {
  playerA: AnalyticsPlayer | null;
  playerB: AnalyticsPlayer | null;
  teamA: AnalyticsTeam | null;
  teamB: AnalyticsTeam | null;
}

export type ComparisonMode = 'players' | 'teams';