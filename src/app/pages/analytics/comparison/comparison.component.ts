import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  NbaAnalyticsService
} from '../../../services/nba-analytics.service';

import {
  AnalyticsPlayer
} from '../../../models/analytics-player.models';

import {
  AnalyticsTeam
} from '../../../models/analytics-team.models';

@Component({
  selector: 'app-analytics-comparison',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './comparison.component.html',
  styleUrl: './comparison.component.scss'
})
export class ComparisonComponent implements OnInit {

  players: AnalyticsPlayer[] = [];

  teams: AnalyticsTeam[] = [];

  selectedPlayerA = '';
  selectedPlayerB = '';

  selectedTeamA = '';
  selectedTeamB = '';

  playerA: AnalyticsPlayer | null = null;
  playerB: AnalyticsPlayer | null = null;

  teamA: AnalyticsTeam | null = null;
  teamB: AnalyticsTeam | null = null;

  dataState:
    'DATA' |
    'NO_DATA' |
    'API_ERROR' = 'NO_DATA';

  source: 'live' | 'fixture' = 'live';

  season = '2025-26';

  loading = true;

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

    this.analytics
      .getPlayers(
        this.season,
        this.source
      )
      .subscribe({

        next: playerResponse => {

          this.players =
            Array.isArray(playerResponse?.rows)
              ? playerResponse.rows
              : [];

          this.dataState =
            playerResponse?.dataState || 'NO_DATA';

          this.errorMessage =
            playerResponse?.error || '';

          this.analytics
            .getTeams(
              this.season,
              this.source
            )
            .subscribe({

              next: teamResponse => {

                this.teams =
                  Array.isArray(teamResponse?.rows)
                    ? teamResponse.rows
                    : [];

                if (
                  teamResponse?.dataState ===
                  'API_ERROR'
                ) {
                  this.dataState = 'API_ERROR';

                  this.errorMessage =
                    teamResponse?.error ||
                    this.errorMessage;
                }

                if (
                  this.players.length > 0 ||
                  this.teams.length > 0
                ) {
                  this.dataState = 'DATA';
                }

                this.loading = false;

                this.updateSelections();

                this.cdr.detectChanges();
              },

              error: error => {

                this.dataState = 'API_ERROR';

                this.errorMessage =
                  error?.error?.error ||
                  'The team analytics endpoint failed.';

                this.loading = false;

                this.cdr.detectChanges();
              }
            });
        },

        error: error => {

          this.players = [];

          this.teams = [];

          this.dataState = 'API_ERROR';

          this.errorMessage =
            error?.error?.error ||
            'The player analytics endpoint failed.';

          this.loading = false;

          this.cdr.detectChanges();
        }
      });
  }

  updateSelections(): void {

    this.playerA =
      this.analytics.findPlayer(
        this.players,
        this.selectedPlayerA
      );

    this.playerB =
      this.analytics.findPlayer(
        this.players,
        this.selectedPlayerB
      );

    this.teamA =
      this.analytics.findTeam(
        this.teams,
        this.selectedTeamA
      );

    this.teamB =
      this.analytics.findTeam(
        this.teams,
        this.selectedTeamB
      );
  }

  onSelectionChange(): void {
    this.updateSelections();
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