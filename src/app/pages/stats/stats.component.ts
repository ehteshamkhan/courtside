import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { NbaService } from '../../services/nba.service';

import {
  NbaLeagueLeaderRow,
  NbaLeadersResponse,
  PlayerComparison,
  StatsCategory,
  StatsFilters,
  StatsPerMode,
  StatsSeasonType,
  StatsSortDirection,
  StatsSortKey
} from '../../models/stats.models';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  template: `
    <main class="cs-stats-center">

      <section class="cs-stats-hero">

        <div class="cs-stats-hero-copy">

          <span class="cs-stats-kicker">
            COURTSIDE / NBA DATA CENTER
          </span>

          <h1>
            STATS
            <span>CENTER.</span>
          </h1>

          <p>
            Real NBA statistical data from the verified
            league leaders feed. Search it. Sort it. Compare it.
          </p>

        </div>

        <div class="cs-stats-hero-stamp">
          <strong>NBA DATA</strong>
          <span>{{ filters.season }}</span>
        </div>

      </section>


      <section class="cs-stats-controls">

        <div class="cs-stats-control-head">

          <div>
            <span>STAT CONTROL ROOM</span>
            <strong>{{ filteredRows.length }} PLAYERS</strong>
          </div>

          <button
            type="button"
            class="cs-stats-reset"
            (click)="resetFilters()">

            RESET FILTERS

          </button>

        </div>


        <div class="cs-stats-filter-grid">

          <label class="cs-stats-filter search-filter">

            <span>SEARCH PLAYER</span>

            <input
              type="search"
              [(ngModel)]="filters.search"
              (ngModelChange)="applyFilters()"
              placeholder="Anthony Edwards">

          </label>


          <label class="cs-stats-filter">

            <span>TEAM</span>

            <select
              [(ngModel)]="filters.team"
              (ngModelChange)="applyFilters()">

              <option value="">ALL TEAMS</option>

              <option
                *ngFor="let team of teams"
                [value]="team">

                {{ team }}

              </option>

            </select>

          </label>


          <label class="cs-stats-filter">

            <span>SEASON</span>

            <select
              [(ngModel)]="filters.season"
              (ngModelChange)="changeSeason()">

              <option
                *ngFor="let season of seasons"
                [value]="season">

                {{ season }}

              </option>

            </select>

          </label>


          <label class="cs-stats-filter">

            <span>SEASON TYPE</span>

            <select
              [(ngModel)]="filters.seasonType"
              (ngModelChange)="changeSeasonType()">

              <option value="Regular Season">
                REGULAR SEASON
              </option>

              <option value="Pre Season" disabled>
                PRE SEASON
              </option>

              <option value="Playoffs" disabled>
                PLAYOFFS
              </option>

            </select>

          </label>


          <label class="cs-stats-filter">

            <span>PER MODE</span>

            <select
              [(ngModel)]="filters.perMode"
              (ngModelChange)="changePerMode()">

              <option value="PerGame">
                PER GAME
              </option>

              <option value="Totals" disabled>
                TOTALS
              </option>

            </select>

          </label>


          <label class="cs-stats-filter">

            <span>STAT CATEGORY</span>

            <select
              [(ngModel)]="filters.statCategory"
              (ngModelChange)="applyFilters()">

              <option value="PTS">POINTS</option>
              <option value="REB">REBOUNDS</option>
              <option value="AST">ASSISTS</option>
              <option value="STL">STEALS</option>
              <option value="BLK">BLOCKS</option>
              <option value="FG_PCT">FG%</option>
              <option value="FG3_PCT">3P%</option>
              <option value="FT_PCT">FT%</option>

            </select>

          </label>

        </div>


        <div class="cs-stats-filter-note">

          <strong>VERIFIED FEED</strong>

          <span>
            Leagueleaders currently exposes the verified
            regular-season per-game dataset through the
            protected COURTSIDE API. Unsupported season types
            and per modes remain disabled rather than displaying
            misleading data.
          </span>

        </div>

      </section>


      <section
        class="cs-stats-state"
        *ngIf="loading">

        <span class="state-number">01</span>

        <div>
          <span>NBA DATA</span>

          <h2>
            LOADING THE STAT CENTER...
          </h2>

          <p>
            Pulling the verified NBA statistical feed.
          </p>
        </div>

      </section>


      <section
        class="cs-stats-state error"
        *ngIf="!loading && error">

        <span class="state-number">!</span>

        <div>

          <span>FEED ERROR</span>

          <h2>
            NBA DATA
            <br>
            IS UNAVAILABLE.
          </h2>

          <p>
            {{ error }}
          </p>

          <button
            type="button"
            class="cs-stats-retry"
            (click)="loadStats()">

            TRY AGAIN

          </button>

        </div>

      </section>


      <section
        class="cs-stats-state empty"
        *ngIf="
          !loading &&
          !error &&
          rows.length > 0 &&
          filteredRows.length === 0
        ">

        <span class="state-number">00</span>

        <div>

          <span>NO MATCHES</span>

          <h2>
            NOTHING FITS
            <br>
            THESE FILTERS.
          </h2>

          <p>
            Change the search or team filter and try again.
          </p>

        </div>

      </section>


      <section
        class="cs-comparison"
        *ngIf="
          !loading &&
          !error &&
          comparison.left &&
          comparison.right
        ">

        <div class="cs-comparison-head">

          <div>
            <span>PLAYER COMPARISON</span>
            <strong>SIDE BY SIDE</strong>
          </div>

          <button
            type="button"
            (click)="clearComparison()">

            CLEAR

          </button>

        </div>


        <div class="cs-comparison-grid">

          <article
            class="cs-comparison-player"
            *ngIf="comparison.left">

            <div class="comparison-player-top">

              <span>PLAYER A</span>

              <a
                [routerLink]="[
                  '/players',
                  comparison.left.PLAYER_ID
                ]">

                {{ comparison.left.PLAYER_NAME }}

              </a>

              <small>
                {{ comparison.left.TEAM_ABBREVIATION || '—' }}
              </small>

            </div>


            <div class="comparison-stats">

              <div>
                <span>GP</span>
                <strong>{{ display(comparison.left.GP) }}</strong>
              </div>

              <div>
                <span>MIN</span>
                <strong>{{ display(comparison.left.MIN) }}</strong>
              </div>

              <div>
                <span>PTS</span>
                <strong>{{ display(comparison.left.PTS) }}</strong>
              </div>

              <div>
                <span>REB</span>
                <strong>{{ display(comparison.left.REB) }}</strong>
              </div>

              <div>
                <span>AST</span>
                <strong>{{ display(comparison.left.AST) }}</strong>
              </div>

              <div>
                <span>STL</span>
                <strong>{{ display(comparison.left.STL) }}</strong>
              </div>

              <div>
                <span>BLK</span>
                <strong>{{ display(comparison.left.BLK) }}</strong>
              </div>

              <div>
                <span>FG%</span>
                <strong>{{ percentage(comparison.left.FG_PCT) }}</strong>
              </div>

              <div>
                <span>3P%</span>
                <strong>{{ percentage(comparison.left.FG3_PCT) }}</strong>
              </div>

              <div>
                <span>FT%</span>
                <strong>{{ percentage(comparison.left.FT_PCT) }}</strong>
              </div>

            </div>

          </article>


          <div class="comparison-divider">
            VS
          </div>


          <article
            class="cs-comparison-player"
            *ngIf="comparison.right">

            <div class="comparison-player-top">

              <span>PLAYER B</span>

              <a
                [routerLink]="[
                  '/players',
                  comparison.right.PLAYER_ID
                ]">

                {{ comparison.right.PLAYER_NAME }}

              </a>

              <small>
                {{ comparison.right.TEAM_ABBREVIATION || '—' }}
              </small>

            </div>


            <div class="comparison-stats">

              <div>
                <span>GP</span>
                <strong>{{ display(comparison.right.GP) }}</strong>
              </div>

              <div>
                <span>MIN</span>
                <strong>{{ display(comparison.right.MIN) }}</strong>
              </div>

              <div>
                <span>PTS</span>
                <strong>{{ display(comparison.right.PTS) }}</strong>
              </div>

              <div>
                <span>REB</span>
                <strong>{{ display(comparison.right.REB) }}</strong>
              </div>

              <div>
                <span>AST</span>
                <strong>{{ display(comparison.right.AST) }}</strong>
              </div>

              <div>
                <span>STL</span>
                <strong>{{ display(comparison.right.STL) }}</strong>
              </div>

              <div>
                <span>BLK</span>
                <strong>{{ display(comparison.right.BLK) }}</strong>
              </div>

              <div>
                <span>FG%</span>
                <strong>{{ percentage(comparison.right.FG_PCT) }}</strong>
              </div>

              <div>
                <span>3P%</span>
                <strong>{{ percentage(comparison.right.FG3_PCT) }}</strong>
              </div>

              <div>
                <span>FT%</span>
                <strong>{{ percentage(comparison.right.FT_PCT) }}</strong>
              </div>

            </div>

          </article>

        </div>

      </section>


      <section
        class="cs-stats-table-section"
        *ngIf="
          !loading &&
          !error &&
          filteredRows.length > 0
        ">

        <div class="cs-stats-table-head">

          <div>
            <span>NBA PLAYER STATISTICS</span>

            <strong>
              {{ filteredRows.length }} RESULTS
            </strong>
          </div>

          <div class="sort-indicator">
            SORT: {{ sortLabel }}
          </div>

        </div>


        <div class="cs-stats-table-scroll">

          <table class="cs-stats-table">

            <thead>

              <tr>

                <th>
                  <button
                    type="button"
                    (click)="sortBy('PLAYER_NAME')">

                    PLAYER
                    <span>{{ sortMark('PLAYER_NAME') }}</span>

                  </button>
                </th>

                <th>
                  <button
                    type="button"
                    (click)="sortBy('TEAM_ABBREVIATION')">

                    TEAM
                    <span>{{ sortMark('TEAM_ABBREVIATION') }}</span>

                  </button>
                </th>

                <th>
                  <button
                    type="button"
                    (click)="sortBy('GP')">

                    GP
                    <span>{{ sortMark('GP') }}</span>

                  </button>
                </th>

                <th>
                  <button
                    type="button"
                    (click)="sortBy('MIN')">

                    MIN
                    <span>{{ sortMark('MIN') }}</span>

                  </button>
                </th>

                <th>
                  <button
                    type="button"
                    (click)="sortBy('PTS')">

                    PTS
                    <span>{{ sortMark('PTS') }}</span>

                  </button>
                </th>

                <th>
                  <button
                    type="button"
                    (click)="sortBy('FG_PCT')">

                    FG%
                    <span>{{ sortMark('FG_PCT') }}</span>

                  </button>
                </th>

                <th>
                  <button
                    type="button"
                    (click)="sortBy('FG3_PCT')">

                    3P%
                    <span>{{ sortMark('FG3_PCT') }}</span>

                  </button>
                </th>

                <th>
                  <button
                    type="button"
                    (click)="sortBy('FT_PCT')">

                    FT%
                    <span>{{ sortMark('FT_PCT') }}</span>

                  </button>
                </th>

                <th>
                  <button
                    type="button"
                    (click)="sortBy('REB')">

                    REB
                    <span>{{ sortMark('REB') }}</span>

                  </button>
                </th>

                <th>
                  <button
                    type="button"
                    (click)="sortBy('AST')">

                    AST
                    <span>{{ sortMark('AST') }}</span>

                  </button>
                </th>

                <th>
                  <button
                    type="button"
                    (click)="sortBy('STL')">

                    STL
                    <span>{{ sortMark('STL') }}</span>

                  </button>
                </th>

                <th>
                  <button
                    type="button"
                    (click)="sortBy('BLK')">

                    BLK
                    <span>{{ sortMark('BLK') }}</span>

                  </button>
                </th>

                <th>
                  <button
                    type="button"
                    (click)="sortBy('TOV')">

                    TOV
                    <span>{{ sortMark('TOV') }}</span>

                  </button>
                </th>

                <th>
                  COMPARE
                </th>

              </tr>

            </thead>


            <tbody>

              <tr
                *ngFor="
                  let player of filteredRows;
                  trackBy: trackPlayer
                ">

                <td class="player-cell">

                  <a
                    [routerLink]="[
                      '/players',
                      player.PLAYER_ID
                    ]">

                    {{ player.PLAYER_NAME }}

                  </a>

                </td>

                <td class="team-cell">
                  {{ player.TEAM_ABBREVIATION || '—' }}
                </td>

                <td>
                  {{ display(player.GP) }}
                </td>

                <td>
                  {{ display(player.MIN) }}
                </td>

                <td class="stat-emphasis">
                  {{ display(player.PTS) }}
                </td>

                <td>
                  {{ percentage(player.FG_PCT) }}
                </td>

                <td>
                  {{ percentage(player.FG3_PCT) }}
                </td>

                <td>
                  {{ percentage(player.FT_PCT) }}
                </td>

                <td>
                  {{ display(player.REB) }}
                </td>

                <td>
                  {{ display(player.AST) }}
                </td>

                <td>
                  {{ display(player.STL) }}
                </td>

                <td>
                  {{ display(player.BLK) }}
                </td>

                <td>
                  {{ display(player.TOV) }}
                </td>

                <td>

                  <button
                    type="button"
                    class="compare-button"
                    [class.selected]="isSelected(player)"
                    (click)="toggleComparison(player)">

                    {{
                      isSelected(player)
                        ? 'SELECTED'
                        : 'COMPARE'
                    }}

                  </button>

                </td>

              </tr>

            </tbody>

          </table>

        </div>

      </section>


      <section class="cs-stats-data-rule">

        <strong>COURTSIDE DATA RULE</strong>

        <span>
          Values shown here come from the verified NBA statistical
          feed. COURTSIDE does not invent statistics, calculate
          rankings, or declare a comparison winner.
        </span>

      </section>

    </main>
  `
})
export class StatsComponent
  implements OnInit, OnDestroy {

  private readonly destroy$ =
    new Subject<void>();

  readonly seasons = [
    '2026-27',
    '2025-26',
    '2024-25'
  ];

  readonly teams: string[] = [];

  rows: NbaLeagueLeaderRow[] = [];

  filteredRows: NbaLeagueLeaderRow[] = [];

  loading = true;

  error = '';

  sortKey: StatsSortKey = 'PTS';

  sortDirection: StatsSortDirection = 'desc';

  comparison: PlayerComparison = {
    left: null,
    right: null
  };

  filters: StatsFilters = {
    search: '',
    team: '',
    position: '',
    conference: '',
    season: '2026-27',
    seasonType: 'Regular Season',
    perMode: 'PerGame',
    statCategory: 'PTS'
  };

  constructor(
    private readonly nba: NbaService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {

    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {

        this.filters.search =
          params['q'] || '';

        this.filters.team =
          params['team'] || '';

        this.filters.season =
          params['season'] || '2026-27';

        this.filters.seasonType =
          this.normalizeSeasonType(
            params['seasonType']
          );

        this.filters.perMode =
          this.normalizePerMode(
            params['perMode']
          );

        this.filters.statCategory =
          this.normalizeCategory(
            params['category']
          );

        this.loadStats();

      });

  }

  ngOnDestroy(): void {

    this.destroy$.next();
    this.destroy$.complete();

  }

  loadStats(): void {

    this.loading = true;
    this.error = '';

    this.nba
      .getLeaders(this.filters.season)
      .pipe(takeUntil(this.destroy$))
      .subscribe({

        next: (
          response: NbaLeadersResponse
        ) => {

          const source =
            Array.isArray(response?.leaders)
              ? response.leaders
              : [];

          this.rows =
            source
              .filter(
                row =>
                  row?.PLAYER_ID != null
              )
              .map(
                row =>
                  this.normalizeRow(row)
              );

          this.buildTeams();

          this.applyFilters(false);

          this.loading = false;

          this.cdr.detectChanges();

        },

        error: (err: unknown) => {

          console.error(
            'COURTSIDE: STATS ERROR:',
            err
          );

          this.rows = [];
          this.filteredRows = [];

          this.loading = false;

          this.error =
            'The NBA statistics service did not return usable data.';

          this.cdr.detectChanges();

        }

      });

  }

  applyFilters(
    updateUrl = true
  ): void {

    const query =
      this.filters.search
        .trim()
        .toLowerCase();

    this.filteredRows =
      this.rows.filter(row => {

        if (
          query &&
          !String(
            row.PLAYER_NAME || ''
          )
            .toLowerCase()
            .includes(query)
        ) {

          return false;

        }

        if (
          this.filters.team &&
          String(
            row.TEAM_ABBREVIATION || ''
          ).toUpperCase() !==
          this.filters.team.toUpperCase()
        ) {

          return false;

        }

        return true;

      });

    this.sortRows();

    if (updateUrl) {
      this.updateUrl();
    }

  }

  changeSeason(): void {

    this.comparison = {
      left: null,
      right: null
    };

    this.updateUrl();

    this.loadStats();

  }

  changeSeasonType(): void {

    /*
     * The protected API currently exposes the verified
     * leagueleaders regular-season dataset.
     *
     * Do not pretend unsupported season types are being
     * requested from the server.
     */

    if (
      this.filters.seasonType !==
      'Regular Season'
    ) {

      this.filters.seasonType =
        'Regular Season';

    }

    this.updateUrl();

  }

  changePerMode(): void {

    /*
     * PerGame is the verified leagueleaders mode currently
     * exposed through the protected API.
     */

    if (
      this.filters.perMode !==
      'PerGame'
    ) {

      this.filters.perMode =
        'PerGame';

    }

    this.updateUrl();

  }

  sortBy(
    key: StatsSortKey
  ): void {

    if (this.sortKey === key) {

      this.sortDirection =
        this.sortDirection === 'asc'
          ? 'desc'
          : 'asc';

    } else {

      this.sortKey = key;

      this.sortDirection =
        key === 'PLAYER_NAME' ||
        key === 'TEAM_ABBREVIATION'
          ? 'asc'
          : 'desc';

    }

    this.sortRows();

  }

  sortRows(): void {

    const key = this.sortKey;

    const direction =
      this.sortDirection === 'asc'
        ? 1
        : -1;

    this.filteredRows =
      [...this.filteredRows]
        .sort((a, b) => {

          const aValue = a[key];
          const bValue = b[key];

          if (
            key === 'PLAYER_NAME' ||
            key === 'TEAM_ABBREVIATION'
          ) {

            return String(
              aValue ?? ''
            ).localeCompare(
              String(
                bValue ?? ''
              )
            ) * direction;

          }

          const aNumber =
            Number(aValue);

          const bNumber =
            Number(bValue);

          const aValid =
            Number.isFinite(aNumber);

          const bValid =
            Number.isFinite(bNumber);

          if (
            !aValid &&
            !bValid
          ) {

            return 0;

          }

          if (!aValid) {
            return 1;
          }

          if (!bValid) {
            return -1;
          }

          return (
            aNumber - bNumber
          ) * direction;

        });

  }

  toggleComparison(
    player: NbaLeagueLeaderRow
  ): void {

    if (
      this.comparison.left?.PLAYER_ID ===
      player.PLAYER_ID
    ) {

      this.comparison.left = null;
      return;

    }

    if (
      this.comparison.right?.PLAYER_ID ===
      player.PLAYER_ID
    ) {

      this.comparison.right = null;
      return;

    }

    if (!this.comparison.left) {

      this.comparison.left = player;
      return;

    }

    if (!this.comparison.right) {

      this.comparison.right = player;
      return;

    }

    /*
     * Selecting a third player replaces Player B.
     * No winner/ranking is assigned.
     */

    this.comparison.right = player;

  }

  clearComparison(): void {

    this.comparison = {
      left: null,
      right: null
    };

  }

  isSelected(
    player: NbaLeagueLeaderRow
  ): boolean {

    return (
      this.comparison.left?.PLAYER_ID ===
        player.PLAYER_ID ||
      this.comparison.right?.PLAYER_ID ===
        player.PLAYER_ID
    );

  }

  display(
    value: unknown
  ): string {

    const number =
      Number(value);

    return Number.isFinite(number)
      ? number.toFixed(1)
      : '—';

  }

  percentage(
    value: unknown
  ): string {

    const number =
      Number(value);

    return Number.isFinite(number)
      ? `${(
          number * 100
        ).toFixed(1)}%`
      : '—';

  }

  sortMark(
    key: StatsSortKey
  ): string {

    if (
      this.sortKey !== key
    ) {

      return '';

    }

    return this.sortDirection === 'asc'
      ? '↑'
      : '↓';

  }

  get sortLabel(): string {

    const labels: Record<
      StatsSortKey,
      string
    > = {

      PLAYER_NAME:
        'PLAYER',

      TEAM_ABBREVIATION:
        'TEAM',

      GP:
        'GP',

      MIN:
        'MIN',

      PTS:
        'PTS',

      FG_PCT:
        'FG%',

      FG3_PCT:
        '3P%',

      FT_PCT:
        'FT%',

      REB:
        'REB',

      AST:
        'AST',

      STL:
        'STL',

      BLK:
        'BLK',

      TOV:
        'TOV',

      PLUS_MINUS:
        '+/-'

    };

    return labels[
      this.sortKey
    ];

  }

  trackPlayer(
    index: number,
    player: NbaLeagueLeaderRow
  ): number | string {

    return (
      player.PLAYER_ID ??
      index
    );

  }

  resetFilters(): void {

    this.filters = {

      search: '',

      team: '',

      position: '',

      conference: '',

      season: '2026-27',

      seasonType:
        'Regular Season',

      perMode:
        'PerGame',

      statCategory:
        'PTS'

    };

    this.comparison = {
      left: null,
      right: null
    };

    this.updateUrl();

    this.loadStats();

  }

  private buildTeams(): void {

    const values =
      this.rows
        .map(row =>
          String(
            row.TEAM_ABBREVIATION ||
            ''
          ).trim()
        )
        .filter(Boolean);

    const unique =
      Array.from(
        new Set(values)
      ).sort();

    this.teams.splice(
      0,
      this.teams.length,
      ...unique
    );

  }

  private normalizeRow(
    row: NbaLeagueLeaderRow
  ): NbaLeagueLeaderRow {

    /*
     * Preserve NBA values.
     * Only normalize display strings.
     */

    return {

      ...row,

      PLAYER_ID:
        row.PLAYER_ID,

      PLAYER_NAME:
        String(
          row.PLAYER_NAME ||
          row['PLAYER'] ||
          'Unknown Player'
        ),

      TEAM_ABBREVIATION:
        row.TEAM_ABBREVIATION ||
        row['TEAM']
          ? String(
              row.TEAM_ABBREVIATION ||
              row['TEAM']
            )
          : undefined

    };

  }

  private normalizeSeasonType(
    value: unknown
  ): StatsSeasonType {

    return value ===
      'Regular Season'
      ? 'Regular Season'
      : 'Regular Season';

  }

  private normalizePerMode(
    value: unknown
  ): StatsPerMode {

    return value ===
      'PerGame'
      ? 'PerGame'
      : 'PerGame';

  }

  private normalizeCategory(
    value: unknown
  ): StatsCategory {

    const allowed:
      StatsCategory[] = [

      'PTS',
      'REB',
      'AST',
      'STL',
      'BLK',
      'FG_PCT',
      'FG3_PCT',
      'FT_PCT'

    ];

    return allowed.includes(
      value as StatsCategory
    )
      ? value as StatsCategory
      : 'PTS';

  }

  private updateUrl(): void {

    void this.router.navigate(
      [],
      {

        relativeTo:
          this.route,

        queryParams: {

          q:
            this.filters.search ||
            null,

          team:
            this.filters.team ||
            null,

          season:
            this.filters.season,

          seasonType:
            this.filters.seasonType,

          perMode:
            this.filters.perMode,

          category:
            this.filters.statCategory

        },

        queryParamsHandling:
          ''

      }
    );

  }

}


