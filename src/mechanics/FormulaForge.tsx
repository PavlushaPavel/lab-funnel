import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Spec } from '../store/funnel';
import type { FormulaForgeData, FormulaId } from '../content/mechanics';
import { Panel } from '../ui/Panel';
import { Button } from '../ui/Button';
import { ChoiceList } from '../ui/ChoiceList';
import { Bullets } from '../ui/Bullets';
import { Quote } from '../ui/Quote';
import { cn } from '../lib/cn';
import { haptics } from '../lib/telegram';
import { easeOut, useReducedMotionSafe } from '../lib/motion';
import { mechanicsDurations } from './localMotion';

interface FormulaForgeProps {
  data: FormulaForgeData;
  spec: Spec;
  onComplete: (result?: unknown) => void;
}

type Step = 1 | 2 | 3;
type Vote = 'strong' | 'weak' | null;

/**
 * «Собери оффер» (PRODUCT.md §4.4). Три шага: сегмент → формула → сборка оффера с "печатью" по
 * частям. Затем голосование "какой сильнее" и контрольный вопрос — на "просто красиво звучит"
 * ретрай с деадпан-ответом. onComplete после верного ответа на контрольный вопрос.
 */
export function FormulaForge({ data, onComplete }: FormulaForgeProps) {
  const reduced = useReducedMotionSafe();
  const [step, setStep] = useState<Step>(1);
  const [segmentId, setSegmentId] = useState<string | null>(null);
  const [formulaId, setFormulaId] = useState<FormulaId | null>(null);
  const [printedCount, setPrintedCount] = useState(0);
  const [vote, setVote] = useState<Vote>(null);
  const [voteWarning, setVoteWarning] = useState(false);
  const [controlAnswerId, setControlAnswerId] = useState<string | null>(null);
  const [controlFailed, setControlFailed] = useState(false);
  const [shakeTick, setShakeTick] = useState(0);
  const completedRef = useRef(false);

  const segment = data.segments.find((s) => s.id === segmentId) ?? null;
  const formula = data.formulas.find((f) => f.id === formulaId) ?? null;
  const offerParts = segmentId && formulaId ? data.offers[segmentId][formulaId].parts : [];

  // Шаг 3: "печать" оффера по частям.
  useEffect(() => {
    if (step !== 3) return;
    if (reduced) {
      setPrintedCount(offerParts.length);
      return;
    }
    setPrintedCount(0);
    let i = 0;
    const interval = window.setInterval(() => {
      i += 1;
      setPrintedCount(i);
      if (i >= offerParts.length) window.clearInterval(interval);
    }, mechanicsDurations.forgePrintStep * 1000);
    return () => window.clearInterval(interval);
    // offerParts зависит только от segmentId/formulaId, которые уже в зависимостях step-перехода
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, reduced]);

  const goStep2 = () => {
    if (!segmentId) return;
    haptics.medium();
    setStep(2);
  };

  const goStep3 = () => {
    if (!formulaId) return;
    haptics.medium();
    setStep(3);
  };

  const handleVote = (id: string) => {
    haptics.light();
    if (id === 'weak') {
      setVote('weak');
      setVoteWarning(true);
      return;
    }
    setVote('strong');
    setVoteWarning(false);
  };

  const handleControlAnswer = (id: string) => {
    setControlAnswerId(id);
    if (id === data.controlQuestion.weakAnswerId) {
      haptics.error();
      setControlFailed(true);
      setShakeTick((t) => t + 1);
      return;
    }
    setControlFailed(false);
    haptics.success();
    if (!completedRef.current) {
      completedRef.current = true;
      onComplete({ segmentId, formulaId, reason: id });
    }
  };

  const printingDone = printedCount >= offerParts.length && offerParts.length > 0;

  return (
    <div className="grid gap-4">
      {step === 1 && (
        <div className="grid gap-4">
          <p className="t-label text-ink-faint">ШАГ 1 · СЕГМЕНТ</p>
          <p className="t-body text-ink-muted">Для кого собираем оффер? Ниша — {data.niche}.</p>
          <ChoiceList
            options={data.segments.map((s) => ({ id: s.id, label: s.label }))}
            value={segmentId}
            onChange={(id) => {
              haptics.select();
              setSegmentId(id);
            }}
          />
          <Button variant="primary" full onClick={goStep2} disabled={!segmentId}>
            Далее
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="grid gap-4">
          <p className="t-label text-ink-faint">ШАГ 2 · ФОРМУЛА</p>
          <p className="t-body text-ink-muted">Выбери логику, по которой соберём текст.</p>
          <ChoiceList
            options={data.formulas.map((f) => ({ id: f.id, label: f.label }))}
            value={formulaId}
            onChange={(id) => {
              haptics.select();
              setFormulaId(id as FormulaId);
            }}
          />
          <AnimatePresence>
            {formula && (
              <motion.div
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reduced ? 0.12 : 0.24, ease: easeOut }}
              >
                <Panel label={`РАСШИФРОВКА · ${formula.label}`}>
                  <div className="grid gap-3">
                    <Bullets items={formula.breakdown} />
                    {formula.note && <Quote>{formula.note}</Quote>}
                  </div>
                </Panel>
              </motion.div>
            )}
          </AnimatePresence>
          <Button variant="primary" full onClick={goStep3} disabled={!formulaId}>
            Собрать оффер
          </Button>
        </div>
      )}

      {step === 3 && segment && formula && (
        <div className="grid gap-4">
          <p className="t-label text-ink-faint">ШАГ 3 · СБОРКА</p>

          <Panel label={`ОФФЕР · ${segment.label} · ${formula.label}`} status={printingDone ? 'done' : 'scanning'}>
            <div className="grid gap-2">
              {offerParts.slice(0, printedCount).map((part, i) => (
                <motion.p
                  key={i}
                  className="t-body text-ink"
                  initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: reduced ? 0.12 : 0.22, ease: easeOut }}
                >
                  {part}
                </motion.p>
              ))}
              {!printingDone && <span className="t-label text-ink-faint">ПЕЧАТЬ…</span>}
            </div>
          </Panel>

          <Panel label="ТАК ЧАСТО ПИШУТ, КОГДА НЕ ДУМАЮТ">
            <p className="t-body text-ink-muted">{data.weakOffer}</p>
          </Panel>

          {printingDone && (
            <div className="grid gap-3">
              <p className="t-body text-ink-muted">Какой оффер сильнее?</p>
              <ChoiceList
                options={[
                  { id: 'strong', label: 'Собранный по формуле' },
                  { id: 'weak', label: '«Качественные услуги по доступной цене»' },
                ]}
                value={vote}
                onChange={handleVote}
              />
              {voteWarning && (
                <p className="t-body-s text-bad">
                  Это же пример, как НЕ надо. Выбери тот, что реально продаёт.
                </p>
              )}
            </div>
          )}

          {vote === 'strong' && (
            <motion.div
              className="grid gap-3"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduced ? 0.12 : 0.24, ease: easeOut, delay: reduced ? 0 : mechanicsDurations.forgeVoteDelay }}
            >
              <p className="t-body text-ink-muted">{data.controlQuestion.question}</p>
              <div className="grid gap-2">
                {data.controlQuestion.options.map((opt, i) => {
                  const isWrongSelected =
                    controlFailed && controlAnswerId === opt.id && opt.id === data.controlQuestion.weakAnswerId;
                  return (
                    <button
                      key={isWrongSelected ? `${opt.id}-${shakeTick}` : opt.id}
                      type="button"
                      onClick={() => handleControlAnswer(opt.id)}
                      className={cn(
                        'grid min-h-14 grid-cols-[24px_1fr] items-center gap-3 rounded-md border bg-panel px-4 py-3 text-left',
                        'border-line',
                        isWrongSelected && 'anim-shake'
                      )}
                      style={{
                        borderLeftWidth: isWrongSelected ? 2 : 1,
                        borderLeftColor: isWrongSelected ? 'var(--bad)' : undefined,
                      }}
                    >
                      <span className="t-readout-s text-ink-faint">{String(i + 1).padStart(2, '0')}</span>
                      <span className="t-body text-ink">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
              {controlFailed && (
                <p className="t-body-s text-bad">{data.controlQuestion.weakAnswerRetryMessage}</p>
              )}
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
