import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NbaService } from '../services/nba.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="hero">

      <div class="hero-copy">

        <div class="eyebrow">
          <span></span>
          THE BASKETBALL DATA DESK
        </div>

        <h1>
          THE NBA.
          <em>WITHOUT</em>
          THE BORING PART.
        </h1>

        <p>
          Scores. Players. Teams. Numbers.
          History. Everything basketball,
          served with attitude.
        </p>

        <div class="hero-actions">

          <a
            routerLink="/scores"
            class="button button-primary"
          >
            SEE TODAY'S SCORES
          </a>

          <a
            routerLink="/standings"
            class="button button-secondary"
          >
            VIEW STANDINGS
          </a>

        </div>

      </div>

      <div class="hero-art">

        <div class="burst burst-one"></div>
        <div class="burst burst-two"></div>

        <div class="basketball">
          <div class="ball-line line-one"></div>
          <div class="ball-line line-two"></div>
          <div class="ball-line line-three"></div>
        </div>

        <div class="hero-sticker">
          <strong>NBA</strong>
          <span>COURTSIDE</span>
        </div>

        <div class="hero-number">
          30
          <small>TEAMS</small>
        </div>

      </div>

    </section>

    <section class="stat-wall">

      <article>
        <strong>30</strong>
        <span>TEAMS</span>
      </article>

      <article>
        <strong>2</strong>
        <span>CONFERENCES</span>
      </article>

      <article>
        <strong>6</strong>
        <span>DIVISIONS</span>
      </article>

      <article>
        <strong>82</strong>
        <span>REGULAR SEASON GAMES</span>
      </article>

    </section>

    <section class="section-heading">

      <div>
        <span class="section-kicker">LIVE DATA</span>
        <h2>GAME CENTER</h2>
      </div>

      <a routerLink="/scores">
        ALL SCORES →
      </a>

    </section>

    <section class="score-preview">

      @if (loading) {

        <div class="data-state">
          LOADING NBA DATA...
        </div>

      } @else if (error) {

        <div class="data-state error-state">
          NBA DATA TEMPORARILY UNAVAILABLE.
        </div>

      } @else if (games.length === 0) {

        <div class="empty-score">
          <strong>NO GAMES ON THIS DATE</strong>
          <span>Check the full schedule for upcoming action.</span>
        </div>

      } @else {

        @for (game of games.slice(0, 3); track game.gameId) {

          <article class="score-card">

            <div class="score-status">
              {{ game.gameStatusText }}
            </div>

            <div class="team-row">
              <span>{{ game.awayTeam?.teamTricode }}</span>
              <strong>{{ game.awayTeam?.score ?? '-' }}</strong>
            </div>

            <div class="team-row">
              <span>{{ game.homeTeam?.teamTricode }}</span>
              <strong>{{ game.homeTeam?.score ?? '-' }}</strong>
            </div>

          </article>

        }

      }

    </section>

    <section class="explore-grid">

      <a routerLink="/teams" class="explore-card orange">
        <span>01</span>
        <strong>TEAMS</strong>
        <small>30 FRANCHISES</small>
      </a>

      <a routerLink="/players" class="explore-card yellow">
        <span>02</span>
        <strong>PLAYERS</strong>
        <small>THE NAMES</small>
      </a>

      <a routerLink="/stats" class="explore-card blue">
        <span>03</span>
        <strong>STATS</strong>
        <small>THE NUMBERS</small>
      </a>

      <a routerLink="/history" class="explore-card black">
        <span>04</span>
        <strong>HISTORY</strong>
        <small>THE ARCHIVE</small>
      </a>

    </section>

    <section class="statement">

      <div class="statement-mark">C</div>

      <div>
        <span>THIS IS MORE THAN BOX SCORES.</span>
        <h2>
          IT'S THE
          <em>WHOLE GAME.</em>
        </h2>
      </div>

    </section>
  `
})
export class HomeComponent implements OnInit {

  games: any[] = [];
  loading = true;
  error = false;

  constructor(private nba: NbaService) {}

  ngOnInit(): void {

    this.nba.getScoreboard().subscribe({

      next: response => {
        this.games = response?.scoreboard?.games ?? [];
        this.loading = false;
      },

      error: () => {
        this.error = true;
        this.loading = false;
      }

    });

  }
}
