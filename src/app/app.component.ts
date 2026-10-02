import { Component, HostListener } from '@angular/core';
import {
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet
  ],
  template: `
    <div class="site-shell">

      <div class="ticker">
        <div class="ticker-track">
          <span>NBA</span>
          <b>•</b>
          <span>BASKETBALL</span>
          <b>•</b>
          <span>SCORES</span>
          <b>•</b>
          <span>STATS</span>
          <b>•</b>
          <span>TEAMS</span>
          <b>•</b>
          <span>PLAYERS</span>
          <b>•</b>
          <span>HISTORY</span>
          <b>•</b>
          <span>NBA</span>
          <b>•</b>
          <span>BASKETBALL</span>
          <b>•</b>
          <span>SCORES</span>
          <b>•</b>
          <span>STATS</span>
          <b>•</b>
          <span>TEAMS</span>
        </div>
      </div>

      <header class="main-header">

        <a
          class="brand"
          routerLink="/"
          aria-label="COURTSIDE home"
         (click)="closeMobileMenu()">
          <span class="brand-badge">C</span>

          <span class="brand-copy">
            <strong>COURTSIDE</strong>
            <small>THE NBA. WITHOUT THE BORING PART.</small>
          </span>
        </a>

        <button
          type="button"
          class="mobile-menu-toggle"
          [class.is-open]="mobileMenuOpen"
          [attr.aria-expanded]="mobileMenuOpen"
          aria-controls="courtside-main-nav"
          aria-label="Toggle navigation menu"
          (click)="toggleMobileMenu()"
        >
          <span class="menu-icon" aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
          </span>

          <span class="menu-label">MENU</span>
        </button>
        <nav id="courtside-main-nav" class="main-nav" [class.mobile-open]="mobileMenuOpen">

          <a
            routerLink="/scores"
            routerLinkActive="active"
           (click)="closeMobileMenu()">
            SCORES
          </a>

          <a
            routerLink="/schedule"
            routerLinkActive="active"
           (click)="closeMobileMenu()">
            SCHEDULE
          </a>

          <a
            routerLink="/standings"
            routerLinkActive="active"
           (click)="closeMobileMenu()">
            STANDINGS
          </a>

          <a
            routerLink="/teams"
            routerLinkActive="active"
           (click)="closeMobileMenu()">
            TEAMS
          </a>

          <a
            routerLink="/players"
            routerLinkActive="active"
           (click)="closeMobileMenu()">
            PLAYERS
          </a>

          <a
            routerLink="/stats"
            routerLinkActive="active"
           (click)="closeMobileMenu()">
            STATS
          </a>

          <a
            routerLink="/leaders"
            routerLinkActive="active"
           (click)="closeMobileMenu()">
            LEADERS
          </a>
          <a
            routerLink="/games"
            routerLinkActive="active"
           (click)="closeMobileMenu()">
            GAMES
          </a>
          <a
            routerLink="/playoffs"
            routerLinkActive="active"
           (click)="closeMobileMenu()">
            PLAYOFFS
          </a>

          <a
            routerLink="/history"
            routerLinkActive="active"
           (click)="closeMobileMenu()">
            HISTORY
          </a>

        </nav>

        <div class="header-tag">
          LIVE
        </div>

      </header>

      <main class="page">
        <router-outlet></router-outlet>
      </main>

      <footer class="site-footer">

        <div>
          <strong>COURTSIDE</strong>
          <span>NBA DATA • STATS • SCORES • HISTORY</span>
        </div>

        <div>
          BUILT FOR THE LOVE OF THE GAME.
        </div>

      </footer>

    </div>
  `
})
export class AppComponent {

  mobileMenuOpen = false;

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.mobileMenuOpen) {
      this.closeMobileMenu();
    }
  }
}


