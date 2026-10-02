import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

import { NbaService } from '../../services/nba.service';

interface CourtSideTeam {
  id: number | string;
  city: string;
  name: string;
  tricode: string;
  wins: number | null;
  losses: number | null;
  winPct: number | null;
  conference: string;
  division: string;
  rank: number | null;
  playoffRank: number | null;
  gamesBack: number | null;
  streak: string;
  raw: any;
}

@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <main class="cs-page cs-teams-page">

      <section class="cs-hero cs-team-hero">
        <div>
          <p class="cs-kicker">COURTSIDE / TEAM INTELLIGENCE</p>
          <h1>TEAMS</h1>
          <p class="cs-hero-copy">
            Real NBA team records and standings data, organized for quick scanning.
          </p>
        </div>

        <div class="cs-hero-badge">
          {{ filteredTeams.length }} TEAM{{ filteredTeams.length === 1 ? '' : 'S' }}
        </div>
      </section>

      <section class="cs-intel-toolbar" aria-label="Team filters">

        <label class="cs-intel-search">
          <span>SEARCH TEAMS</span>
          <input
            type="search"
            [value]="searchTerm"
            (input)="setSearch($any($event.target).value)"
            placeholder="Search team, city or abbreviation"
            aria-label="Search NBA teams">
        </label>

        <div class="cs-filter-group">
          <button
            type="button"
            class="cs-filter-button"
            [class.cs-filter-active]="conferenceFilter === 'ALL'"
            (click)="setConference('ALL')">
            ALL
          </button>

          <button
            type="button"
            class="cs-filter-button"
            [class.cs-filter-active]="conferenceFilter === 'EAST'"
            (click)="setConference('EAST')">
            EAST
          </button>

          <button
            type="button"
            class="cs-filter-button"
            [class.cs-filter-active]="conferenceFilter === 'WEST'"
            (click)="setConference('WEST')">
            WEST
          </button>
        </div>

        <button
          type="button"
          class="cs-reset-button"
          (click)="resetFilters()">
          RESET
        </button>

      </section>

      <section
        *ngIf="loading"
        class="cs-state-card"
        aria-live="polite"
        aria-busy="true">

        <span class="cs-spinner" aria-hidden="true"></span>

        <div>
          <h2>LOADING TEAM INTELLIGENCE</h2>
          <p>Retrieving the latest available NBA standings data.</p>
        </div>
      </section>

      <section
        *ngIf="!loading && errorMessage"
        class="cs-state-card cs-state-error"
        role="alert">

        <div>
          <p class="cs-state-code">DATA ERROR</p>
          <h2>TEAM DATA UNAVAILABLE</h2>
          <p>{{ errorMessage }}</p>
        </div>

        <button
          type="button"
          class="cs-control-button"
          (click)="loadTeams()">
          TRY AGAIN
        </button>
      </section>

      <section
        *ngIf="!loading && !errorMessage"
        class="cs-team-summary"
        aria-live="polite">

        <div>
          <span>TEAMS FOUND</span>
          <strong>{{ teams.length }}</strong>
        </div>

        <div>
          <span>SHOWING</span>
          <strong>{{ filteredTeams.length }}</strong>
        </div>

        <div>
          <span>CONFERENCE</span>
          <strong>{{ conferenceFilter }}</strong>
        </div>

      </section>

      <section
        *ngIf="!loading && !errorMessage && filteredTeams.length === 0"
        class="cs-state-card cs-state-empty">

        <div>
          <p class="cs-state-code">NO MATCH</p>
          <h2>NO TEAMS FOUND</h2>
          <p>
            No real NBA team record matches the current filters.
          </p>
        </div>
      </section>

      <section
        *ngIf="!loading && !errorMessage && filteredTeams.length > 0"
        class="cs-team-grid"
        aria-label="NBA teams">

        <article
          *ngFor="let team of filteredTeams; trackBy: trackTeam"
          class="cs-team-intel-card">

          <header class="cs-team-intel-header">

            <div class="cs-team-intel-mark">
              {{ team.tricode || 'NBA' }}
            </div>

            <div>
              <p>{{ team.city }}</p>
              <h2>{{ team.name }}</h2>
            </div>

            <span
              *ngIf="team.rank !== null"
              class="cs-team-rank">
              #{{ team.rank }}
            </span>

          </header>

          <div class="cs-team-record">

            <div>
              <span>RECORD</span>
              <strong>
                {{ team.wins ?? '—' }} - {{ team.losses ?? '—' }}
              </strong>
            </div>

            <div>
              <span>WIN %</span>
              <strong>
                {{ team.winPct === null ? '—' : (team.winPct | number:'1.3-3') }}
              </strong>
            </div>

            <div>
              <span>GB</span>
              <strong>
                {{ team.gamesBack === null ? '—' : team.gamesBack }}
              </strong>
            </div>

          </div>

          <div class="cs-team-meta">

            <span *ngIf="team.conference">
              {{ team.conference }}
            </span>

            <span *ngIf="team.division">
              {{ team.division }}
            </span>

            <span *ngIf="team.streak">
              STREAK {{ team.streak }}
            </span>

          </div>

          <footer class="cs-team-intel-footer">

            <span>
              REAL NBA DATA
            </span>

            <a
              [routerLink]="['/players']"
              [queryParams]="{ team: team.tricode }">
              VIEW PLAYERS →
            </a>

          </footer>

        </article>

      </section>

    </main>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class TeamsComponent implements OnInit {

  teams: CourtSideTeam[] = [];

  searchTerm = '';
  conferenceFilter = 'ALL';

  loading = false;
  errorMessage = '';

  constructor(private nba: NbaService) {}

  ngOnInit(): void {
    this.loadTeams();
  }

  loadTeams(): void {
    this.loading = true;
    this.errorMessage = '';

    this.nba.getStandings().subscribe({
      next: response => {
        this.teams = this.normalizeTeams(response);
        this.loading = false;
      },

      error: () => {
        this.loading = false;
        this.errorMessage =
          'The NBA standings service did not return usable team data.';
      }
    });
  }

  get filteredTeams(): CourtSideTeam[] {

    const search = this.searchTerm
      .trim()
      .toLowerCase();

    return this.teams
      .filter(team => {

        if (
          this.conferenceFilter !== 'ALL' &&
          team.conference !== this.conferenceFilter
        ) {
          return false;
        }

        if (!search) {
          return true;
        }

        const haystack = [
          team.city,
          team.name,
          team.tricode,
          team.conference,
          team.division
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return haystack.includes(search);
      })
      .sort((a, b) => {

        const aRank = a.rank ?? 999;
        const bRank = b.rank ?? 999;

        return aRank - bRank;
      });
  }

  setSearch(value: string): void {
    this.searchTerm = value;
  }

  setConference(value: string): void {
    this.conferenceFilter = value;
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.conferenceFilter = 'ALL';
  }

  trackTeam(_index: number, team: CourtSideTeam): string {
    return String(team.id || team.tricode);
  }

  private normalizeTeams(response: any): CourtSideTeam[] {

    const rows = this.extractRows(response);

    return rows
      .map((row: any, index: number) => {

        const source = row?.team || row;

        const city =
          this.firstString(
            source?.teamCity,
            source?.city,
            row?.teamCity,
            row?.city
          );

        const name =
          this.firstString(
            source?.teamName,
            source?.name,
            row?.teamName,
            row?.name
          );

        const tricode =
          this.firstString(
            source?.teamTricode,
            source?.tricode,
            row?.teamTricode,
            row?.tricode
          );

        if (!city && !name && !tricode) {
          return null;
        }

        const wins = this.toNumber(
          source?.wins ??
          row?.wins ??
          row?.win ??
          row?.W
        );

        const losses = this.toNumber(
          source?.losses ??
          row?.losses ??
          row?.loss ??
          row?.L
        );

        let winPct = this.toNumber(
          source?.winPct ??
          source?.winPercentage ??
          row?.winPct ??
          row?.winPercentage ??
          row?.WinPCT
        );

        if (
          winPct === null &&
          wins !== null &&
          losses !== null &&
          wins + losses > 0
        ) {
          winPct = wins / (wins + losses);
        }

        const conferenceRaw =
          this.firstString(
            source?.conference,
            row?.conference,
            row?.Conference
          );

        const conference =
          this.normalizeConference(conferenceRaw);

        return {
          id:
            source?.teamId ??
            row?.teamId ??
            row?.TeamID ??
            `${tricode || name || 'TEAM'}-${index}`,

          city: city || '',

          name: name || '',

          tricode: tricode || '',

          wins,

          losses,

          winPct,

          conference,

          division:
            this.firstString(
              source?.division,
              row?.division,
              row?.Division
            ),

          rank: this.toNumber(
            source?.rank ??
            row?.rank ??
            row?.playoffRank ??
            row?.PlayoffRank ??
            row?.ConferenceRank
          ),

          playoffRank: this.toNumber(
            source?.playoffRank ??
            row?.playoffRank ??
            row?.PlayoffRank
          ),

          gamesBack: this.toNumber(
            source?.gamesBack ??
            row?.gamesBack ??
            row?.GB
          ),

          streak:
            this.firstString(
              source?.streak,
              row?.streak,
              row?.strk
            ),

          raw: row
        } as CourtSideTeam;
      })
      .filter(
        (team: CourtSideTeam | null): team is CourtSideTeam =>
          team !== null
      );
  }

  private extractRows(response: any): any[] {

    if (Array.isArray(response?.standings)) {
      return response.standings;
    }

    if (Array.isArray(response?.teams)) {
      return response.teams;
    }

    if (Array.isArray(response?.data)) {
      return response.data;
    }

    if (Array.isArray(response?.rows)) {
      return response.rows;
    }

    if (Array.isArray(response?.resultSet?.rowSet)) {
      return this.mapResultSet(response.resultSet);
    }

    if (Array.isArray(response?.resultSets)) {

      for (const resultSet of response.resultSets) {

        if (Array.isArray(resultSet?.rowSet)) {
          return this.mapResultSet(resultSet);
        }
      }
    }

    return [];
  }

  private mapResultSet(resultSet: any): any[] {

    const headers = Array.isArray(resultSet?.headers)
      ? resultSet.headers
      : [];

    const rows = Array.isArray(resultSet?.rowSet)
      ? resultSet.rowSet
      : [];

    return rows.map((row: any[]) => {

      const object: any = {};

      headers.forEach(
        (header: string, index: number) => {
          object[header] = row[index];
        }
      );

      return object;
    });
  }

  private normalizeConference(value: string): string {

    const normalized = value.toLowerCase();

    if (
      normalized.includes('east') ||
      normalized === 'e'
    ) {
      return 'EAST';
    }

    if (
      normalized.includes('west') ||
      normalized === 'w'
    ) {
      return 'WEST';
    }

    return '';
  }

  private firstString(...values: any[]): string {

    for (const value of values) {

      if (
        value !== null &&
        value !== undefined &&
        String(value).trim() !== ''
      ) {
        return String(value).trim();
      }
    }

    return '';
  }

  private toNumber(value: any): number | null {

    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      return null;
    }

    const number = Number(value);

    return Number.isFinite(number)
      ? number
      : null;
  }
}
