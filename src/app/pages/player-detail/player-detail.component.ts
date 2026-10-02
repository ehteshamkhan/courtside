import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { NbaService } from '../../services/nba.service';

interface PlayerInfo {
  PERSON_ID?: number | string;
  FIRST_NAME?: string;
  LAST_NAME?: string;
  DISPLAY_FIRST_LAST?: string;
  DISPLAY_LAST_COMMA_FIRST?: string;
  DISPLAY_FI_LAST?: string;
  PLAYER_SLUG?: string;
  BIRTHDATE?: string;
  SCHOOL?: string;
  COUNTRY?: string;
  LAST_AFFILIATION?: string;
  HEIGHT?: string;
  WEIGHT?: string;
  SEASON_EXP?: number | string;
  JERSEY?: string;
  POSITION?: string;
  ROSTERSTATUS?: number | string;
  TEAM_ID?: number | string;
  TEAM_NAME?: string;
  TEAM_ABBREVIATION?: string;
  TEAM_CODE?: string;
  TEAM_CITY?: string;
  PLAYERCODE?: string;
  FROM_YEAR?: number | string;
  TO_YEAR?: number | string;
  DRAFT_YEAR?: string;
  DRAFT_ROUND?: string;
  DRAFT_NUMBER?: string;
  GREATEST_75_FLAG?: string;
}

interface DirectoryPlayer {
  PERSON_ID?: number | string;
  DISPLAY_FIRST_LAST?: string;
  FIRST_NAME?: string;
  LAST_NAME?: string;
  TEAM_ABBREVIATION?: string;
  TEAM_NAME?: string;
  TEAM_CITY?: string;
}
interface SeasonStat {
  PLAYER_ID?: number | string;
  SEASON_ID?: string;
  LEAGUE_ID?: string;
  TEAM_ID?: number | string;
  TEAM_ABBREVIATION?: string;
  PLAYER_AGE?: number;
  GP?: number;
  GS?: number;
  MIN?: number;
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
  STL?: number;
  BLK?: number;
  TOV?: number;
  PF?: number;
  PTS?: number;
}

