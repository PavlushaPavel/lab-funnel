/**
 * Реэкспорт интерактивных механик (ARCHITECTURE.md §2). Было шесть — BriefDecoder, FormulaForge
 * и ModuleChain снесены вместе с их шагами (m1-decoder/m2-forge/chain): дублировали то, что
 * человек уже видел в видео или собрал сам, и не давали профессионального понимания.
 */
export { BullshitDetector } from './BullshitDetector';
export { LeakScanner } from './LeakScanner';
export { BeforeAfter } from './BeforeAfter';
export { TraceChain } from './TraceChain';
