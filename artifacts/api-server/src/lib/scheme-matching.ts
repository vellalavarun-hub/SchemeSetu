import type { Profile, Scheme } from "@workspace/db";

export interface SchemeMatch {
  scheme: Scheme;
  match_score: number;
  reasons_matched: string[];
}

function normalized(value: string): string {
  return value.trim().toLocaleLowerCase();
}

export function matchScheme(
  profile: Profile,
  scheme: Scheme,
): SchemeMatch | null {
  const reasons: string[] = [];
  if (scheme.minAge !== null) {
    if (profile.age < scheme.minAge) return null;
    reasons.push(`Your age meets the minimum of ${scheme.minAge}`);
  }
  if (scheme.maxAge !== null) {
    if (profile.age > scheme.maxAge) return null;
    reasons.push(`Your age is within the maximum of ${scheme.maxAge}`);
  }
  if (scheme.maxIncome !== null) {
    if (profile.annualIncome > scheme.maxIncome) return null;
    reasons.push("Your annual income is within the listed limit");
  }
  if (scheme.gender) {
    if (normalized(profile.gender) !== normalized(scheme.gender)) return null;
    reasons.push("Your gender matches the listed criteria");
  }
  if (
    scheme.states.length > 0 &&
    !scheme.states.some((state) =>
      ["all india", "all states", "any state"].includes(normalized(state)),
    ) &&
    !scheme.states.some((state) => normalized(state) === normalized(profile.state))
  ) {
    return null;
  }
  if (
    scheme.states.length > 0 &&
    !scheme.states.some((state) =>
      ["all india", "all states", "any state"].includes(normalized(state)),
    )
  ) {
    reasons.push(`The scheme is available in ${profile.state}`);
  }
  if (
    scheme.categoriesAllowed.length > 0 &&
    !scheme.categoriesAllowed.some((category) =>
      ["all", "all categories", "any"].includes(normalized(category)),
    ) &&
    !scheme.categoriesAllowed.some(
      (category) => normalized(category) === normalized(profile.category),
    )
  ) {
    return null;
  }
  if (
    scheme.categoriesAllowed.length > 0 &&
    !scheme.categoriesAllowed.some((category) =>
      ["all", "all categories", "any"].includes(normalized(category)),
    )
  ) {
    reasons.push(`Your ${profile.category} category is included`);
  }
  if (
    scheme.occupations.length > 0 &&
    !scheme.occupations.some(
      (occupation) => normalized(occupation) === normalized(profile.occupation),
    )
  ) {
    return null;
  }
  if (scheme.occupations.length > 0) {
    reasons.push("Your occupation is listed for this scheme");
  }
  if (scheme.isStudent === true && !profile.isStudent) return null;
  if (scheme.isStudent === true) reasons.push("You are a student");
  if (scheme.isFarmer === true && !profile.isFarmer) return null;
  if (scheme.isFarmer === true) reasons.push("You are a farmer");
  if (scheme.hasDisability === true && !profile.hasDisability) return null;
  if (scheme.hasDisability === true) reasons.push("You meet the disability criterion");

  if (reasons.length === 0) {
    reasons.push("No age, income, or demographic restriction is listed");
  }
  const matchScore = Math.min(98, 72 + Math.min(reasons.length, 5) * 5);
  return {
    scheme,
    match_score: matchScore,
    reasons_matched: reasons,
  };
}
