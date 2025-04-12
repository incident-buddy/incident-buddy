export const Categories = [
  "team",
  "communication",
  "feature",
] as const;

export type Category = typeof Categories[number];
