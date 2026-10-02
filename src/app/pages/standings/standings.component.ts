import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { NbaService } from '../../services/nba.service';

@Component({
  selector: 'app-standings',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <main class="standings-page">

      <section class="standings-hero">

        <div class="hero-kicker">
          THE TABLE
        </div>

        <div class="hero-title-row">

          <div>
            <h1>STANDINGS</h1>

            <p>
              The NBA table, straight from the data.
            </p>
          </div>

          <div class="season-stamp">
            <span>SEASON</span>
            <strong>{{ season }}</strong>
          </div>

        </div>

        <div class="brand-signature">
          <span>COURTSIDE</span>
          <small>A YUSUF A. KHAN PROJECT</small>
        </div>

      </section>


      @if (loading) {

        <section class="data-state loading-state">

          <div class="loading-ball">🏀</div>

          <div>
            <strong>LOADING THE LEAGUE...</strong>
            <span>Pulling the latest NBA standings.</span>
          </div>

        </section>

      } @else if (error) {

        <section class="data-state error-state">

          <strong>NBA DATA ERROR</strong>

          <span>
            We couldn't load the standings right now.
          </span>

        </section>

      } @else {

        <section class="data-meta">

          <div class="data-live">
            <span class="live-dot"></span>
            LIVE DATA
          </div>

          <div>
            {{ standings.length }} TEAMS
          </div>

          <div>
            {{ season }}
          </div>

        </section>


        <section class="standings-board">

          <div class="board-header">
            <div>#</div>
            <div>TEAM</div>
            <div>W</div>
            <div>L</div>
            <div>PCT</div>
            <div>GB</div>
          </div>


          @for (team of standings; track team.TeamID; let i = $index) {

            <article
              class="team-row"
              [class.east]="team.Conference === 'East'"
              [class.west]="team.Conference === 'West'"
            >

              <div class="rank">
                {{ i + 1 }}
              </div>

              <div class="team-name">

                <span class="team-city">
                  {{ team.TeamCity }}
                </span>

                <strong>
                  {{ team.TeamName }}
                </strong>

              </div>

              <div class="record">
                {{ team.Wins ?? 0 }}
              </div>

              <div class="record">
                {{ team.Losses ?? 0 }}
              </div>

              <div class="percentage">
                {{ team.WinPCT ?? 0 | number:'1.3-3' }}
              </div>

              <div class="games-back">
                {{ team.GB ?? 0 }}
              </div>

            </article>

          }

        </section>


        <section class="standings-note">

          <div class="note-mark">!</div>

          <div>

            <strong>EARLY SEASON NOTE</strong>

            <p>
              Everyone is currently 0-0, so the displayed order is not a
              meaningful performance ranking yet.
            </p>

          </div>

        </section>

      }

    </main>
  `,
})
export class StandingsComponent implements OnInit {

  standings: any[] = [];

  loading = true;

  error = false;

  season = '2026-27';

  constructor(
    private nba: NbaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {

    this.nba.getStandings().subscribe({

      next: response => {

        console.log(
          'COURTSIDE: Standings loaded:',
          response?.standings?.length ?? 0
        );

        this.standings = response?.standings ?? [];

        this.season = response?.season ?? this.season;

        this.loading = false;

        this.error = false;

        this.cdr.detectChanges();

      },

      error: error => {

        console.error(
          'COURTSIDE: Standings error:',
          error
        );

        this.loading = false;

        this.error = true;

        this.cdr.detectChanges();

      }

    });

  }

}
