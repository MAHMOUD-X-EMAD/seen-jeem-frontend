import { Routes } from '@angular/router';
import { CategoriesListComponent } from './features/categories/categories-list/categories-list';
import { GameSetupComponent } from './features/game-setup/game-setup/game-setup';
import { GameBoardComponent } from './features/game-board/game-board/game-board';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'categories',
    pathMatch: 'full'
  },
  {
    path: 'categories',
    component: CategoriesListComponent
  },
  {
    path: 'game-setup',
    component: GameSetupComponent
  },
  {
    path: 'game-board/:gameSessionId',
    component: GameBoardComponent
  }
];