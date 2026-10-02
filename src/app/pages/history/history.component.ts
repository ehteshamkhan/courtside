import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

interface HistoryItem {
  year: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main class="cs-data-page cs-history-page">

      <section class="cs-data-hero">
        <div>
          <p class="cs-data-eyebrow">COURTSIDE / NBA ARCHIVE</p>
          <h1>HISTORY</h1>
          <p class="cs-data-subtitle">
            A factual timeline of the league that became the NBA.
          </p>
        </div>

        <div class="cs-data-stamp">
          <strong>NBA</strong>
          <span>1946 → NOW</span>
        </div>
      </section>

      <section class="cs-history-intro">
        <span>THE LEAGUE HAS A LONG MEMORY.</span>

        <h2>
          COURTSIDE KEEPS THE RECEIPTS.
        </h2>

        <p>
          This timeline highlights documented league milestones.
          It intentionally avoids fabricated statistics or unsupported
          claims about historical players and teams.
        </p>
      </section>

      <section class="cs-history-timeline">

        <article
          class="cs-history-item"
          *ngFor="let item of timeline; let i = index">

          <div class="cs-history-year">
            {{ item.year }}
          </div>

          <div class="cs-history-card">

            <span>
              {{ item.title }}
            </span>

            <p>
              {{ item.description }}
            </p>

          </div>

        </article>

      </section>

      <section class="cs-data-note">
        <strong>HISTORICAL RECORD</strong>
        <span>
          Historical entries are presented as factual league milestones,
          not as invented player or game statistics.
        </span>
      </section>

    </main>
  `,
  styles: []
})
export class HistoryComponent {

  timeline: HistoryItem[] = [

    {
      year: '1946',
      title: 'BAA IS FORMED',
      description:
        'The Basketball Association of America begins play, establishing the league structure that would become the NBA.'
    },

    {
      year: '1949',
      title: 'THE NBA IS BORN',
      description:
        'The BAA and National Basketball League merge, creating the National Basketball Association.'
    },

    {
      year: '1954',
      title: '24-SECOND SHOT CLOCK',
      description:
        'The NBA introduces the 24-second shot clock, permanently changing the pace and strategy of professional basketball.'
    },

    {
      year: '1969',
      title: 'NBA LOGO ERA',
      description:
        'The now-famous silhouette-based NBA identity becomes part of the league’s visual history.'
    },

    {
      year: '1979',
      title: 'THREE-POINT LINE ARRIVES',
      description:
        'The NBA adopts the three-point field goal, adding a new scoring dimension to the game.'
    },

    {
      year: '1984',
      title: 'MICHAEL JORDAN ENTERS THE NBA',
      description:
        'The Chicago Bulls select Michael Jordan in the 1984 NBA Draft, beginning one of basketball’s most influential careers.'
    },

    {
      year: '1992',
      title: 'THE DREAM TEAM',
      description:
        'NBA stars represent the United States at the 1992 Barcelona Olympics in one of basketball’s most recognizable international moments.'
    },

    {
      year: '1996',
      title: 'WNBA FOUNDED',
      description:
        'The WNBA is established as a professional women’s basketball league under the NBA family of leagues.'
    },

    {
      year: '2000s',
      title: 'GLOBAL NBA',
      description:
        'International player development, broadcasting, and fandom become increasingly central to the league’s identity.'
    },

    {
      year: '2010s',
      title: 'THE THREE-POINT ERA',
      description:
        'Three-point shooting becomes an increasingly prominent part of NBA offensive strategy.'
    },

    {
      year: '2020',
      title: 'NBA BUBBLE',
      description:
        'The league completes its 2019-20 season inside the Orlando bubble after the season was suspended because of the COVID-19 pandemic.'
    },

    {
      year: 'NOW',
      title: 'THE NBA CONTINUES',
      description:
        'New players, new teams, new records, and new chapters continue to be added to the league’s history.'
    }

  ];
}
