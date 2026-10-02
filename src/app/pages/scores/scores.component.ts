import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { NbaService } from '../../services/nba.service';
import {
  ScoreboardGame,
  ScoreboardResponse,
  ScoreStatus
} from '../../models/scoreboard.models';

@Component({
  selector: 'app-scores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <main class="cs-page cs-scores-page">

      <section class="cs-hero">
        <div>
          <p class="cs-kicker">COURTSIDE / LIVE</p>
          <h1>SCORES</h1>
          <p class="cs-hero-copy">
            Real NBA game status, scores and period breakdowns.
          </p>
        </div>

        <div class="cs-hero-badge">
          <span class="cs-live-dot" aria-hidden="true"></span>
          LIVE DATA
        </div>
      </section>

      <section class="cs-toolbar" aria-label="Score controls">
        <button
          type="button"
          class="cs-control-button"
          (click)="changeDate(-1)"
          [disabled]="loading">
          <span aria-hidden="true">←</span>
          PREVIOUS
        </button>

        <label class="cs-date-control">
          <span>GAME DATE</span>
          <input
            type="date"
            [(ngModel)]="selectedDate"
            (change)="loadScores()"
            [disabled]="loading"
            aria-label="Select game date">
        </label>

        <button
          type="button"
          class="cs-control-button"
          (click)="changeDate(1)"
          [disabled]="loading">
          NEXT
          <span aria-hidden="true">→</span>
        </button>

        <button
          type="button"
          class="cs-refresh-button"
          (click)="loadScores(true)"
          [disabled]="loading"
          aria-label="Refresh scores">
          <span aria-hidden="true">↻</span>
          {{ loading ? 'LOADING' : 'REFRESH' }}
        </button>
      </section>

      <section class="cs-data-strip" aria-live="polite">
        <div>
          <span class="cs-strip-label">DATE</span>
          <strong>{{ formattedDate }}</strong>
        </div>

        <div>
          <span class="cs-strip-label">GAMES</span>
          <strong>{{ games.length }}</strong>
        </div>

        <div>
          <span class="cs-strip-label">LIVE</span>
          <strong>{{ liveGamesCount }}</strong>
        </div>

        <div>
          <span class="cs-strip-label">DATA</span>
          <strong>{{ dataFreshness }}</strong>
        </div>
      </section>

      <section
        *ngIf="loading"
        class="cs-state-card"
        aria-live="polite"
        aria-busy="true">
        <span class="cs-spinner" aria-hidden="true"></span>
        <div>
          <h2>LOADING SCOREBOARD</h2>
          <p>Checking the NBA scoreboard...</p>
        </div>
      </section>

      <section
        *ngIf="!loading && errorMessage"
        class="cs-state-card cs-state-error"
        role="alert">
        <div>
          <p class="cs-state-code">DATA ERROR</p>
          <h2>COULDN'T LOAD SCORES</h2>
          <p>{{ errorMessage }}</p>
        </div>

        <button
          type="button"
          class="cs-control-button"
          (click)="loadScores(true)">
          TRY AGAIN
        </button>
      </section>

      <section
        *ngIf="!loading && !errorMessage && games.length === 0"
        class="cs-state-card cs-state-empty"
        aria-live="polite">
        <div>
          <p class="cs-state-code">NO GAMES</p>
          <h2>QUIET NIGHT</h2>
          <p>
            The NBA scoreboard has no games scheduled for this date.
          </p>
        </div>
      </section>

      <section
        *ngIf="!loading && !errorMessage && games.length > 0"
        class="cs-score-grid"
        aria-label="NBA scores">

        <article
          *ngFor="let game of games; trackBy: trackGame"
          class="cs-game-card"
          [class.cs-game-live]="statusFor(game) === 'live'"
          [class.cs-game-final]="statusFor(game) === 'final'"
          [class.cs-game-special]="isSpecialStatus(game)">

          <header class="cs-game-header">
            <div>
              <span class="cs-game-status"
                    [class.cs-status-live]="statusFor(game) === 'live'">
                {{ displayStatus(game) }}
              </span>

              <span
                *ngIf="game.gameLabel || game.gameSubLabel"
                class="cs-game-label">
                {{ game.gameLabel }}
                <span *ngIf="game.gameSubLabel">
                  · {{ game.gameSubLabel }}
                </span>
              </span>
            </div>

            <div class="cs-game-time">
              {{ displayGameTime(game) }}
            </div>
          </header>

          <div class="cs-matchup">

            <div class="cs-team">
              <div class="cs-team-mark" aria-hidden="true">
                {{ game.awayTeam.teamTricode || 'AWY' }}
              </div>

              <div class="cs-team-info">
                <strong>
                  {{ game.awayTeam.teamCity }}
                  {{ game.awayTeam.teamName }}
                </strong>
                <span>{{ game.awayTeam.teamTricode }}</span>
              </div>

              <div
                *ngIf="hasScore(game)"
                class="cs-team-score">
                {{ game.awayTeam.score }}
              </div>
            </div>

            <div class="cs-at">
              @
            </div>

            <div class="cs-team">
              <div class="cs-team-mark" aria-hidden="true">
                {{ game.homeTeam.teamTricode || 'HME' }}
              </div>

              <div class="cs-team-info">
                <strong>
                  {{ game.homeTeam.teamCity }}
                  {{ game.homeTeam.teamName }}
                </strong>
                <span>{{ game.homeTeam.teamTricode }}</span>
              </div>

              <div
                *ngIf="hasScore(game)"
                class="cs-team-score">
                {{ game.homeTeam.score }}
              </div>
            </div>
          </div>

          <div
            *ngIf="statusFor(game) === 'live'"
            class="cs-live-banner"
            aria-live="polite">
            <span class="cs-live-dot" aria-hidden="true"></span>
            {{ livePeriodLabel(game) }}
            <strong *ngIf="game.gameClock">
              {{ game.gameClock }}
            </strong>
          </div>

          <div
            *ngIf="hasPeriods(game)"
            class="cs-periods"
            aria-label="Period scores">

            <div class="cs-period-heading">
              <span>TEAM</span>
              <span *ngFor="let period of periodColumns(game)">
                {{ periodLabel(period) }}
              </span>
              <span>FINAL</span>
            </div>

            <div class="cs-period-row">
              <span>{{ game.awayTeam.teamTricode }}</span>

              <span *ngFor="let period of periodColumns(game)">
                {{ periodScore(game.awayTeam, period) }}
              </span>

              <strong>{{ game.awayTeam.score }}</strong>
            </div>

            <div class="cs-period-row">
              <span>{{ game.homeTeam.teamTricode }}</span>

              <span *ngFor="let period of periodColumns(game)">
                {{ periodScore(game.homeTeam, period) }}
              </span>

              <strong>{{ game.homeTeam.score }}</strong>
            </div>
          </div>

          <footer class="cs-game-footer">
            <span>GAME ID {{ game.gameId }}</span>

            <span *ngIf="game.broadcasters?.nationalBroadcasters?.length">
              {{ game.broadcasters.nationalBroadcasters[0].broadcastDisplay }}
            </span>
          </footer>

        </article>
      </section>

      <footer class="cs-page-footer">
        <span>
          Last checked:
          {{ lastUpdatedLabel || 'Not yet checked' }}
        </span>

        <span>
          Auto-refresh:
          {{ pollingActive ? 'ON' : 'OFF' }}
        </span>
      </footer>

    </main>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class ScoresComponent implements OnInit, OnDestroy {

  selectedDate = this.today();

  games: ScoreboardGame[] = [];

  loading = false;
  errorMessage = '';

  dataFreshness = 'UNKNOWN';
  lastUpdatedLabel = '';

  pollingActive = false;

  private pollSubscription?: Subscription;

  constructor(private nba: NbaService) {}

  ngOnInit(): void {
    this.loadScores();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  loadScores(forceRefresh = false): void {
    if (this.loading && !forceRefresh) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.nba.getScoreboard(this.selectedDate).subscribe({
      next: (response: ScoreboardResponse) => {
        this.games = Array.isArray(response?.scoreboard?.games)
          ? response.scoreboard.games
          : [];

        this.dataFreshness = 'FRESH';
        this.lastUpdatedLabel = new Date().toLocaleTimeString([], {
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit'
        });

        this.loading = false;
        this.updatePolling();
      },

      error: () => {
        this.loading = false;
        this.errorMessage =
          'The NBA scoreboard service did not return usable data.';

        this.dataFreshness = 'UNAVAILABLE';
        this.stopPolling();
      }
    });
  }

  changeDate(offset: number): void {
    const current = this.parseDate(this.selectedDate);

    current.setDate(current.getDate() + offset);

    this.selectedDate = this.formatDate(current);

    this.loadScores();
  }

  trackGame(_index: number, game: ScoreboardGame): string {
    return game.gameId;
  }

  get formattedDate(): string {
    const parsed = this.parseDate(this.selectedDate);

    return parsed.toLocaleDateString([], {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }

  get liveGamesCount(): number {
    return this.games.filter(game => this.statusFor(game) === 'live').length;
  }

  statusFor(game: ScoreboardGame): ScoreStatus {
    const status = Number(game?.gameStatus);

    if (status === 1) {
      return 'scheduled';
    }

    if (status === 2) {
      return 'live';
    }

    if (status === 3) {
      return 'final';
    }

    const text = String(game?.gameStatusText || '').toLowerCase();

    if (text.includes('postpon')) {
      return 'postponed';
    }

    if (text.includes('cancel')) {
      return 'canceled';
    }

    if (text.includes('delay')) {
      return 'delayed';
    }

    return 'unknown';
  }

  displayStatus(game: ScoreboardGame): string {
    const status = this.statusFor(game);

    if (status === 'live') {
      return 'LIVE';
    }

    if (status === 'final') {
      return 'FINAL';
    }

    if (status === 'postponed') {
      return 'POSTPONED';
    }

    if (status === 'canceled') {
      return 'CANCELED';
    }

    if (status === 'delayed') {
      return 'DELAYED';
    }

    if (status === 'scheduled') {
      return game.gameStatusText || 'SCHEDULED';
    }

    return game.gameStatusText || 'STATUS UNKNOWN';
  }

  displayGameTime(game: ScoreboardGame): string {
    if (this.statusFor(game) === 'live') {
      return game.gameClock || '';
    }

    if (game.gameTimeUTC) {
      const date = new Date(game.gameTimeUTC);

      if (!Number.isNaN(date.getTime())) {
        return date.toLocaleTimeString([], {
          hour: 'numeric',
          minute: '2-digit'
        });
      }
    }

    return game.gameStatusText || '';
  }

  livePeriodLabel(game: ScoreboardGame): string {
    if (game.period <= 0) {
      return 'LIVE';
    }

    if (game.period <= 4) {
      return `Q${game.period}`;
    }

    return `OT${game.period - 4 > 1 ? game.period - 4 : ''}`;
  }

  hasScore(game: ScoreboardGame): boolean {
    return (
      this.statusFor(game) === 'live' ||
      this.statusFor(game) === 'final' ||
      Number(game.awayTeam?.score) > 0 ||
      Number(game.homeTeam?.score) > 0
    );
  }

  hasPeriods(game: ScoreboardGame): boolean {
    return (
      Array.isArray(game?.awayTeam?.periods) &&
      Array.isArray(game?.homeTeam?.periods) &&
      (
        game.awayTeam.periods.length > 0 ||
        game.homeTeam.periods.length > 0
      )
    );
  }

  periodColumns(game: ScoreboardGame): number[] {
    const values = [
      ...(game.awayTeam?.periods || []).map(p => p.period),
      ...(game.homeTeam?.periods || []).map(p => p.period)
    ];

    return [...new Set(values)].sort((a, b) => a - b);
  }

  periodLabel(period: number): string {
    return period <= 4
      ? `Q${period}`
      : `OT${period - 4 > 1 ? period - 4 : ''}`;
  }

  periodScore(
    team: ScoreboardGame['homeTeam'],
    period: number
  ): number | string {
    const found = team.periods?.find(item => item.period === period);

    return found ? found.score : '—';
  }

  isSpecialStatus(game: ScoreboardGame): boolean {
    const status = this.statusFor(game);

    return (
      status === 'postponed' ||
      status === 'canceled' ||
      status === 'delayed'
    );
  }

  private updatePolling(): void {
    const shouldPoll =
      this.selectedDate === this.today() &&
      this.liveGamesCount > 0;

    if (!shouldPoll) {
      this.stopPolling();
      return;
    }

    if (this.pollSubscription) {
      this.pollingActive = true;
      return;
    }

    this.pollingActive = true;

    this.pollSubscription = timer(30000, 30000)
      .pipe(
        switchMap(() => this.nba.getScoreboard(this.selectedDate))
      )
      .subscribe({
        next: response => {
          this.games = Array.isArray(response?.scoreboard?.games)
            ? response.scoreboard.games
            : [];

          this.dataFreshness = 'FRESH';
          this.lastUpdatedLabel = new Date().toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit'
          });

          if (this.liveGamesCount === 0) {
            this.stopPolling();
          }
        },
        error: () => {
          this.dataFreshness = 'RETRYING';
        }
      });
  }

  private stopPolling(): void {
    this.pollSubscription?.unsubscribe();
    this.pollSubscription = undefined;
    this.pollingActive = false;
  }

  private today(): string {
    return this.formatDate(new Date());
  }

  private parseDate(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);

    return new Date(year, month - 1, day);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
