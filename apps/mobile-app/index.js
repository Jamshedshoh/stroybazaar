import { registerRootComponent } from 'expo';

import App from './App';

// A local entry point keeps Metro from resolving `main` through pnpm's symlinked
// node_modules (expo/AppEntry.js relies on a relative `../../App` import).
registerRootComponent(App);
