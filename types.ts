
export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  age?: number;
  weight?: number;
  height?: number;
  goal?: 'Emagrecimento' | 'Hipertrofia' | 'Manutenção';
  custom_exercises?: { name: string; group: string }[];
  hidden_exercises?: string[];
}

export interface ExerciseSet {
  reps?: number;
  weight?: number;
  duration?: number; // Minutes for cardio
}

export interface Exercise {
  name: string;
  type: 'strength' | 'cardio';
  sets: ExerciseSet[];
  muscleGroup?: string;
}

export interface Workout {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  name: string;
  exercises: Exercise[];
  created_at?: string;
}

export interface WorkoutTemplate {
  id: string;
  user_id: string;
  name: string;
  data: Workout[]; // Snapshot dos exercícios salvos
  created_at?: string;
}

export interface FoodMacro {
  cal: number;
  prot: number;
  carb: number;
  fat: number;
}

export interface FoodItem {
  name: string;
  grams: number;
  macros: FoodMacro | null;
}

export interface DietLog {
  id: string;
  user_id: string;
  date: string;
  meal_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  foods: FoodItem[];
}

export interface SavedMeal {
  id: string;
  name: string;
  ingredients: FoodItem[];
}

export enum ViewState {
  AUTH = 'AUTH',
  ONBOARDING = 'ONBOARDING',
  DASHBOARD = 'DASHBOARD',
  SETTINGS = 'SETTINGS',
}

export enum DashboardTab {
  WORKOUTS = 'WORKOUTS',
  DIET = 'DIET',
  PROGRESS = 'PROGRESS',
}
