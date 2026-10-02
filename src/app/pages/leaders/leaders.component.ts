import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { NbaService } from '../../services/nba.service';

interface LeaderEntry {
  playerName: string;
  teamTricode: string;
  value: string;
  category: string;
}

interface LeaderCategory {
  key: string;
  label: string;
  abbreviation: string;
  icon: string;
  entries: LeaderEntry[];
}

@Component({
  selector: 'app-leaders',
  standalone: true,
  template: `
    <main class="leaders-page">

      <!-- =====================================================
           HERO
           ===================================================== -->

      <section class="leaders-hero">

        <div class="leaders-hero-copy">

          <div class="leaders-kicker">
            THE STAT ATTACK
          </div>

          <h1>
            LEAGUE<br>
            <span>LEADERS.</span>
          </h1>

          <p>
            Who's filling the box score?
            The NBA's statistical leaders, straight from the feed.
          </p>

          <div class="leaders-signature">
            <span>COURTSIDE</span>
            <strong>A YUSUF A. KHAN PROJECT</strong>
          </div>

        </div>

        <div class="stat-burst" aria-hidden="true">
          <span>PTS</span>
          <strong>STAT<br>ATTACK</strong>
          <small>NBA</small>
        </div>

        <div class="leaders-sticker">
          <span>REAL DATA</span>
          <strong>NO<br>FICTION</strong>
        </div>

      </section>


      <!-- =====================================================
           DATA BAR
           ===================================================== -->

      <section class="leaders-data-bar">

        <div>
          <span class="eyebrow">COURTSIDE LEADERBOARD</span>
          <strong>
            {{ populatedCategoryCount }}
            {{ populatedCategoryCount === 1 ? 'CATEGORY' : 'CATEGORIES' }}
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

        <section class="leaders-state loading-state">

          <div class="state-number">01</div>

          <div>
            <span class="eyebrow">PLEASE WAIT</span>
            <h2>LOADING THE STAT WALL...</h2>

            <p>
              Pulling the latest NBA statistical leaders.
            </p>
          </div>

        </section>

      }


      <!-- =====================================================
           ERROR
           ===================================================== -->

      @if (!loading && error) {

        <section class="leaders-state error-state">

          <div class="state-number">!</div>

          <div>

            <span class="eyebrow">FEED ERROR</span>

            <h2>
              THE STAT WALL
              <br>
              WENT DOWN.
            </h2>

            <p>
              {{ error }}
            </p>

            <button
              type="button"
              class="retry-button"
              (click)="loadLeaders()">

              TRY AGAIN

            </button>

          </div>

        </section>

      }


      <!-- =====================================================
           EARLY SEASON EMPTY STATE
           ===================================================== -->

      @if (!loading && !error && populatedCategoryCount === 0) {

        <section class="leaders-empty">

          <div class="empty-number">
            00
          </div>

          <div class="empty-copy">

            <span class="eyebrow">
              2026-27 SEASON
            </span>

            <h2>
              THE STAT WALL
              <br>
              IS JUST WAKING UP.
            </h2>

            <p>
              The NBA leader feed has not returned statistical
              leaders yet. Once games produce official statistics,
              COURTSIDE will populate this wall automatically.
            </p>

            <div class="empty-badges">

              <span class="data-badge">
                <span class="pulse-dot"></span>
                REAL NBA DATA
              </span>

              <span class="data-badge muted-badge">
                EARLY SEASON
              </span>

            </div>

          </div>

        </section>

      }


      <!-- =====================================================
           STAT WALL
           ===================================================== -->

      @if (!loading && !error && populatedCategoryCount > 0) {

        <section class="leaders-wall">

          <div class="wall-heading">

            <div>

              <span class="eyebrow">
                BOX SCORE BREAKDOWN
              </span>

              <h2>
                WHO'S
                <br>
                RUNNING IT?
              </h2>

            </div>

            <div class="wall-mark">
              NBA
              <strong>LEADERS</strong>
            </div>

          </div>


          <div class="leaders-grid">

            @for (
              category of categories;
              track category.key
            ) {

              @if (category.entries.length > 0) {

                <article
                  class="leader-panel"
                  [class.panel-orange]="category.key === 'points'"
                  [class.panel-yellow]="category.key === 'rebounds'"
                  [class.panel-blue]="category.key === 'assists'"
                  [class.panel-white]="category.key === 'steals'"
                  [class.panel-dark]="category.key === 'blocks'">

                  <header class="leader-panel-header">

                    <div class="category-icon">
                      {{ category.icon }}
                    </div>

                    <div>

                      <span>
                        {{ category.abbreviation }}
                      </span>

                      <h3>
                        {{ category.label }}
                      </h3>

                    </div>

                  </header>


                  <div class="leader-list">

                    @for (
                      player of category.entries;
                      track player.playerName + player.teamTricode
                    ) {

                      <div class="leader-row">

                        <div class="leader-rank">
                          {{ $index + 1 }}
                        </div>

                        <div class="leader-player">

                          <strong>
                            {{ player.playerName }}
                          </strong>

                          <span>
                            {{ player.teamTricode }}
                          </span>

                        </div>

                        <div class="leader-value">
                          {{ player.value }}
                        </div>

                      </div>

                    }

                  </div>

                </article>

              }

            }

          </div>

        </section>

      }


      <!-- =====================================================
           DATA RULE
           ===================================================== -->

      <section class="leaders-note">

        <div class="note-icon">
          #
        </div>

        <div>

          <span class="eyebrow">
            COURTSIDE DATA RULE
          </span>

          <h3>
            NO MADE-UP STAT LINES.
          </h3>

          <p>
            Every player and statistical value shown on this page
            comes from the NBA data feed. When the league has not
            produced leader data yet, COURTSIDE leaves the wall empty.
          </p>

        </div>

      </section>

    </main>
  `,

  styles: []
})
export class LeadersComponent implements OnInit {

