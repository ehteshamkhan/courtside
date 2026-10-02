import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NbaService } from '../../services/nba.service';

interface ScheduleGame {
  gameId?: string;
  gameStatus?: number;
  gameStatusText?: string;
  gameTimeUTC?: string;
  gameTimeLocal?: string;
  arena?: string;
  homeTeam?: {
    teamId?: number;
    teamName?: string;
    teamCity?: string;
    teamTricode?: string;
    score?: number;
    wins?: number;
    losses?: number;
  };
  awayTeam?: {
    teamId?: number;
    teamName?: string;
    teamCity?: string;
    teamTricode?: string;
    score?: number;
    wins?: number;
    losses?: number;
  };
}

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [DatePipe],
  template: `
    <main class="schedule-page">

      <!-- =====================================================
           HERO
           ===================================================== -->

      <section class="schedule-hero">

        <div class="schedule-hero-copy">

          <div class="schedule-kicker">
            THE NEXT TIP
          </div>

          <h1>
            THE<br>
            <span>SCHEDULE.</span>
          </h1>

          <p>
            Yesterday. Today. Tomorrow.
            Every NBA game on the board.
          </p>

          <div class="schedule-signature">
            <span>COURTSIDE</span>
            <strong>A YUSUF A. KHAN PROJECT</strong>
          </div>

        </div>

        <div class="schedule-calendar" aria-hidden="true">

          <div class="calendar-top">
            NBA
          </div>

          <div class="calendar-date">
            <span>{{ selectedDate | date:'MMM' }}</span>
            <strong>{{ selectedDate | date:'dd' }}</strong>
            <small>{{ selectedDate | date:'yyyy' }}</small>
          </div>

          <div class="calendar-lines">
            <i></i>
            <i></i>
            <i></i>
          </div>

        </div>

        <div class="schedule-sticker">
          <span>3 DAY SHORTCUT</span>
          
        </div>

      </section>

      <!-- =====================================================
           DATE NAVIGATION
           ===================================================== -->

      <section class="schedule-nav-section">

        <div class="schedule-nav-heading">
          <span class="eyebrow">GAME CALENDAR</span>
          <h2>PICK A DAY.</h2>
        </div>

        <div class="day-navigation">

          <button
            type="button"
            class="day-button"
            [class.active]="isSelectedOffset(-1)"
            (click)="selectOffset(-1)">

            <span>YESTERDAY</span>
            <strong>{{ getDateForOffset(-1) | date:'MMM d' }}</strong>

          </button>

          <button
            type="button"
            class="day-button today-button"
            [class.active]="isSelectedOffset(0)"
            (click)="selectOffset(0)">

            <span>TODAY</span>
            <strong>{{ getDateForOffset(0) | date:'MMM d' }}</strong>

          </button>

          <button
            type="button"
            class="day-button"
            [class.active]="isSelectedOffset(1)"
            (click)="selectOffset(1)">

            <span>TOMORROW</span>
            <strong>{{ getDateForOffset(1) | date:'MMM d' }}</strong>

          </button>

        </div>

        <div class="date-controls">

          <button
            type="button"
            class="arrow-button"
            (click)="moveDay(-1)"
            aria-label="Previous day">
            ←
          </button>

          <div class="selected-date">

            <span class="eyebrow">SELECTED DATE</span>

            <strong>
              {{ selectedDate | date:'EEEE, MMMM d, y' }}
            </strong>

            <small>
              {{ selectedDateKey }}
            </small>

          </div>

          <button
            type="button"
            class="arrow-button"
            (click)="moveDay(1)"
            aria-label="Next day">
            →
          </button>

        </div>

      </section>

      <!-- =====================================================
           DATA STATUS
           ===================================================== -->

      <section class="schedule-status-bar">

        <div>
          <span class="eyebrow">COURTSIDE SCHEDULE FEED</span>
          <strong>
            {{ games.length }}
            GAME{{ games.length === 1 ? '' : 'S' }}
          </strong>
        </div>

        <div class="feed-status">
          <span class="pulse-dot"></span>
          NBA DATA
        </div>

      </section>

      <!-- =====================================================
           LOADING
           ===================================================== -->

      @if (loading) {

        <section class="schedule-state loading-state">

          <div class="state-number">01</div>

          <div>
            <span class="eyebrow">PLEASE WAIT</span>
            <h2>LOADING THE BOARD...</h2>
            <p>
              Pulling the NBA schedule for
              {{ selectedDate | date:'MMMM d, y' }}.
            </p>
          </div>

        </section>

      }

      <!-- =====================================================
           ERROR
           ===================================================== -->

      @if (!loading && error) {

        <section class="schedule-state error-state">

          <div class="state-number">!</div>

          <div>
            <span class="eyebrow">FEED ERROR</span>
            <h2>WE LOST THE BOARD.</h2>
            <p>{{ error }}</p>

            <button
              type="button"
              class="retry-button"
              (click)="loadSchedule()">
              TRY AGAIN
            </button>
          </div>

        </section>

      }

      <!-- =====================================================
           EMPTY
           ===================================================== -->

      @if (!loading && !error && games.length === 0) {

        <section class="schedule-empty">

          <div class="empty-number">
            00
          </div>

          <div class="empty-copy">

            <span class="eyebrow">
              {{ selectedDate | date:'MMMM d, y' }}
            </span>

            <h2>
              NO GAMES
              <br>
              ON THE BOARD.
            </h2>

            <p>
              The NBA feed returned no games for this date.
              COURTSIDE keeps the schedule honest instead of
              filling empty space with fake matchups.
            </p>

            <div class="empty-badge">
              <span class="pulse-dot"></span>
              REAL NBA DATA
            </div>

          </div>

        </section>

      }

      <!-- =====================================================
           GAMES
           ===================================================== -->

      @if (!loading && !error && games.length > 0) {

        <section class="schedule-games">

          <div class="games-heading">

            <div>
              <span class="eyebrow">
                {{ selectedDate | date:'EEEE' }}
              </span>

              <h2>
                GAME DAY.
              </h2>
            </div>

            <div class="games-count">
              {{ games.length }}
              <span>
                {{ games.length === 1 ? 'MATCHUP' : 'MATCHUPS' }}
              </span>
            </div>

          </div>

          <div class="schedule-grid">

            @for (
              game of games;
              track game.gameId || $index
            ) {

              <article
                class="schedule-card"
                [class.card-live]="isLive(game)"
                [class.card-final]="isFinal(game)"
                [class.card-scheduled]="isScheduled(game)">

                <header class="schedule-card-header">

                  <span class="game-index">
                    GAME {{ $index + 1 }}
                  </span>

                  <span
                    class="schedule-status"
                    [class.live]="isLive(game)"
                    [class.final]="isFinal(game)"
                    [class.scheduled]="isScheduled(game)">

                    <span class="status-dot"></span>

                    {{ displayStatus(game) }}

                  </span>

                </header>

                <div class="schedule-matchup">

                  <!-- AWAY -->

                  <div class="schedule-team">

                    <div class="schedule-team-mark">
                      {{ game.awayTeam?.teamTricode || 'AWY' }}
                    </div>

                    <div class="schedule-team-name">
                      <span>
                        {{ game.awayTeam?.teamCity || 'AWAY' }}
                      </span>

                      <strong>
                        {{ game.awayTeam?.teamName || 'TEAM' }}
                      </strong>
                    </div>

                    <div class="schedule-team-score">
                      {{ scoreDisplay(game.awayTeam?.score, game) }}
                    </div>

                  </div>

                  <div class="schedule-vs">
                    <span>VS</span>
                  </div>

                  <!-- HOME -->

                  <div class="schedule-team">

                    <div class="schedule-team-mark home-mark">
                      {{ game.homeTeam?.teamTricode || 'HME' }}
                    </div>

                    <div class="schedule-team-name">
                      <span>
                        {{ game.homeTeam?.teamCity || 'HOME' }}
                      </span>

                      <strong>
                        {{ game.homeTeam?.teamName || 'TEAM' }}
                      </strong>
                    </div>

                    <div class="schedule-team-score">
                      {{ scoreDisplay(game.homeTeam?.score, game) }}
                    </div>

                  </div>

                </div>

                <footer class="schedule-card-footer">

                  <div>
                    <span class="footer-label">TIME</span>
                    <strong>
                      {{ game.gameTimeLocal || game.gameTimeUTC || 'TBD' }}
                    </strong>
                  </div>

                  @if (game.arena) {

                    <div class="arena-info">
                      <span class="footer-label">ARENA</span>
                      <strong>{{ game.arena }}</strong>
                    </div>

                  }

                </footer>

              </article>

            }

          </div>

        </section>

      }

      <!-- =====================================================
           FOOTNOTE
           ===================================================== -->

      <section class="schedule-note">

        <div class="note-icon">
          !
        </div>

        <div>

          <span class="eyebrow">
            COURTSIDE DATA RULE
          </span>

          <h3>
            THE CALENDAR DOESN'T MAKE UP GAMES.
          </h3>

          <p>
            Every matchup shown here comes from the NBA scoreboard feed.
            Scheduled, live, final, or empty — the page reflects the
            returned data.
          </p>

        </div>

      </section>

    </main>
  `,

  styles: []
})
export class ScheduleComponent implements OnInit {

