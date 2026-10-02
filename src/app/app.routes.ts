import { Routes } from '@angular/router';

export const routes: Routes = [
{
    path: '',
    loadComponent: () =>
      import('./home/home.component')
        .then(m => m.HomeComponent)
  },

  {
    path: 'scores',
    loadComponent: () =>
      import('./pages/scores/scores.component')
        .then(m => m.ScoresComponent)
  },

  {
    path: 'schedule',
    loadComponent: () =>
      import('./pages/schedule/schedule.component')
        .then(m => m.ScheduleComponent)
  },

  {
    path: 'standings',
    loadComponent: () =>
      import('./pages/standings/standings.component')
        .then(m => m.StandingsComponent)
  },

  {
    path: 'teams',
    loadComponent: () =>
      import('./pages/teams/teams.component')
        .then(m => m.TeamsComponent)
  },

  {
    path: 'players',
    loadComponent: () =>
      import('./pages/players/players.component')
        .then(m => m.PlayersComponent)
  },
  {
    path: 'players/:id',
    loadComponent: () =>
      import('./pages/player-detail/player-detail.component')
        .then(m => m.PlayerDetailComponent)
  },


  {
    path: 'stats',
    loadComponent: () =>
      import('./pages/stats/stats.component')
        .then(m => m.StatsComponent)
  },

  {
    path: 'leaders',
    loadComponent: () =>
      import('./pages/leaders/leaders.component')
        .then(m => m.LeadersComponent)
  },

  {
    path: 'games',
    loadComponent: () =>
      import('./pages/games/games.component')
        .then(m => m.GamesComponent)
  },

  {
    path: 'playoffs',
    loadComponent: () =>
      import('./pages/playoffs/playoffs.component')
        .then(m => m.PlayoffsComponent)
  },

  {
    path: 'history',
    loadComponent: () =>
      import('./pages/history/history.component')
        .then(m => m.HistoryComponent)
  },

  {
    path: '**',
    redirectTo: ''
  }

];

