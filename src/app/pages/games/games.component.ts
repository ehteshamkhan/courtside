import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { NbaService } from '../../services/nba.service';
import {
  ScoreboardGame,
  ScoreboardResponse,
  ScoreStatus
} from '../../models/scoreboard.models';

@Component({
  selector: 'app-games',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <main class="cs-page cs-games-page">

      <section class="cs-hero">
        <div>
          <p class="cs-kicker">COURTSIDE / GAME CENTER</p>
          <h1>GAMES</h1>
          <p class="cs-hero-copy">
            Browse real NBA games by date and inspect every available score detail.
          </p>
        </div>

        <div class="cs-hero-badge">
          {{ games.length }} GAME{{ games.length === 1 ? '' : 'S' }}
        </div>
      </section>

      <section class="cs-toolbar" aria-label="Game date controls">
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
            (change)="loadGames()"
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
          (click)="loadGames(true)"
          [disabled]="loading">
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
          <span class="cs-strip-label">TOTAL</span>
          <strong>{{ games.length }}</strong>
        </div>

        <div>
          <span class="cs-strip-label">LIVE</span>
          <strong>{{ countByStatus('live') }}</strong>
        </div>

        <div>
          <span class="cs-strip-label">FINAL</span>
          <strong>{{ countByStatus('final') }}</strong>
        </div>
      </section>

      <section
        *ngIf="loading"
        class="cs-state-card"
        aria-live="polite"
        aria-busy="true">
        <span class="cs-spinner" aria-hidden="true"></span>
        <div>
          <h2>LOADING GAME CENTER</h2>
          <p>Retrieving the NBA schedule for {{ formattedDate }}.</p>
        </div>
      </section>

      <section
        *ngIf="!loading && errorMessage"
        class="cs-state-card cs-state-error"
        role="alert">
        <div>
          <p class="cs-state-code">DATA ERROR</p>
          <h2>GAME CENTER UNAVAILABLE</h2>
          <p>{{ errorMessage }}</p>
        </div>

        <button
          type="button"
          class="cs-control-button"
          (click)="loadGames(true)">
          TRY AGAIN
        </button>
      </section>

      <section
        *ngIf="!loading && !errorMessage && games.length === 0"
        class="cs-state-card cs-state-empty">
        <div>
          <p class="cs-state-code">NO GAMES</p>
          <h2>NO MATCHUPS FOUND</h2>
          <p>
            The NBA scoreboard returned no games for this date.
          </p>
        </div>
      </section>

      <section
        *ngIf="!loading && !errorMessage && games.length > 0"
        class="cs-game-list"
        aria-label="NBA game list">

        <article
          *ngFor="let game of games; trackBy: trackGame"
          class="cs-game-row"
          [class.cs-game-live]="statusFor(game) === 'live'">

          <div class="cs-game-row-status">
            <span
              class="cs-game-status"
              [class.cs-status-live]="statusFor(game) === 'live'">
              {{ displayStatus(game) }}
            </span>

            <small>
              {{ displayTime(game) }}
            </small>
          </div>

          <div class="cs-game-row-matchup">

            <div class="cs-game-row-team">
              <span class="cs-team-mark-small" aria-hidden="true">
                {{ game.awayTeam.teamTricode }}
              </span>

              <div>
                <strong>
                  {{ game.awayTeam.teamCity }}
                  {{ game.awayTeam.teamName }}
                </strong>

                <span>{{ game.awayTeam.teamTricode }}</span>
              </div>

              <strong
                *ngIf="showScore(game)"
                class="cs-row-score">
                {{ game.awayTeam.score }}
              </strong>
            </div>

            <span class="cs-at">@</span>

            <div class="cs-game-row-team">
              <span class="cs-team-mark-small" aria-hidden="true">
                {{ game.homeTeam.teamTricode }}
              </span>

              <div>
                <strong>
                  {{ game.homeTeam.teamCity }}
                  {{ game.homeTeam.teamName }}
                </strong>

                <span>{{ game.homeTeam.teamTricode }}</span>
              </div>

              <strong
                *ngIf="showScore(game)"
                class="cs-row-score">
                {{ game.homeTeam.score }}
              </strong>
            </div>
          </div>

          <div class="cs-game-row-meta">
            <span *ngIf="game.gameLabel">
              {{ game.gameLabel }}
            </span>

            <span *ngIf="game.gameSubLabel">
              {{ game.gameSubLabel }}
            </span>

            <span>
              {{ game.gameId }}
            </span>
          </div>

        </article>

      </section>

      <footer class="cs-page-footer">
        <span>
          Last checked:
          {{ lastUpdatedLabel || 'Not yet checked' }}
        </span>

        <span>
          Source:
          NBA scoreboard API
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
export class GamesComponent implements OnInit, OnDestroy {

  selectedDate = this.today();

  games: ScoreboardGame[] = [];

  loading = false;
  errorMessage = '';
  lastUpdatedLabel = '';

  private requestSubscription?: Subscription;

  constructor(private nba: NbaService) {}

  ngOnInit(): void {
    this.loadGames();
  }

  ngOnDestroy(): void {
    this.requestSubscription?.unsubscribe();
  }

  loadGames(forceRefresh = false): void {
    if (this.loading && !forceRefresh) {
      return;
    }

    this.requestSubscription?.unsubscribe();

    this.loading = true;
    this.errorMessage = '';

    this.requestSubscription = this.nba
      .getScoreboard(this.selectedDate)
      .subscribe({
        next: (response: ScoreboardResponse) => {
          this.games = Array.isArray(response?.scoreboard?.games)
            ? response.scoreboard.games
            : [];

          this.lastUpdatedLabel = new Date().toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit'
          });

          this.loading = false;
        },

        error: () => {
          this.loading = false;
          this.errorMessage =
            'The NBA game center could not retrieve the selected date.';
        }
      });
  }

  changeDate(offset: number): void {
    const current = this.parseDate(this.selectedDate);

    current.setDate(current.getDate() + offset);

    this.selectedDate = this.formatDate(current);

    this.loadGames();
  }

  trackGame(_index: number, game: ScoreboardGame): string {
    return game.gameId;
  }

  get formattedDate(): string {
    return this.parseDate(this.selectedDate).toLocaleDateString([], {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }

  countByStatus(status: ScoreStatus): number {
    return this.games.filter(game => this.statusFor(game) === status).length;
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
      return game.gameClock
        ? `LIVE · Q${game.period || 0}`
        : 'LIVE';
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

    return game.gameStatusText || 'SCHEDULED';
  }

  displayTime(game: ScoreboardGame): string {
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

  showScore(game: ScoreboardGame): boolean {
    return (
      this.statusFor(game) === 'live' ||
      this.statusFor(game) === 'final'
    );
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