  today = this.startOfDay(new Date());

  selectedDate = this.today;
  selectedDateKey = this.toDateKey(this.today);

  games: ScheduleGame[] = [];

  loading = true;
  error = '';

  constructor(
    private nba: NbaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadSchedule();
  }

  loadSchedule(): void {

    this.loading = true;
    this.error = '';

    const dateKey = this.toDateKey(this.selectedDate);

    this.selectedDateKey = dateKey;

    console.log(
      'COURTSIDE: LOADING SCHEDULE FOR:',
      dateKey
    );

    this.nba.getScoreboard(dateKey).subscribe({

      next: (response: any) => {

        console.log(
          'COURTSIDE: SCHEDULE RESPONSE:',
          response
        );

        this.games = this.normalizeGames(response);

        console.log(
          'COURTSIDE: SCHEDULE GAME COUNT:',
          this.games.length
        );

        this.loading = false;

        this.cdr.detectChanges();
      },

      error: (err) => {

        console.error(
          'COURTSIDE: SCHEDULE ERROR:',
          err
        );

        this.games = [];

        this.loading = false;

        this.error =
          'We could not retrieve the NBA schedule for this date.';

        this.cdr.detectChanges();
      }

    });
  }

  selectOffset(offset: number): void {

    const date = new Date(this.today);

    date.setDate(
      date.getDate() + offset
    );

    this.selectedDate =
      this.startOfDay(date);

    this.loadSchedule();
  }

