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
  10: 'assets/category-images/riddles.svg'
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