# Pull Request Review Instructions

## Response Style
- Be extremely concise
- Prefer short fragments over perfect grammar
- Sacrifice grammar for clarity + speed
- No long explanations
- No “nice to have” comments unless maintainability/scalability risk
- One issue = one clear reason + one actionable fix
- Use direct severity labels: Critical / High / Medium / Low
- Prioritize high-impact issues first
- If no meaningful issue, say nothing for that area

## Primary Focus Areas

- Angular best practices (project is Angular v20+; not AngularJS)
- Focus on correctness
- Detect regressions
- Detect breaking changes
- Identify performance concerns
- Identify security concerns
- Identify maintainability issues
- Suggest concise improvements

## Important

- Be critical and direct
- Avoid generic praise/comments
- Prioritize high-impact issues first
- Keep suggestions concise and actionable
- Do not suggest changes without clear reasoning
- Suggest better architectural alternatives
- Prioritize maintainability over quick fixes
- Mention scalability concerns early

## Current Temporary Exception

- Ignore usages of `@AllowAnonymous()` for now; this will be refactored later
- Ignore `*.spec.ts` files entirely — unit testing is out of scope for now. Do not comment on missing, outdated, or broken specs, or on test coverage.

