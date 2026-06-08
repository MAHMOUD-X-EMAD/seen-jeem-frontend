import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Category } from '../../../core/models/category.model';
import { CategoryService } from '../../../core/services/category.service';

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
30: 'assets/category-images/cars_transport.svg',
31: 'assets/category-images/alahly.svg',
32: 'assets/category-images/egyptian_league.svg',
33: 'assets/category-images/premier_league.svg',
34: 'assets/category-images/ballon_dor.svg',
35: 'assets/category-images/capitals.svg',
36: 'assets/category-images/country_flags.svg'
};

@Component({
  selector: 'app-categories-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categories-list.html',
  styleUrl: './categories-list.scss'
})
export class CategoriesListComponent implements OnInit {
  categories: Category[] = [];
  loading = false;
  errorMessage = '';
  searchTerm = '';

  selectedCategoryId: number | null = null;

  constructor(private categoryService: CategoryService) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  get activeCount(): number {
    return this.categories.filter(x => x.isActive).length;
  }

  get totalQuestions(): number {
    return this.categories.reduce((total, category) => total + category.questionsCount, 0);
  }

  get filteredCategories(): Category[] {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) {
      return this.categories;
    }

    return this.categories.filter(category =>
      category.name.toLowerCase().includes(term)
    );
  }

  loadCategories(): void {
    this.loading = true;
    this.errorMessage = '';

    this.categoryService.getAll().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'حصل خطأ أثناء تحميل الفئات';
        this.loading = false;
      }
    });
  }

  getCategoryImage(category: Category): string {
    return CATEGORY_IMAGE_MAP[category.id] ?? 'assets/category-images/general.svg';
  }

  selectCategory(category: Category): void {
    this.selectedCategoryId = category.id;
  }

  trackByCategoryId(index: number, category: Category): number {
    return category.id;
  }
}