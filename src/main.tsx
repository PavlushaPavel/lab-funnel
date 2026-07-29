import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { isPrefreimPath } from './router/prefreimRoute';
import { initTelegram } from './lib/telegram';
import { track } from './lib/analytics';
import { StepFallback } from './ui/StepFallback';
import './styles/globals.css';

// Лениво: лонгрид-префрейм не нужен основному потоку воронки (задача §2/§3) — обычный
// пользователь (isPrefreim === false) не должен качать ни этот компонент, ни его контент.
const PrefreimScreen = lazy(() =>
  import('./features/prefreim').then((m) => ({ default: m.PrefreimScreen }))
);

initTelegram();

// Префрейм — отдельный лонгрид-маршрут вне потока воронки (StepId его не содержит,
// PRODUCT.md §6). Один createRoot на весь проект: корневой компонент выбирается по пути.
const isPrefreim = isPrefreimPath(window.location.pathname);
if (!isPrefreim) {
  track('app_open');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isPrefreim ? (
      <Suspense fallback={<StepFallback />}>
        <PrefreimScreen />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>
);