  moveDay(direction: number): void {

    const date = new Date(this.selectedDate);

    date.setDate(
      date.getDate() + direction
    );

    this.selectedDate =
      this.startOfDay(date);

    this.loadSchedule();
  }

  getDateForOffset(offset: number): Date {

    const date = new Date(this.today);

    date.setDate(
      date.getDate() + offset
    );

    return this.startOfDay(date);
  }

  isSelectedOffset(offset: number): boolean {

    return (
      this.toDateKey(
        this.getDateForOffset(offset)
      ) === this.selectedDateKey
    );
  }

  private startOfDay(date: Date): Date {

    const result = new Date(date);

    result.setHours(
      0,
      0,
      0,
      0
    );

    return result;
  }

  private toDateKey(date: Date): string {

    const year = date.getFullYear();

    const month = String(
      date.getMonth() + 1
    ).padStart(2, '0');

    const day = String(
      date.getDate()
    ).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private normalizeGames(response: any): ScheduleGame[] {

    if (!response) {
      return [];
    }

    if (Array.isArray(response.games)) {
      return response.games;
    }

    if (response.scoreboard?.games) {
      return response.scoreboard.games;
    }

    return [];
  }

  isLive(game: ScheduleGame): boolean {

    const status = Number(
      game.gameStatus
    );

    if (status === 2) {
      return true;
    }

    const text =
      (game.gameStatusText || '').toLowerCase();

    return (
      text.includes('live') ||
      text.includes('qtr') ||
      text.includes('quarter') ||
      text.includes('halftime')
    );
  }

  isFinal(game: ScheduleGame): boolean {

    const status = Number(
      game.gameStatus
    );

    if (status === 3) {
      return true;
    }

    const text =
      (game.gameStatusText || '').toLowerCase();

    return text.includes('final');
  }

  isScheduled(game: ScheduleGame): boolean {

    return (
      !this.isLive(game) &&
      !this.isFinal(game)
    );
  }

  displayStatus(game: ScheduleGame): string {

    if (this.isLive(game)) {
      return game.gameStatusText || 'LIVE';
    }

    if (this.isFinal(game)) {
      return 'FINAL';
    }

    return game.gameStatusText || 'SCHEDULED';
  }

  scoreDisplay(
    score: number | undefined,
    game: ScheduleGame
  ): string {

    if (this.isScheduled(game)) {
      return '—';
    }

    if (
      score === undefined ||
      score === null
    ) {
      return '—';
    }

    return String(score);
  }
}



