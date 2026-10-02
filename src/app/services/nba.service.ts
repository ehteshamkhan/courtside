import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  ScoreboardResponse
} from '../models/scoreboard.models';

@Injectable({
  providedIn: 'root'
})
export class NbaService {

  private readonly api = '/api/nba';

  constructor(private http: HttpClient) {}

  getScoreboard(date?: string): Observable<ScoreboardResponse> {
    let params = new HttpParams();

    if (date) {
      params = params.set('date', date);
    }

    return this.http.get<ScoreboardResponse>(
      `${this.api}/scoreboard`,
      { params }
    );
  }

  getStandings(season?: string): Observable<any> {
    let params = new HttpParams();

    if (season) {
      params = params.set('season', season);
    }

    return this.http.get(`${this.api}/standings`, { params });
  }

  getLeaders(season?: string): Observable<any> {
    let params = new HttpParams();

    if (season) {
      params = params.set('season', season);
    }

    return this.http.get(`${this.api}/leaders`, { params });
  }

  getPlayers(season?: string): Observable<any> {
    let params = new HttpParams();

    if (season) {
      params = params.set('season', season);
    }

    return this.http.get(`${this.api}/players`, { params });
  }

  getPlayer(personId: number | string): Observable<any> {
    return this.http.get(
      `${this.api}/players/${personId}`
    );
  }
}
