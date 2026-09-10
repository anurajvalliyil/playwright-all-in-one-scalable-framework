export const ModelRegistry = {
  planner: "llama-3.3-70b-versatile",
  executor: "llama-3.1-8b-instant",
  healer: "llama-3.1-8b-instant",
  analyst: "llama-3.3-70b-versatile",
  reporter: "llama-3.3-70b-versatile"
};

export const MODEL_OVERRIDES: Partial<typeof ModelRegistry> = {
  planner: process.env.OVERRIDE_PLANNER_MODEL as any,
  executor: process.env.OVERRIDE_EXECUTOR_MODEL as any,
  healer: process.env.OVERRIDE_HEALER_MODEL as any,
  analyst: process.env.OVERRIDE_ANALYST_MODEL as any,
  reporter: process.env.OVERRIDE_REPORTER_MODEL as any
};

export const getModel = (role: keyof typeof ModelRegistry): string => {
  return MODEL_OVERRIDES[role] || ModelRegistry[role];
};

export const TOKEN_BUDGET_CEILING = 100000;
