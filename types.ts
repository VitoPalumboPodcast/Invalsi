export enum Subject {
  ITALIANO = 'Italiano',
  MATEMATICA = 'Matematica',
  INGLESE = 'Inglese',
  DIRITTO = 'Diritto'
}

export enum GradeLevel {
  TERZA_MEDIA = 'Terza Media (Grado 8)',
  SECONDA_SUPERIORE = 'Seconda Superiore (Grado 10)',
  QUINTA_SUPERIORE = 'Quinta Superiore (Grado 13)'
}

export enum TestMode {
  ALLENAMENTO = 'allenamento', // Immediate feedback
  SIMULAZIONE = 'simulazione'  // Exam style, 90 mins
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  MATRIX = 'matrix'
}

export interface Question {
  id: string;
  type?: QuestionType; // Defaults to MULTIPLE_CHOICE if undefined
  text: string;
  contextText?: string; // For reading comprehension passages
  audioScript?: string; // For listening comprehension
  illustration?: string; // SVG code for diagrams/graphs
  
  // Standard Multiple Choice
  options?: string[];
  correctAnswerIndex?: number;

  // Matrix / Table Question
  matrixRows?: string[]; // The items to classify (e.g. "un dio ci ha dato questa pace")
  matrixCols?: string[]; // The categories (e.g. "Serenità", "Scompiglio")
  matrixCorrectAnswer?: number[]; // Array of column indices corresponding to each row

  explanation: string;
  topic: string;
}

export interface TestConfig {
  subject: Subject;
  grade: GradeLevel;
  questionCount: number;
  mode: TestMode;
}

export interface TestResult {
  id: string;
  date: number;
  config: TestConfig;
  totalQuestions: number;
  correctAnswers: number;
  scorePercentage: number;
  timeElapsed: number; // in seconds
  answers: any[]; // Can be number (index) or number[] (array of indices for matrix)
  questions: Question[];
}

export enum AppState {
  CONFIG = 'config',
  LOADING = 'loading',
  TESTING = 'testing',
  RESULTS = 'results',
  HISTORY = 'history'
}