import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NbaService } from '../../services/nba.service';
interface StandingRow {
  TeamID?: number | string;
  TeamName?: string;
  TeamCity?: string;
  TeamAbbreviation?: string;
  W?: number;
  L?: number;
  W_PCT?: number;
  Conference?: string;
}

@Component({
  selector: 'app-playoffs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main class="cs-data-page cs-playoffs-page">

      <section class="cs-data-hero">
        <div>
          <p class="cs-data-eyebrow">COURTSIDE / POSTSEASON</p>
          <h1>PLAYOFFS</h1>
          <p class="cs-data-subtitle">
            The postseason starts when the NBA says it starts.
          </p>
        </div>

        <div class="cs-data-stamp">
          <strong>NBA</strong>
          <span>{{ season }}</span>
        </div>
      </section>

      <section class="cs-playoff-status">

        <div class="cs-playoff-status-mark">
          2026–27
        </div>

        <div>
          <span class="cs-data-eyebrow">
            CURRENT SEASON
          </span>

          <h2>
            PLAYOFF BRACKET DATA WILL APPEAR WHEN THE POSTSEASON BEGINS.
          </h2>

          <p>
            COURTSIDE will not invent playoff matchups, seeds, or results.
            Until official postseason data exists, this page displays
            the current NBA standings instead.
          </p>
        </div>

      </section>

      <section class="cs-data-status" *ngIf="loading">
        <strong>LOADING CURRENT STANDINGS...</strong>
      </section>

      <section class="cs-data-error" *ngIf="error">
        <strong>NBA STANDINGS UNAVAILABLE</strong>
        <span>{{ error }}</span>
      </section>

      <section
        class="cs-playoff-conferences"
        *ngIf="!loading && !error">

        <article class="cs-playoff-conference">

          <header>
            <span>EASTERN CONFERENCE</span>
            <small>REGULAR SEASON</small>
          </header>

          <div
            class="cs-playoff-team"
            *ngFor="let team of east; let i = index">

            <span class="cs-seed">{{ i + 1 }}</span>

            <div>
              <strong>
                {{ team.TeamCity || '' }}
                {{ team.TeamName || 'Team' }}
              </strong>

              <small>
                {{ team.TeamAbbreviation || 'NBA' }}
              </small>
            </div>

            <b>
              {{ team.W ?? '—' }}–{{ team.L ?? '—' }}
            </b>

          </div>

        </article>

        <article class="cs-playoff-conference">

          <header>
            <span>WESTERN CONFERENCE</span>
            <small>REGULAR SEASON</small>
          </header>

          <div
            class="cs-playoff-team"
            *ngFor="let team of west; let i = index">

            <span class="cs-seed">{{ i + 1 }}</span>

            <div>
              <strong>
                {{ team.TeamCity || '' }}
                {{ team.TeamName || 'Team' }}
              </strong>

              <small>
                {{ team.TeamAbbreviation || 'NBA' }}
              </small>
            </div>

            <b>
              {{ team.W ?? '—' }}–{{ team.L ?? '—' }}
            </b>

          </div>

        </article>

      </section>

      <section class="cs-data-note">
        <strong>NO INVENTED BRACKET</strong>
        <span>
          Official playoff matchups, seeds, and results will only be shown
          when returned by the NBA data source.
        </span>
      </section>

    </main>
  `,
  styles: []
})
export class PlayoffsComponent implements OnInit {

  season = '2026-27';

  loading = true;
  error = '';

  east: StandingRow[] = [];
  west: StandingRow[] = [];

  constructor(
    private nba: NbaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {

    this.loading = true;
    this.error = '';

    this.nba.getStandings().subscribe({

      next: (response: any) => {

        this.season =
          response?.season ||
          this.season;

        const standings: StandingRow[] =
          Array.isArray(response?.standings)
            ? response.standings
            : [];

        const sorted =
          [...standings].sort(
            (a, b) =>
              Number(b.W_PCT || 0) -
              Number(a.W_PCT || 0)
          );

        this.east =
          sorted
            .filter(team =>
              String(team.Conference || '')
                .toLowerCase()
                .startsWith('e')
            )
            .slice(0, 15);

        this.west =
          sorted
            .filter(team =>
              String(team.Conference || '')
                .toLowerCase()
                .startsWith('w')
            )
            .slice(0, 15);

        this.loading = false;
        this.cdr.detectChanges();

        console.log(
          'COURTSIDE: Playoff standings loaded:',
          standings.length,
          'teams'
        );
      },

      error: (err: any) => {

        console.error(
          'COURTSIDE: Playoff standings error:',
          err
        );

        this.loading = false;
        this.error =
          'The NBA standings service did not return usable data.';

        this.cdr.detectChanges();
      }
    });
  }
}

