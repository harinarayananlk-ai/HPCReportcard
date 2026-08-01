/**
 * stageRouter.js
 * Central utility for determining which stage a student belongs to
 * and which route to navigate to, based on their class/grade.
 *
 * Stages:
 *  S1 - Foundational:   Bal Vatika, Grade 1, Grade 2
 *  S2 - Preparatory:    Grade 3, Grade 4, Grade 5
 *  S3 - Middle:         Grade 6, Grade 7, Grade 8
 *  S4 - Secondary:      Grade 9, Grade 10, Grade 11, Grade 12
 */

/**
 * Normalises a class_name string to lower-case trimmed form.
 */
export function normaliseClass(className = '') {
  return (className || '').toLowerCase().trim();
}

/**
 * Returns the stage number (1–4) for a given class name string.
 */
export function getStage(className) {
  const cls = normaliseClass(className);
  if (
    cls.includes('bal vatika') ||
    cls === 'kg' ||
    cls === 'kindergarten' ||
    cls === 'grade 1' ||
    cls === '1' ||
    cls === 'grade 2' ||
    cls === '2'
  ) return 1;

  if (
    cls === 'grade 3' || cls === '3' ||
    cls === 'grade 4' || cls === '4' ||
    cls === 'grade 5' || cls === '5'
  ) return 2;

  if (
    cls === 'grade 6' || cls === '6' ||
    cls === 'grade 7' || cls === '7' ||
    cls === 'grade 8' || cls === '8'
  ) return 3;

  if (
    cls === 'grade 9'  || cls === '9'  ||
    cls === 'grade 10' || cls === '10' ||
    cls === 'grade 11' || cls === '11' ||
    cls === 'grade 12' || cls === '12'
  ) return 4;

  return 3; // default fallback to Middle
}

/**
 * Returns true if the grade is Secondary Stage (9–12).
 */
export function isSecondaryStage(className) {
  return getStage(className) === 4;
}

/**
 * Given a class name, returns the correct route for Part A2
 * (called from CompletePage / attendance page).
 */
export function getPartA2Route(className) {
  const stage = getStage(className);
  switch (stage) {
    case 1: return '/part_a2_s1/AboutMe';
    case 2: return '/part_a2_s2/AboutMe';
    case 3: return '/part_a2_s34/LayoutBuilder';
    case 4: return '/part_a2_s4/SelfEvaluation';
    default: return '/part_a2_s34/LayoutBuilder';
  }
}

/**
 * Given a class name, returns the correct entry route for Part A1
 * after StudentRegistration (the initial registration screen).
 *
 * For grades 9–12: jumps straight to the S4 full form (skips ParentRegistration & CompletePage).
 * For all others: goes to ParentRegistration → CompletePage.
 */
export function getAfterRegistrationRoute(className) {
  return '/part_a1/StudentRegistration';
}

/**
 * Given a class name, returns the correct route for Part B
 */
export function getPartBRoute(className) {
  const stage = getStage(className);
  switch (stage) {
    case 1: return '/part_b_s1/SelectionPage';
    case 2: return '/part_b_s2/SelectionPage';
    case 3: return '/part_b_s3/SelectionPage';
    case 4: return '/part_b_s4/SelectionPage';
    default: return '/part_b_s4/SelectionPage';
  }
}
