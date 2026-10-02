import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  NbaAnalyticsService
} from '../../../services/nba-analytics.service';

import {
  AnalyticsTeam
} from '../../../models/analytics-team.models';

@Component({
  selector: 'app-team-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './team-analytics.component.html',
  styleUrl: './team-analytics.component.scss'
})
export class TeamAnalyticsComponent implements OnInit {

  rows: AnalyticsTeam[] = [];

  loading = true;

  dataState:
    'DATA' |
    'NO_DATA' |
    'API_ERROR' = 'NO_DATA';

  source: 'live' | 'fixture' = 'live';

  season = '2025-26';

  errorMessage = '';

  constructor(
    private analytics: NbaAnalyticsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {

    this.loading = true;
    this.errorMessage = '';

    this.analytics
      .getTeams(
        this.season,
        this.source
      )
      .subscribe({

        next: response => {

          this.dataState =
            response?.dataState || 'NO_DATA';

          this.source =
            response?.source || 'live';

          this.rows =
            Array.isArray(response?.rows)
              ? response.rows
              : [];

          this.errorMessage =
            response?.error || '';

          this.loading = false;

          this.cdr.detectChanges();
        },

        error: error => {

          this.rows = [];

          this.dataState = 'API_ERROR';

          this.errorMessage =
            error?.error?.error ||
            'The analytics API could not be reached.';

          this.loading = false;

          this.cdr.detectChanges();
        }
      });
  }

  useFixture(): void {
    this.source = 'fixture';
    this.load();
  }

  useLive(): void {
    this.source = 'live';
    this.load();
  }

  value(value: unknown): string {
    return value == null ? '—' : String(value);
  }

  percentage(value: unknown): string {

    if (value == null) {
      return '—';
    }

    const numeric = Number(value);

    if (!Number.isFinite(numeric)) {
      return '—';
    }

    return (
      numeric * 100
    ).toFixed(1) + '%';
  }
}