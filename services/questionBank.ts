import { Question, Subject, GradeLevel } from '../types';
import { matematicaQuestions } from './matematicaQuestions';
import { italianoQuestions } from './italianoQuestions';
import { ingleseQuestions } from './ingleseQuestions';
import { dirittoQuestions } from './dirittoQuestions';

export const getStaticQuestions = (subject: Subject, grade: GradeLevel): Question[] => {
  if (subject === Subject.MATEMATICA && grade === GradeLevel.SECONDA_SUPERIORE) {
    return matematicaQuestions;
  } else if (subject === Subject.ITALIANO && grade === GradeLevel.SECONDA_SUPERIORE) {
    return italianoQuestions;
  } else if (subject === Subject.INGLESE && grade === GradeLevel.SECONDA_SUPERIORE) {
    return ingleseQuestions;
  } else if (subject === Subject.DIRITTO) { 
    return dirittoQuestions;
  }
  return [];
};