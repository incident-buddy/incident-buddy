/** The category of the resource */
export const Categories = ["none", "team", "communication", "service"] as const;

export type Category = (typeof Categories)[number];
