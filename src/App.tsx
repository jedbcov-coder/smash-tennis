/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Game } from './components/Game';
import { GRADIENTS } from './design/gradients';

export default function App() {
  return (
    <main className="w-screen h-screen overflow-hidden" style={{ background: GRADIENTS.uiBackground }}>
      <Game />
    </main>
  );
}
