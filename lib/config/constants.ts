// Application-wide constants

export const APP_CONFIG = {
  // Pagination defaults
  DEFAULT_PAGE_SIZE: 30,
  MAX_PAGE_SIZE: 100,
  
  // Tutor capacity
  DEFAULT_STUDENTS_PER_COURSE: 20,
  MAX_STUDENTS_PER_TUTOR: 100,
  
  // Financial limits
  MAX_TRANSACTIONS_PER_PAGE: 100,
  DEFAULT_CURRENCY: "USD",
} as const;
