import type {
  Profile as DbProfile,
  SavedScheme as DbSavedScheme,
  Scheme as DbScheme,
} from "@workspace/db";

export function serializeProfile(profile: DbProfile) {
  return {
    id: profile.id,
    user_id: profile.userId,
    age: profile.age,
    gender: profile.gender,
    state: profile.state,
    annual_income: profile.annualIncome,
    category: profile.category,
    occupation: profile.occupation,
    is_student: profile.isStudent,
    is_farmer: profile.isFarmer,
    has_disability: profile.hasDisability,
    created_at: profile.createdAt.toISOString(),
    updated_at: profile.updatedAt.toISOString(),
  };
}

export function serializeScheme(scheme: DbScheme) {
  return {
    id: scheme.id,
    name: scheme.name,
    category: scheme.category,
    description: scheme.description,
    benefits: scheme.benefits,
    min_age: scheme.minAge,
    max_age: scheme.maxAge,
    max_income: scheme.maxIncome,
    gender: scheme.gender,
    states: scheme.states,
    categories_allowed: scheme.categoriesAllowed,
    occupations: scheme.occupations,
    is_student: scheme.isStudent,
    is_farmer: scheme.isFarmer,
    has_disability: scheme.hasDisability,
    documents_required: scheme.documentsRequired,
    apply_url: scheme.applyUrl,
    created_at: scheme.createdAt.toISOString(),
    updated_at: scheme.updatedAt.toISOString(),
  };
}

export function serializeSavedScheme(
  saved: DbSavedScheme,
  scheme: DbScheme,
) {
  return {
    id: saved.id,
    user_id: saved.userId,
    scheme_id: saved.schemeId,
    status: saved.status,
    notes: saved.notes,
    ai_plan: saved.aiPlan ?? null,
    scheme: serializeScheme(scheme),
    created_at: saved.createdAt.toISOString(),
    updated_at: saved.updatedAt.toISOString(),
  };
}

export function serializeUser(user: {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    created_at: user.createdAt.toISOString(),
  };
}
