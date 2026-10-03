import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { NbaService } from '../../services/nba.service';

interface CourtSidePlayer {
  id: number | string;
  name: string;
  firstName: string;
  lastName: string;
  teamId: number | string;
  team: string;
  teamCity: string;
  position: string;
  jersey: string;
  height: string;
  weight: string;
  country: string;
  slug: string;
  active: boolean | null;
  raw: any;
}

@Component({
  selector: 'app-players',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <main class="cs-page cs-players-page">

      <section class="cs-hero cs-player-hero">
        <div>
          <p class="cs-kicker">COURTSIDE / PLAYER INTELLIGENCE</p>
          <h1>PLAYERS</h1>
          <p class="cs-hero-copy">
            Search the real NBA player directory and jump directly into player profiles.
          </p>
        </div>

        <div class="cs-hero-badge">
          {{ filteredPlayers.length }} PLAYER{{ filteredPlayers.length === 1 ? '' : 'S' }}
        </div>
      </section>

      <section class="cs-intel-toolbar" aria-label="Player filters">

        <label class="cs-intel-search">
          <span>SEARCH PLAYERS</span>
          <input
            type="search"
            [value]="searchTerm"
            (input)="setSearch($any($event.target).value)"
            placeholder="Search player name"
            aria-label="Search NBA players">
        </label>

        <label class="cs-intel-select">
          <span>TEAM</span>

          <select
            [value]="teamFilter"
            (change)="setTeam($any($event.target).value)"
            aria-label="Filter players by team">

            <option value="ALL">ALL TEAMS</option>

            <option
              *ngFor="let team of availableTeams"
              [value]="team">
              {{ team }}
            </option>

          </select>
        </label>

        <label class="cs-intel-select">
          <span>POSITION</span>

          <select
            [value]="positionFilter"
            (change)="setPosition($any($event.target).value)"
            aria-label="Filter players by position">

            <option value="ALL">ALL POSITIONS</option>

            <option
              *ngFor="let position of availablePositions"
              [value]="position">
              {{ position }}
            </option>

          </select>
        </label>

        <label class="cs-intel-select">
          <span>SORT</span>

          <select
            [value]="sortMode"
            (change)="setSort($any($event.target).value)"
            aria-label="Sort players">

            <option value="NAME">NAME</option>
            <option value="TEAM">TEAM</option>
            <option value="POSITION">POSITION</option>

          </select>
        </label>

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
          <h2>LOADING PLAYER DIRECTORY</h2>
          <p>Retrieving the current NBA player directory.</p>
        </div>
      </section>

      <section
        *ngIf="!loading && errorMessage"
        class="cs-state-card cs-state-error"
        role="alert">

        <div>
          <p class="cs-state-code">DATA ERROR</p>
          <h2>PLAYER DIRECTORY UNAVAILABLE</h2>
          <p>{{ errorMessage }}</p>
        </div>

        <button
          type="button"
          class="cs-control-button"
          (click)="loadPlayers()">
          TRY AGAIN
        </button>
      </section>

      <section
        *ngIf="!loading && !errorMessage"
        class="cs-player-summary"
        aria-live="polite">

        <div>
          <span>DIRECTORY</span>
          <strong>{{ players.length }}</strong>
        </div>

        <div>
          <span>SHOWING</span>
          <strong>{{ filteredPlayers.length }}</strong>
        </div>

        <div>
          <span>TEAMS</span>
          <strong>{{ availableTeams.length }}</strong>
        </div>

        <div>
          <span>POSITIONS</span>
          <strong>{{ availablePositions.length }}</strong>
        </div>

      </section>

      <section
        *ngIf="!loading && !errorMessage && filteredPlayers.length === 0"
        class="cs-state-card cs-state-empty">

        <div>
          <p class="cs-state-code">NO MATCH</p>
          <h2>NO PLAYERS FOUND</h2>
          <p>
            No player in the real NBA directory matches the current filters.
          </p>
        </div>
      </section>

      <section
        *ngIf="!loading && !errorMessage && filteredPlayers.length > 0"
        class="cs-player-grid"
        aria-label="NBA players">

        <article
          *ngFor="let player of filteredPlayers; trackBy: trackPlayer"
          class="cs-player-intel-card">

          <header class="cs-player-card-header">

            <div class="cs-player-number">
              {{ player.jersey || '—' }}
            </div>

            <div class="cs-player-name">
              <p>{{ player.team || 'NBA' }}</p>

              <h2>
                {{ player.firstName }}
                {{ player.lastName }}
              </h2>
            </div>

          </header>

          <div class="cs-player-tags">

            <span *ngIf="player.position">
              {{ player.position }}
            </span>

            <span *ngIf="player.team">
              {{ player.team }}
            </span>

            <span *ngIf="player.country">
              {{ player.country }}
            </span>

          </div>

          <div class="cs-player-facts">

            <div *ngIf="player.height">
              <span>HEIGHT</span>
              <strong>{{ player.height }}</strong>
            </div>

            <div *ngIf="player.weight">
              <span>WEIGHT</span>
              <strong>{{ player.weight }}</strong>
            </div>

            <div>
              <span>PLAYER ID</span>
              <strong>{{ player.id }}</strong>
            </div>

          </div>

          <footer class="cs-player-card-footer">

            <span>
              REAL NBA DIRECTORY
            </span>

            <a
              [routerLink]="['/players', player.id]">
              PROFILE →
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
export class PlayersComponent implements OnInit, OnDestroy {

  players: CourtSidePlayer[] = [];

  searchTerm = '';
  teamFilter = 'ALL';
  positionFilter = 'ALL';
  sortMode = 'NAME';

  loading = false;
  errorMessage = '';

  private querySubscription?: Subscription;

  constructor(
    private nba: NbaService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {

    this.querySubscription =
      this.route.queryParams.subscribe(params => {

        if (params['team']) {
          this.teamFilter =
            String(params['team']).toUpperCase();
        }

        if (params['q']) {
          this.searchTerm =
            String(params['q']);
        }

        this.loadPlayers();
      });
  }

  ngOnDestroy(): void {
    this.querySubscription?.unsubscribe();
  }

  loadPlayers(): void {

    this.loading = true;
    this.errorMessage = '';

    this.nba.getPlayers().subscribe({

      next: response => {

        this.players =
          this.normalizePlayers(response);

        this.loading = false;
        this.cdr.markForCheck();
      },

      error: () => {

        this.loading = false;
        this.cdr.markForCheck();

        this.errorMessage =
          'The NBA player directory did not return usable player data.';
      }
    });
  }

  get filteredPlayers(): CourtSidePlayer[] {

    const search =
      this.searchTerm
        .trim()
        .toLowerCase();

    const filtered =
      this.players.filter(player => {

        if (
          this.teamFilter !== 'ALL' &&
          player.team.toUpperCase() !==
            this.teamFilter.toUpperCase() &&
          player.teamCity.toUpperCase() !==
            this.teamFilter.toUpperCase()
        ) {
          return false;
        }

        if (
          this.positionFilter !== 'ALL' &&
          player.position.toUpperCase() !==
            this.positionFilter.toUpperCase()
        ) {
          return false;
        }

        if (!search) {
          return true;
        }

        const haystack = [
          player.name,
          player.firstName,
          player.lastName,
          player.team,
          player.teamCity,
          player.position,
          player.country,
          player.slug
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return haystack.includes(search);
      });

    return filtered.sort((a, b) => {

      if (this.sortMode === 'TEAM') {
        return a.team.localeCompare(b.team) ||
          a.name.localeCompare(b.name);
      }

      if (this.sortMode === 'POSITION') {
        return a.position.localeCompare(b.position) ||
          a.name.localeCompare(b.name);
      }

      return a.name.localeCompare(b.name);
    });
  }

  get availableTeams(): string[] {

    return [
      ...new Set(
        this.players
          .map(player => player.team)
          .filter(Boolean)
      )
    ].sort();
  }

  get availablePositions(): string[] {

    return [
      ...new Set(
        this.players
          .map(player => player.position)
          .filter(Boolean)
      )
    ].sort();
  }

  setSearch(value: string): void {
    this.searchTerm = value;
    this.updateQueryParams();
  }

  setTeam(value: string): void {
    this.teamFilter = value;
    this.updateQueryParams();
  }

  setPosition(value: string): void {
    this.positionFilter = value;
  }

  setSort(value: string): void {
    this.sortMode = value;
  }

  resetFilters(): void {

    this.searchTerm = '';
    this.teamFilter = 'ALL';
    this.positionFilter = 'ALL';
    this.sortMode = 'NAME';

    this.router.navigate(
      ['/players'],
      {
        queryParams: {}
      }
    );
  }

  trackPlayer(
    _index: number,
    player: CourtSidePlayer
  ): string {
    return String(player.id);
  }

  private updateQueryParams(): void {

    const queryParams: any = {};

    if (this.teamFilter !== 'ALL') {
      queryParams.team = this.teamFilter;
    }

    if (this.searchTerm.trim()) {
      queryParams.q = this.searchTerm.trim();
    }

    this.router.navigate(
      ['/players'],
      {
        queryParams,
        replaceUrl: true
      }
    );
  }

  private normalizePlayers(response: any): CourtSidePlayer[] {

    const rows =
      this.extractRows(response);

    return rows
      .map((row: any) => {

        const source =
          row?.player ||
          row;

        const id =
          source?.personId ??
          source?.playerId ??
          source?.id ??
          source?.PERSON_ID ??
          source?.PLAYER_ID ??
          row?.personId ??
          row?.playerId ??
          row?.id ??
          row?.PERSON_ID ??
          row?.PLAYER_ID;

        const explicitFirstName =
          this.firstString(
            source?.firstName,
            source?.FIRST_NAME,
            row?.firstName,
            row?.FIRST_NAME
          );

        const explicitLastName =
          this.firstString(
            source?.lastName,
            source?.LAST_NAME,
            row?.lastName,
            row?.LAST_NAME
          );

        const fullName =
          this.firstString(
            source?.fullName,
            source?.displayName,
            source?.DISPLAY_FIRST_LAST,
            source?.DISPLAY_LAST_COMMA_FIRST,
            row?.fullName,
            row?.displayName,
            row?.DISPLAY_FIRST_LAST,
            row?.DISPLAY_LAST_COMMA_FIRST,
            [
              explicitFirstName,
              explicitLastName
            ]
              .filter(Boolean)
              .join(' ')
          );

        if (
          id === null ||
          id === undefined ||
          !fullName
        ) {
          return null;
        }

        const nameParts =
          fullName
            .trim()
            .split(/\s+/);

        const firstName =
          explicitFirstName ||
          nameParts[0] ||
          '';

        const lastName =
          explicitLastName ||
          nameParts.slice(1).join(' ');

        return {
          id,

          name: fullName,

          firstName,

          lastName,

          teamId:
            source?.teamId ??
            source?.TEAM_ID ??
            row?.teamId ??
            row?.TEAM_ID ??
            '',

          team:
            this.firstString(
              source?.teamTricode,
              source?.team,
              source?.TEAM_ABBREVIATION,
              source?.TEAM_CODE,
              source?.TEAM_NAME,
              row?.teamTricode,
              row?.team,
              row?.TEAM_ABBREVIATION,
              row?.TEAM_CODE,
              row?.TEAM_NAME
            ),

          teamCity:
            this.firstString(
              source?.teamCity,
              source?.TEAM_CITY,
              row?.teamCity,
              row?.TEAM_CITY
            ),

          position:
            this.firstString(
              source?.position,
              source?.POSITION,
              row?.position,
              row?.POSITION
            ),

          jersey:
            this.firstString(
              source?.jerseyNum,
              source?.jersey,
              source?.JERSEY_NUM,
              source?.JERSEY,
              row?.jerseyNum,
              row?.jersey,
              row?.JERSEY_NUM,
              row?.JERSEY
            ),

          height:
            this.firstString(
              source?.height,
              source?.HEIGHT,
              row?.height,
              row?.HEIGHT
            ),

          weight:
            this.firstString(
              source?.weight,
              source?.WEIGHT,
              row?.weight,
              row?.WEIGHT
            ),

          country:
            this.firstString(
              source?.country,
              source?.countryCode,
              source?.COUNTRY,
              source?.COUNTRY_CODE,
              row?.country,
              row?.countryCode,
              row?.COUNTRY,
              row?.COUNTRY_CODE
            ),

          slug:
            this.firstString(
              source?.playerSlug,
              source?.slug,
              source?.PLAYER_SLUG,
              source?.PLAYERCODE,
              row?.playerSlug,
              row?.slug,
              row?.PLAYER_SLUG,
              row?.PLAYERCODE
            ),

          active:
            this.toBoolean(
              source?.isActive ??
              source?.active ??
              source?.ROSTERSTATUS ??
              row?.isActive ??
              row?.active ??
              row?.ROSTERSTATUS
            ),

          raw: row
        } as CourtSidePlayer;
      })
      .filter(
        (
          player: CourtSidePlayer | null
        ): player is CourtSidePlayer =>
          player !== null
      );
  }
  private extractRows(response: any): any[] {

    if (Array.isArray(response?.players)) {
      return response.players;
    }

    if (Array.isArray(response?.data)) {
      return response.data;
    }

    if (Array.isArray(response?.rows)) {
      return response.rows;
    }

    if (Array.isArray(response?.resultSet?.rowSet)) {
      return this.mapResultSet(
        response.resultSet
      );
    }

    if (Array.isArray(response?.resultSets)) {

      for (const resultSet of response.resultSets) {

        if (Array.isArray(resultSet?.rowSet)) {
          return this.mapResultSet(
            resultSet
          );
        }
      }
    }

    return [];
  }

  private mapResultSet(resultSet: any): any[] {

    const headers =
      Array.isArray(resultSet?.headers)
        ? resultSet.headers
        : [];

    const rows =
      Array.isArray(resultSet?.rowSet)
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

  private toBoolean(value: any): boolean | null {

    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      return null;
    }

    if (
      value === true ||
      value === 1 ||
      value === '1' ||
      String(value).toLowerCase() === 'true'
    ) {
      return true;
    }

    if (
      value === false ||
      value === 0 ||
      value === '0' ||
      String(value).toLowerCase() === 'false'
    ) {
      return false;
    }

    return null;
  }
}