  categories: LeaderCategory[] = [
    {
      key: 'points',
      label: 'POINTS',
      abbreviation: 'PPG',
      icon: 'P',
      entries: []
    },
    {
      key: 'rebounds',
      label: 'REBOUNDS',
      abbreviation: 'RPG',
      icon: 'R',
      entries: []
    },
    {
      key: 'assists',
      label: 'ASSISTS',
      abbreviation: 'APG',
      icon: 'A',
      entries: []
    },
    {
      key: 'steals',
      label: 'STEALS',
      abbreviation: 'SPG',
      icon: 'S',
      entries: []
    },
    {
      key: 'blocks',
      label: 'BLOCKS',
      abbreviation: 'BPG',
      icon: 'B',
      entries: []
    }
  ];

  loading = true;
  error = '';

  constructor(
    private nba: NbaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadLeaders();
  }

  get populatedCategoryCount(): number {
    return this.categories.filter(
      category => category.entries.length > 0
    ).length;
  }

  loadLeaders(): void {

    this.loading = true;
    this.error = '';

    console.log(
      'COURTSIDE: LOADING NBA LEADERS'
    );

    this.nba.getLeaders().subscribe({

      next: (response: any) => {

        console.log(
          'COURTSIDE: LEADERS RESPONSE:',
          response
        );

        this.categories =
          this.normalizeLeaders(response);

        console.log(
          'COURTSIDE: LEADER CATEGORIES:',
          this.categories
        );

        this.loading = false;

        this.cdr.detectChanges();
      },

      error: (err) => {

        console.error(
          'COURTSIDE: LEADERS ERROR:',
          err
        );

        this.categories =
          this.emptyCategories();

        this.loading = false;

        this.error =
          'We could not retrieve the NBA statistical leaders.';

        this.cdr.detectChanges();
      }

    });
  }

  private emptyCategories(): LeaderCategory[] {

    return [
      {
        key: 'points',
        label: 'POINTS',
        abbreviation: 'PPG',
        icon: 'P',
        entries: []
      },
      {
        key: 'rebounds',
        label: 'REBOUNDS',
        abbreviation: 'RPG',
        icon: 'R',
        entries: []
      },
      {
        key: 'assists',
        label: 'ASSISTS',
        abbreviation: 'APG',
        icon: 'A',
        entries: []
      },
      {
        key: 'steals',
        label: 'STEALS',
        abbreviation: 'SPG',
        icon: 'S',
        entries: []
      },
      {
        key: 'blocks',
        label: 'BLOCKS',
        abbreviation: 'BPG',
        icon: 'B',
        entries: []
      }
    ];
  }

  private normalizeLeaders(response: any): LeaderCategory[] {

    const result = this.emptyCategories();

    if (!response) {
      return result;
    }

    const raw =
      Array.isArray(response.leaders)
        ? response.leaders
        : [];

    if (raw.length === 0) {
      return result;
    }

    /*
     * Supported response shape:
     *
     * {
     *   leaders: [
     *     {
     *       category: 'points',
     *       playerName: '...',
     *       teamTricode: '...',
     *       value: '...'
     *     }
     *   ]
     * }
     *
     * The normalizer also accepts common alternate property names
     * so the page remains tolerant of small API-shape differences.
     */

    for (const item of raw) {

      const categoryKey =
        this.categoryKey(
          item?.category ??
          item?.statCategory ??
          item?.stat ??
          item?.leaderType ??
          item?.name
        );

      if (!categoryKey) {
        continue;
      }

      const category =
        result.find(
          entry => entry.key === categoryKey
        );

      if (!category) {
        continue;
      }

      const playerName =
        item?.playerName ??
        item?.PLAYER_NAME ??
        item?.player ??
        item?.name;

      const teamTricode =
        item?.teamTricode ??
        item?.TEAM_ABBREVIATION ??
        item?.teamAbbreviation ??
        item?.team ??
        '';

      const value =
        item?.value ??
        item?.statValue ??
        item?.VALUE ??
        item?.rankValue ??
        item?.average;

      if (
        playerName === undefined ||
        value === undefined
      ) {
        continue;
      }

      category.entries.push({
        playerName: String(playerName),
        teamTricode: String(teamTricode),
        value: String(value),
        category: categoryKey
      });
    }

    return result;
  }

  private categoryKey(value: any): string | null {

    if (value === undefined || value === null) {
      return null;
    }

    const normalized =
      String(value)
        .toLowerCase()
        .trim();

    if (
      normalized.includes('point') ||
      normalized === 'pts' ||
      normalized === 'ppg'
    ) {
      return 'points';
    }

    if (
      normalized.includes('rebound') ||
      normalized === 'reb' ||
      normalized === 'rpg'
    ) {
      return 'rebounds';
    }

    if (
      normalized.includes('assist') ||
      normalized === 'ast' ||
      normalized === 'apg'
    ) {
      return 'assists';
    }

    if (
      normalized.includes('steal') ||
      normalized === 'stl' ||
      normalized === 'spg'
    ) {
      return 'steals';
    }

    if (
      normalized.includes('block') ||
      normalized === 'blk' ||
      normalized === 'bpg'
    ) {
      return 'blocks';
    }

    return null;
  }
}
