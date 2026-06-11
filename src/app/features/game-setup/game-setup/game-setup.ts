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
import { getCategoryImagePath } from '../../../core/constants/category-image-map';

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
    },
    {
      type: HelpOptionType.Trap,
      title: 'الفخ',
      description: 'الفريق اللي عليه الدور يقدر يوقع الفريق المنافس ف الفخ، والسؤال يتحول للفريق المنافس مع بدء عداد جديد.',
      icon: '🪤',
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
    return getCategoryImagePath(category.id) ?? 'assets/category-images/general.svg';
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