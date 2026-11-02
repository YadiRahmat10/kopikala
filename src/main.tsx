import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

/* Ionic core CSS */
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';

/* Font & ikon dibundel lokal agar tetap tampil saat offline di perangkat */
import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';
import '@fontsource/plus-jakarta-sans/800.css';
import 'material-symbols/outlined.css';

import './theme/global.css';
import { applyGlass, loadGlass } from './components/GlassSettings';

applyGlass(loadGlass());

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