@Component({
  selector: 'app-player-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  template: `

    <main class="cs-player-page">

      <!-- =====================================================
           TOP NAV / BACK
           ===================================================== -->

      <section class="cs-player-topbar">

        <a
          routerLink="/players"
          class="cs-back">

          <span class="cs-back-arrow">←</span>

          <span>
            PLAYER DIRECTORY
          </span>

        </a>

        <div class="cs-topbar-brand">
          COURTSIDE
        </div>

        <div class="cs-topbar-tag">
          THE NBA. WITHOUT THE BORING PART.
        </div>

      </section>


      <!-- =====================================================
           LOADING
           ===================================================== -->

      <section
        class="cs-state cs-state-loading"
        *ngIf="loading">

        <div class="cs-state-number">
          00
        </div>

        <div>
          <span class="cs-eyebrow">
            COURTSIDE DATA FEED
          </span>

          <h1>
            LOADING<br>
            PLAYER.
          </h1>

          <p>
            Requesting the real NBA player profile.
          </p>
        </div>

      </section>


      <!-- =====================================================
           ERROR
           ===================================================== -->

      <section
        class="cs-state cs-state-error"
        *ngIf="!loading && error">

        <div class="cs-state-number">
          !
        </div>

        <div>
          <span class="cs-eyebrow">
            DATA FEED
          </span>

          <h1>
            PLAYER DATA<br>
            HIT A WALL.
          </h1>

          <p>
            The NBA player detail endpoint could not be loaded.
            COURTSIDE has not substituted fictional information.
          </p>

          <button
            type="button"
            class="cs-action"
            (click)="loadPlayer()">

            TRY AGAIN

          </button>

        </div>

      </section>


      <!-- =====================================================
           PLAYER HERO
           ===================================================== -->

      <section
        class="cs-hero"
        [attr.data-team]="player.TEAM_ABBREVIATION || 'NBA'"
        *ngIf="!loading && !error && player">

        <div class="cs-hero-halftone"></div>

        <div class="cs-hero-number">
          {{ player.JERSEY || player.PERSON_ID }}
        </div>

        <div class="cs-hero-copy">

          <div class="cs-eyebrow cs-eyebrow-light">
            PLAYER PROFILE / {{ player.PERSON_ID }}
          </div>

          <h1>
            {{ player.FIRST_NAME || player.DISPLAY_FIRST_LAST }}
            <span>
              {{ player.LAST_NAME }}
            </span>
          </h1>

          <div class="cs-team-line">

            <span class="cs-team-chip">
              {{ player.TEAM_ABBREVIATION || 'NBA' }}
            </span>

            <strong>
              {{ teamLabel() }}
            </strong>

          </div>

          <div class="cs-role-row">

            <span>
              {{ player.POSITION || 'PLAYER' }}
            </span>

            <span
              *ngIf="player.JERSEY">

              #{{ player.JERSEY }}

            </span>

            <span>
              {{
                player.ROSTERSTATUS === 1 ||
                player.ROSTERSTATUS === '1'
                  ? 'ACTIVE'
                  : 'ROSTER'
              }}
            </span>

          </div>

        </div>

        <div class="cs-hero-stamp">

          <span>
            NBA
          </span>

          <strong>
            REAL
          </strong>

          <small>
            DATA
          </small>

        </div>

        <div class="cs-hero-season">

          <span>
            CURRENT DATA
          </span>

          <strong>
            {{ season }}
          </strong>

        </div>

      </section>


      <!-- =====================================================
           DATA STATUS
           ===================================================== -->

      <section
        class="cs-data-strip"
        *ngIf="!loading && !error && player">

        <div class="cs-live-dot"></div>

        <strong>
          {{
            dataStatus === 'stale'
              ? 'STALE NBA DATA'
              : 'LIVE NBA DATA'
          }}
        </strong>

        <span>
          {{
            dataStatus === 'stale'
              ? 'Cached ' + staleAgeSeconds + ' seconds ago'
              : 'Verified through the COURTSIDE API'
          }}
        </span>

        <span class="cs-data-id">
          PLAYER ID {{ player.PERSON_ID }}
        </span>

      </section>


      <!-- =====================================================
           QUICK STATS
           ===================================================== -->

      <section
        class="cs-quick-stats"
        *ngIf="!loading && !error && player">

        <article class="cs-quick-card">

          <span>
            POSITION
          </span>

          <strong>
            {{ player.POSITION || '—' }}
          </strong>

        </article>

        <article class="cs-quick-card">

          <span>
            HEIGHT
          </span>

          <strong>
            {{ player.HEIGHT || '—' }}
          </strong>

        </article>

        <article class="cs-quick-card">

          <span>
            WEIGHT
          </span>

          <strong>
            {{ player.WEIGHT ? player.WEIGHT + ' LB' : '—' }}
          </strong>

        </article>

        <article class="cs-quick-card">

          <span>
            EXPERIENCE
          </span>

          <strong>
            {{
              player.SEASON_EXP != null
                ? player.SEASON_EXP + ' YRS'
                : '—'
            }}
          </strong>

        </article>

      </section>


      <!-- =====================================================
           PROFILE + DRAFT
           ===================================================== -->

      <section
        class="cs-info-grid"
        *ngIf="!loading && !error && player">

        <article class="cs-panel">

          <div class="cs-panel-head">

            <div>
              <span>
                01 / PLAYER FILE
              </span>

              <h2>
                THE BASICS.
              </h2>
            </div>

            <strong>
              01
            </strong>

          </div>

          <div class="cs-info-list">

            <div>
              <span>FULL NAME</span>
              <strong>
                {{ player.DISPLAY_FIRST_LAST || '—' }}
              </strong>
            </div>

            <div>
              <span>SCHOOL</span>
              <strong>
                {{ player.SCHOOL || '—' }}
              </strong>
            </div>

            <div>
              <span>COUNTRY</span>
              <strong>
                {{ player.COUNTRY || '—' }}
              </strong>
            </div>

            <div>
              <span>NBA DEBUT</span>
              <strong>
                {{ player.FROM_YEAR || '—' }}
              </strong>
            </div>

            <div>
              <span>TEAM</span>
              <strong>
                {{ teamLabel() }}
              </strong>
            </div>

            <div>
              <span>JERSEY</span>
              <strong>
                {{
                  player.JERSEY
                    ? '#' + player.JERSEY
                    : '—'
                }}
              </strong>
            </div>

          </div>

        </article>


        <article class="cs-panel cs-panel-dark">

          <div class="cs-panel-head">

            <div>
              <span>
                02 / DRAFT FILE
              </span>

              <h2>
                HOW HE ENTERED.
              </h2>
            </div>

            <strong>
              02
            </strong>

          </div>

          <div class="cs-draft-big">

            <div>

              <span>
                DRAFT YEAR
              </span>

              <strong>
                {{ player.DRAFT_YEAR || '—' }}
              </strong>

            </div>

            <div>

              <span>
                PICK
              </span>

              <strong>
                {{
                  player.DRAFT_NUMBER
                    ? '#' + player.DRAFT_NUMBER
                    : '—'
                }}
              </strong>

            </div>

          </div>

          <div class="cs-draft-meta">

            <div>
              <span>ROUND</span>
              <strong>
                {{
                  player.DRAFT_ROUND
                    ? 'ROUND ' + player.DRAFT_ROUND
                    : '—'
                }}
              </strong>
            </div>

            <div>
              <span>AFFILIATION</span>
              <strong>
                {{ player.LAST_AFFILIATION || '—' }}
              </strong>
            </div>

          </div>

        </article>

      </section>


      <!-- =====================================================
           CAREER STATS
           ===================================================== -->

      <section
        class="cs-career"
        *ngIf="!loading && !error && player">

        <div class="cs-section-heading">

          <div>

            <span>
              03 / CAREER REGULAR SEASON
            </span>

            <h2>
              THE NUMBERS.
            </h2>

            <p>
              Per-game regular-season statistics supplied by the
              NBA career endpoint.
            </p>

          </div>

          <div class="cs-season-count">

            <strong>
              {{ seasonStats.length }}
            </strong>

            <span>
              SEASONS
            </span>

          </div>

        </div>


        <div
          class="cs-no-stats"
          *ngIf="seasonStats.length === 0">

          <strong>
            00
          </strong>

          <div>
            <h3>
              NO SEASON TOTALS YET.
            </h3>

            <p>
              The NBA career endpoint returned no regular-season
              rows for this player.
            </p>
          </div>

        </div>


        <div
          class="cs-table-shell"
          *ngIf="seasonStats.length > 0">

          <div class="cs-table-scroll">

            <table class="cs-table">

              <thead>

                <tr>

                  <th>SEASON</th>
                  <th>TEAM</th>
                  <th>GP</th>
                  <th>GS</th>
                  <th>MIN</th>
                  <th>PTS</th>
                  <th>REB</th>
                  <th>AST</th>
                  <th>STL</th>
                  <th>BLK</th>
                  <th>FG%</th>
                  <th>3P%</th>
                  <th>FT%</th>

                </tr>

              </thead>

              <tbody>

                <tr
                  *ngFor="
                    let stat of seasonStats;
                    trackBy: trackSeason
                  ">

                  <td class="cs-season">
                    {{ stat.SEASON_ID || '—' }}
                  </td>

                  <td class="cs-team">
                    {{ stat.TEAM_ABBREVIATION || '—' }}
                  </td>

                  <td>
                    {{ value(stat.GP) }}
                  </td>

                  <td>
                    {{ value(stat.GS) }}
                  </td>

                  <td>
                    {{ value(stat.MIN) }}
                  </td>

                  <td class="cs-points">
                    {{ value(stat.PTS) }}
                  </td>

                  <td>
                    {{ value(stat.REB) }}
                  </td>

                  <td>
                    {{ value(stat.AST) }}
                  </td>

                  <td>
                    {{ value(stat.STL) }}
                  </td>

                  <td>
                    {{ value(stat.BLK) }}
                  </td>

                  <td>
                    {{ percentage(stat.FG_PCT) }}
                  </td>

                  <td>
                    {{ percentage(stat.FG3_PCT) }}
                  </td>

                  <td>
                    {{ percentage(stat.FT_PCT) }}
                  </td>

                </tr>

              </tbody>

            </table>

          </div>

        </div>

      </section>


            <!-- =====================================================
           PREVIOUS / NEXT PLAYER
           ===================================================== -->

      <section
        class="cs-player-navigation"
        *ngIf="!loading && !error && player">

        <a
          *ngIf="previousPlayer"
          class="cs-player-nav cs-player-nav-previous"
          [routerLink]="['/players', previousPlayer.PERSON_ID]"
          [attr.aria-label]="'Previous player: ' + (previousPlayer.DISPLAY_FIRST_LAST || previousPlayer.PERSON_ID)">

          <span class="cs-player-nav-arrow">
            ←
          </span>

          <span class="cs-player-nav-copy">

            <small>
              PREVIOUS PLAYER
            </small>

            <strong>
              {{
                previousPlayer.DISPLAY_FIRST_LAST ||
                (
                  (previousPlayer.FIRST_NAME || '') +
                  ' ' +
                  (previousPlayer.LAST_NAME || '')
                ).trim() ||
                'PLAYER'
              }}
            </strong>

            <em>
              {{ previousPlayer.TEAM_ABBREVIATION || 'NBA' }}
              ·
              {{ previousPlayer.PERSON_ID }}
            </em>

          </span>

        </a>

        <div
          *ngIf="!previousPlayer"
          class="cs-player-nav cs-player-nav-disabled">

          <span class="cs-player-nav-arrow">
            ←
          </span>

          <span class="cs-player-nav-copy">

            <small>
              PREVIOUS PLAYER
            </small>

            <strong>
              START OF DIRECTORY
            </strong>

          </span>

        </div>


        <a
          *ngIf="nextPlayer"
          class="cs-player-nav cs-player-nav-next"
          [routerLink]="['/players', nextPlayer.PERSON_ID]"
          [attr.aria-label]="'Next player: ' + (nextPlayer.DISPLAY_FIRST_LAST || nextPlayer.PERSON_ID)">

          <span class="cs-player-nav-copy">

            <small>
              NEXT PLAYER
            </small>

            <strong>
              {{
                nextPlayer.DISPLAY_FIRST_LAST ||
                (
                  (nextPlayer.FIRST_NAME || '') +
                  ' ' +
                  (nextPlayer.LAST_NAME || '')
                ).trim() ||
                'PLAYER'
              }}
            </strong>

            <em>
              {{ nextPlayer.TEAM_ABBREVIATION || 'NBA' }}
              ·
              {{ nextPlayer.PERSON_ID }}
            </em>

          </span>

          <span class="cs-player-nav-arrow">
            →
          </span>

        </a>

        <div
          *ngIf="!nextPlayer"
          class="cs-player-nav cs-player-nav-disabled">

          <span class="cs-player-nav-copy">

            <small>
              NEXT PLAYER
            </small>

            <strong>
              END OF DIRECTORY
            </strong>

          </span>

          <span class="cs-player-nav-arrow">
            →
          </span>

        </div>

      </section>
<!-- =====================================================
           FOOTER DATA RULE
           ===================================================== -->

      <section
        class="cs-data-rule"
        *ngIf="!loading && !error && player">

        <div class="cs-rule-mark">
          !
        </div>

        <div>

          <span>
            COURTSIDE DATA RULE
          </span>

          <h2>
            NO NUMBERS.<br>
            NO INVENTION.
          </h2>

          <p>
            Player information and statistics shown here come
            from the NBA data feed through the COURTSIDE API.
            If the NBA does not provide a value, COURTSIDE leaves
            it unavailable rather than manufacturing a number.
          </p>

        </div>

        <div class="cs-rule-brand">
          COURTSIDE
          <small>
            REAL NBA DATA
          </small>
        </div>

      </section>


      <!-- =====================================================
           STYLES
           ===================================================== -->

      

  `
})
export class PlayerDetailComponent
  implements OnInit, OnDestroy {

  player: PlayerInfo | null = null;

  seasonStats: SeasonStat[] = [];

  directoryPlayers: DirectoryPlayer[] = [];

  previousPlayer: DirectoryPlayer | null = null;

  nextPlayer: DirectoryPlayer | null = null;

  loading = true;

  error = false;

  personId = '';

  season = '—';

  dataStatus = 'fresh';

  cached = false;

  cachedAt: string | null = null;

  staleAgeSeconds = 0;

  private routeSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private nba: NbaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {

    this.routeSubscription =
      this.route.paramMap.subscribe(params => {

        this.personId =
          params.get('id') || '';

        this.loadPlayer();
    this.loadPlayerDirectory();

      });

  }

  ngOnDestroy(): void {

    this.routeSubscription?.unsubscribe();

  }

  loadPlayerDirectory(): void {

    this.nba
      .getPlayers()
      .subscribe({

        next: (response: any) => {

          const players =
            Array.isArray(response?.players)
              ? response.players
              : [];

          this.directoryPlayers =
            players
              .filter(
                (player: DirectoryPlayer) =>
                  player?.PERSON_ID != null
              )
              .sort(
                (a: DirectoryPlayer, b: DirectoryPlayer) =>
                  String(a.PERSON_ID)
                    .localeCompare(
                      String(b.PERSON_ID),
                      undefined,
                      { numeric: true }
                    )
              );

          this.updatePlayerNavigation();

          this.cdr.detectChanges();

          console.log(
            'COURTSIDE: Player directory loaded:',
            this.directoryPlayers.length,
            'players'
          );

        },

        error: (error: any) => {

          console.error(
            'COURTSIDE: Player directory error:',
            error
          );

          this.directoryPlayers = [];

          this.previousPlayer = null;

          this.nextPlayer = null;

          this.cdr.detectChanges();

        }

      });

  }

  updatePlayerNavigation(): void {

    this.previousPlayer = null;

    this.nextPlayer = null;

    if (
      !this.personId ||
      this.directoryPlayers.length === 0
    ) {
      return;
    }

    const currentIndex =
      this.directoryPlayers.findIndex(
        (player: DirectoryPlayer) =>
          String(player.PERSON_ID) ===
          String(this.personId)
      );

    if (currentIndex === -1) {
      return;
    }

    if (currentIndex > 0) {

      this.previousPlayer =
        this.directoryPlayers[currentIndex - 1];

    }

    if (
      currentIndex <
      this.directoryPlayers.length - 1
    ) {

      this.nextPlayer =
        this.directoryPlayers[currentIndex + 1];

    }

  }
  loadPlayer(): void {

    if (!/^\d+$/.test(this.personId)) {

      this.player = null;
      this.seasonStats = [];
      this.loading = false;
      this.error = true;

      this.cdr.detectChanges();

      return;

    }

    this.loading = true;
    this.error = false;

    this.nba
      .getPlayer(this.personId)
      .subscribe({

        next: (response: any) => {

          this.season =
            response?.season ||
            '—';

          this.dataStatus =
            response?.dataStatus ||
            'fresh';

          this.cached =
            response?.cached === true;

          this.cachedAt =
            response?.cachedAt ||
            null;

          this.staleAgeSeconds =
            Number(
              response?.staleAgeSeconds || 0
            );

          this.player =
            response?.player || null;

          this.seasonStats =
            Array.isArray(
              response?.seasonStats
            )
              ? response.seasonStats
              : [];

          this.loading = false;

          this.error =
            !this.player;

          this.cdr.detectChanges();

          console.log(
            'COURTSIDE: Player detail loaded:',
            this.player?.DISPLAY_FIRST_LAST,
            this.seasonStats.length,
            'season rows'
          );

        },

        error: (error: any) => {

          console.error(
            'COURTSIDE: Player detail error:',
            error
          );

          this.player = null;
          this.seasonStats = [];
          this.loading = false;
          this.error = true;

          this.cdr.detectChanges();

        }

      });

  }

  teamLabel(): string {

    if (!this.player) {
      return 'NBA';
    }

    const city =
      String(
        this.player.TEAM_CITY || ''
      ).trim();

    const team =
      String(
        this.player.TEAM_NAME || ''
      ).trim();

    return [
      city,
      team
    ]
      .filter(Boolean)
      .join(' ') || 'NBA';

  }

  value(value: number | undefined): string {

    return value == null
      ? '—'
      : String(value);

  }

  percentage(value: number | undefined): string {

    if (value == null) {
      return '—';
    }

    return (
      Number(value) * 100
    ).toFixed(1) + '%';

  }

  trackSeason(
    index: number,
    stat: SeasonStat
  ): string {

    return [
      stat.SEASON_ID || '',
      stat.TEAM_ABBREVIATION || '',
      index
    ].join('-');

  }

}






