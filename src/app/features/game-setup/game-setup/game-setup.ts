import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Category } from '../../../core/models/category.model';
import { CategoryService } from '../../../core/services/category.service';
import { GameService } from '../../../core/services/game.service';
import {
  CreateGameRequest,
  GameSetupResponse,
  HelpOptionType
} from '../../../core/models/game.model';
import { Router } from '@angular/router';

const CATEGORY_IMAGE_MAP: Record<number, string> = {
  1: 'assets/category-images/din.svg',
  2: 'assets/category-images/geography.svg',
  3: 'assets/category-images/history.svg',
  4: 'assets/category-images/football.svg',
  5: 'assets/category-images/math.svg',
  6: 'assets/category-images/general.svg',
  7: 'assets/category-images/movies.svg',
  8: 'assets/category-images/science.svg',
  9: 'assets/category-images/technology.svg',
  10: 'assets/category-images/riddles.svg',
  11: 'assets/category-images/egypt_old_days.svg',
12: 'assets/category-images/egyptian_cinema_stars.svg',
13: 'assets/category-images/egyptian_music.svg',
14: 'assets/category-images/egyptian_series.svg',
15: 'assets/category-images/egyptian_proverbs.svg',
16: 'assets/category-images/egyptian_food.svg',
17: 'assets/category-images/egypt_governorates.svg',
18: 'assets/category-images/egypt_landmarks.svg',
19: 'assets/category-images/egyptian_figures.svg',
20: 'assets/category-images/egyptian_dialect.svg',
21: 'assets/category-images/egyptian_sports.svg',
22: 'assets/category-images/inventions.svg',
23: 'assets/category-images/human_body.svg',
24: 'assets/category-images/animals_birds.svg',
25: 'assets/category-images/plants_nature.svg',
26: 'assets/category-images/space_astronomy.svg',
27: 'assets/category-images/video_games.svg',
28: 'assets/category-images/internet_social.svg',
29: 'assets/category-images/brands_companies.svg',
30: 'assets/category-images/cars_transport.svg'
};

interface HelpOptionView {
  type: HelpOptionType;
  title: string;
  description: string;
  icon: string;
  selected: boolean;
}

@Component({
  selector: 'app-game-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './game-setup.html',
  styleUrl: './game-setup.scss'
})
export class GameSetupComponent implements OnInit {
  categories: Category[] = [];
  selectedCategoryIds: number[] = [];

  teamOneName = '';
  teamTwoName = '';

  loadingCategories = false;
  creatingGame = false;

  errorMessage = '';
  successMessage = '';

  createdGame: GameSetupResponse | null = null;

  helpOptions: HelpOptionView[] = [
    {
      type: HelpOptionType.DoublePoints,
      title: 'دبل النقط',
      description: 'يضاعف نقاط السؤال قبل بداية السؤال.',
      icon: '⚡',
      selected: true
    },
    {
      type: HelpOptionType.TwoAnswers,
      title: 'هجاوب إجابتين',
      description: 'يسمح للفريق بإعطاء إجابتين.',
      icon: '✌️',
      selected: true
    },
    {
      type: HelpOptionType.StopPlayer,
      title: 'هوقف لاعب',
      description: 'الفريق المنافس يوقف لاعب من الإجابة.',
      icon: '🛑',
      selected: true
    }
  ];

  constructor(
  private categoryService: CategoryService,
  private gameService: GameService,
  private router: Router
) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  goToBoard(): void {
  if (!this.createdGame) {
    return;
  }

  this.router.navigate(['/game-board', this.createdGame.gameSessionId]);
}

  get selectedCount(): number {
    return this.selectedCategoryIds.length;
  }

  get canCreateGame(): boolean {
    return (
      this.selectedCategoryIds.length === 6 &&
      this.teamOneName.trim().length > 0 &&
      this.teamTwoName.trim().length > 0 &&
      this.teamOneName.trim().toLowerCase() !== this.teamTwoName.trim().toLowerCase() &&
      !this.creatingGame
    );
  }

  loadCategories(): void {
    this.loadingCategories = true;
    this.errorMessage = '';

    this.categoryService.getAll().subscribe({
      next: (categories) => {
        this.categories = categories.filter(x => x.isActive);
        this.loadingCategories = false;
      },
      error: () => {
        this.errorMessage = 'حصل خطأ أثناء تحميل الفئات';
        this.loadingCategories = false;
      }
    });
  }

  toggleCategory(category: Category): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.createdGame = null;

    const exists = this.selectedCategoryIds.includes(category.id);

    if (exists) {
      this.selectedCategoryIds = this.selectedCategoryIds.filter(id => id !== category.id);
      return;
    }

    if (this.selectedCategoryIds.length >= 6) {
      this.errorMessage = 'لازم تختار 6 فئات فقط.';
      return;
    }

    this.selectedCategoryIds = [...this.selectedCategoryIds, category.id];
  }

  isCategorySelected(categoryId: number): boolean {
    return this.selectedCategoryIds.includes(categoryId);
  }

  getCategoryImage(category: Category): string {
    return CATEGORY_IMAGE_MAP[category.id] ?? 'assets/category-images/general.svg';
  }

  toggleHelpOption(option: HelpOptionView): void {
    option.selected = !option.selected;
  }

  createGame(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.createdGame = null;

    if (this.selectedCategoryIds.length !== 6) {
      this.errorMessage = 'اختار 6 فئات بالظبط.';
      return;
    }

    if (!this.teamOneName.trim() || !this.teamTwoName.trim()) {
      this.errorMessage = 'اكتب اسم الفريقين.';
      return;
    }

    if (this.teamOneName.trim().toLowerCase() === this.teamTwoName.trim().toLowerCase()) {
      this.errorMessage = 'اسم الفريقين لازم يكون مختلف.';
      return;
    }

    const request: CreateGameRequest = {
      categoryIds: this.selectedCategoryIds,
      teamOneName: this.teamOneName.trim(),
      teamTwoName: this.teamTwoName.trim(),
      helpOptions: this.helpOptions
        .filter(x => x.selected)
        .map(x => x.type)
    };

    this.creatingGame = true;

    this.gameService.setupGame(request).subscribe({
      next: (game) => {
        this.createdGame = game;
        this.successMessage = 'تم إنشاء اللعبة بنجاح.';
        this.creatingGame = false;
      },
      error: (error) => {
        this.errorMessage = error?.error || 'حصل خطأ أثناء إنشاء اللعبة.';
        this.creatingGame = false;
      }
    });
  }

  trackByCategoryId(index: number, category: Category): number {
    return category.id;
  }
}