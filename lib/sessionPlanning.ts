/**
 * Session Planning Intelligence
 *
 * Provides smart recommendations for session planning based on:
 * - Student performance data
 * - Learning goals
 * - Assessment results
 * - Exercise difficulty progression
 */

export interface StudentPerformanceData {
  studentId: string;
  averageScore: number;
  completionRate: number;
  strugglingAreas: string[];
  strengths: string[];
  recentProgress: number;
  goalProgress: {
    goalId: string;
    goalText: string;
    progress: number;
    targetDate: Date | null;
  }[];
}

export interface ContentRecommendation {
  exerciseId: string;
  exerciseTitle: string;
  difficulty: string;
  estimatedTime: number;
  reason: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface SessionRecommendation {
  studentIds: string[];
  courseId: string;
  recommendedExercises: ContentRecommendation[];
  estimatedDuration: number;
  focus: string;
  reasoning: string;
}

/**
 * Analyze student performance to generate content recommendations
 */
export function generateContentRecommendations(
  performanceData: StudentPerformanceData,
  availableExercises: any[]
): ContentRecommendation[] {
  const recommendations: ContentRecommendation[] = [];

  // 1. Address struggling areas (HIGH priority)
  for (const area of performanceData.strugglingAreas) {
    const relevantExercises = availableExercises.filter(
      (exercise) => exercise.exerciseType === area && exercise.difficulty === 'EASY'
    );

    for (const exercise of relevantExercises.slice(0, 2)) {
      recommendations.push({
        exerciseId: exercise.id,
        exerciseTitle: exercise.title,
        difficulty: exercise.difficulty,
        estimatedTime: exercise.estimatedMinutes || 15,
        reason: `Targets struggling area: ${area}`,
        priority: 'HIGH',
      });
    }
  }

  // 2. Reinforce strengths (MEDIUM priority)
  for (const strength of performanceData.strengths) {
    const relevantExercises = availableExercises.filter(
      (exercise) => exercise.exerciseType === strength && exercise.difficulty === 'MEDIUM'
    );

    for (const exercise of relevantExercises.slice(0, 1)) {
      recommendations.push({
        exerciseId: exercise.id,
        exerciseTitle: exercise.title,
        difficulty: exercise.difficulty,
        estimatedTime: exercise.estimatedMinutes || 20,
        reason: `Reinforces strength: ${strength}`,
        priority: 'MEDIUM',
      });
    }
  }

  // 3. Goal-aligned content (MEDIUM priority)
  for (const goal of performanceData.goalProgress) {
    if (goal.progress < 80) {
      // Focus on incomplete goals
      const relevantExercises = availableExercises.filter((exercise) =>
        exercise.title.toLowerCase().includes(goal.goalText.toLowerCase().split(' ')[0])
      );

      for (const exercise of relevantExercises.slice(0, 1)) {
        recommendations.push({
          exerciseId: exercise.id,
          exerciseTitle: exercise.title,
          difficulty: exercise.difficulty,
          estimatedTime: exercise.estimatedMinutes || 15,
          reason: `Aligns with goal: ${goal.goalText}`,
          priority: 'MEDIUM',
        });
      }
    }
  }

  // 4. Progressive difficulty (LOW priority)
  if (performanceData.averageScore > 75) {
    // Student is ready for harder content
    const challengingExercises = availableExercises.filter(
      (ex) => ex.difficulty === 'HARD' && performanceData.strengths.includes(ex.exerciseType)
    );

    for (const exercise of challengingExercises.slice(0, 1)) {
      recommendations.push({
        exerciseId: exercise.id,
        exerciseTitle: exercise.title,
        difficulty: exercise.difficulty,
        estimatedTime: exercise.estimatedMinutes || 25,
        reason: 'Challenge: Student ready for advanced content',
        priority: 'LOW',
      });
    }
  }

  // Sort by priority and return top 5
  const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  return recommendations
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    .slice(0, 5);
}

/**
 * Generate smart session recommendations for a group of students
 */
export function generateSessionRecommendation(
  studentsData: StudentPerformanceData[],
  availableExercises: any[],
  courseId: string
): SessionRecommendation {
  // Find common struggling areas
  const allStrugglingAreas = studentsData.flatMap((s) => s.strugglingAreas);
  const commonStruggles = Array.from(new Set(allStrugglingAreas));

  // Find common goals
  const allGoals = studentsData.flatMap((s) => s.goalProgress);
  const commonGoalTypes = Array.from(new Set(allGoals.map((goal) => goal.goalText.split(' ')[0])));

  // Generate recommendations focusing on common areas
  let focus = 'Mixed Skills';
  let reasoning = 'Balanced session covering multiple learning objectives';

  if (commonStruggles.length > 0) {
    focus = `Focus: ${commonStruggles[0]}`;
    reasoning = `Addressing common struggling area: ${commonStruggles[0]}`;
  } else if (commonGoalTypes.length > 0) {
    focus = `Goal-Aligned: ${commonGoalTypes[0]}`;
    reasoning = `Working towards common learning goals`;
  }

  // Get recommendations for each student and find overlap
  const allRecommendations = studentsData.flatMap((student) =>
    generateContentRecommendations(student, availableExercises)
  );

  // Count exercise frequency
  const exerciseCounts = new Map<string, number>();
  allRecommendations.forEach((recommendation) => {
    exerciseCounts.set(recommendation.exerciseId, (exerciseCounts.get(recommendation.exerciseId) || 0) + 1);
  });

  // Select exercises that benefit multiple students
  const selectedExercises = Array.from(exerciseCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([exerciseId]) => allRecommendations.find((recommendation) => recommendation.exerciseId === exerciseId)!)
    .filter(Boolean);

  const estimatedDuration = selectedExercises.reduce((sum, ex) => sum + ex.estimatedTime, 0) + 15; // +15 for intro/outro

  return {
    studentIds: studentsData.map((s) => s.studentId),
    courseId,
    recommendedExercises: selectedExercises,
    estimatedDuration,
    focus,
    reasoning,
  };
}

/**
 * Get auto-sequenced content path for a student
 */
export function getAutoSequencedPath(
  performanceData: StudentPerformanceData,
  courseExercises: any[]
): ContentRecommendation[] {
  // Sort exercises by difficulty and type
  const sequencedPath: ContentRecommendation[] = [];

  // 1. Start with fundamentals if struggling
  if (performanceData.averageScore < 50) {
    const fundamentals = courseExercises.filter((ex) => ex.difficulty === 'EASY');
    sequencedPath.push(
      ...fundamentals.slice(0, 3).map((ex) => ({
        exerciseId: ex.id,
        exerciseTitle: ex.title,
        difficulty: ex.difficulty,
        estimatedTime: ex.estimatedMinutes || 15,
        reason: 'Foundation building',
        priority: 'HIGH' as const,
      }))
    );
  }

  // 2. Progress to intermediate
  if (performanceData.averageScore >= 50 && performanceData.averageScore < 75) {
    const intermediate = courseExercises.filter((ex) => ex.difficulty === 'MEDIUM');
    sequencedPath.push(
      ...intermediate.slice(0, 2).map((ex) => ({
        exerciseId: ex.id,
        exerciseTitle: ex.title,
        difficulty: ex.difficulty,
        estimatedTime: ex.estimatedMinutes || 20,
        reason: 'Skill development',
        priority: 'MEDIUM' as const,
      }))
    );
  }

  // 3. Challenge with advanced content
  if (performanceData.averageScore >= 75) {
    const advanced = courseExercises.filter((ex) => ex.difficulty === 'HARD');
    sequencedPath.push(
      ...advanced.slice(0, 2).map((ex) => ({
        exerciseId: ex.id,
        exerciseTitle: ex.title,
        difficulty: ex.difficulty,
        estimatedTime: ex.estimatedMinutes || 25,
        reason: 'Mastery & challenge',
        priority: 'LOW' as const,
      }))
    );
  }

  return sequencedPath;
}
