import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  AnalyticsPlayer,
  AnalyticsPlayersResponse
} from '../models/analytics-player.models';

import {
  AnalyticsTeam,
  AnalyticsTeamsResponse
} from '../models/analytics-team.models';

@Injectable({
  providedIn: 'root'
})
export class NbaAnalyticsService {

  private readonly playersUrl =
    '/api/nba/analytics/players';

  private readonly teamsUrl =
    '/api/nba/analytics/teams';

  constructor(
    private http: HttpClient
  ) {}

  getPlayers(
    season = '2025-26',
    source: 'live' | 'fixture' = 'live'
  ): Observable<AnalyticsPlayersResponse> {

    let params =
      new HttpParams()
        .set('season', season)
        .set('source', source);

    return this.http.get<AnalyticsPlayersResponse>(
      this.playersUrl,
      { params }
    );
  }

  getTeams(
    season = '2025-26',
    source: 'live' | 'fixture' = 'live'
  ): Observable<AnalyticsTeamsResponse> {

    let params =
      new HttpParams()
        .set('season', season)
        .set('source', source);

    return this.http.get<AnalyticsTeamsResponse>(
      this.teamsUrl,
      { params }
    );
  }

  findPlayer(
    rows: AnalyticsPlayer[],
    personId: string
  ): AnalyticsPlayer | null {

    const found =
      rows.find(
        row =>
          String(row.PLAYER_ID) ===
          String(personId)
      );

    return found || null;
  }

  findTeam(
    rows: AnalyticsTeam[],
    teamId: string
  ): AnalyticsTeam | null {

    const found =
      rows.find(
        row =>
          String(row.TEAM_ID) ===
          String(teamId)
      );

    return found || null;
  }
}