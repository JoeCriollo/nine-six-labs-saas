export const EXPENSE_CATEGORIES = ['Marketing', 'Logística', 'Operativo', 'Nómina', 'Otro'] as const;
export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];
