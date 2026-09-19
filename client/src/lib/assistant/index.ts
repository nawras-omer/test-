/** Public surface of the assistant engine — see `engine.ts` for the entry point. */
export { plan, suggestFoods, contextForProvider, parseUtterance } from './engine'
export type { AssistantContext, AssistantPlan, Suggestion, SuggestionReason } from './engine'
export { resolveItems, sumItems, servingsFor } from './resolve'
export type { ResolvedItem, ResolveResult } from './resolve'
export type { ParsedSegment, ParsedUtterance, AssistantIntent } from './parse'
