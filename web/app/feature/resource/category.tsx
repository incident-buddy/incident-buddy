/** The category of the resource */
export const Categories = [
  "team",
  "communication",
  "service",
] as const;

export type Category = typeof Categories[number];
