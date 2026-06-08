export interface Category {
  id: number;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  questionsCount: number;
}