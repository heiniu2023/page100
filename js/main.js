// Entry point: wire renderer + router + clock + input, land on page 100.
import { TeletextRenderer } from './renderer.js';
import { Router } from './router.js';
import { Clock } from './clock.js';
import { InputController } from './input.js';

const renderer = new TeletextRenderer(document.getElementById('screen'));
const router = new Router(renderer, document.getElementById('status'));
const clock = new Clock((t) => router.tick(t));
new InputController(router).attach();
clock.start();
router.go(100);
