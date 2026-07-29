import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { PrefreimScreen } from './features/prefreim';
import { isPrefreimPath } from './router/prefreimRoute';
import { initTelegram } from './lib/telegram';
import { track } from './lib/analytics';
import './styles/globals.css';

initTelegram();

// Префрейм — отдельный лонгрид-маршрут вне потока воронки (StepId его не содержит,
// PRODUCT.md §6). Один createRoot на весь проект: корневой компонент выбирается по пути.
const isPrefreim = isPrefreimPath(window.location.pathname);
if (!isPrefreim) {
  track('app_open');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>{isPrefreim ? <PrefreimScreen /> : <App />}</StrictMode>
);
