import { mountCarousel } from './carousel';
import { browserStorage, mountLocale } from './locale';

const root = document.documentElement;
root.classList.add('js');
mountLocale(root, document.getElementById('lang')!, navigator.languages, browserStorage());
mountCarousel(document.getElementById('rail')!, document.getElementById('tabs')!, matchMedia('(min-width: 900px)'), matchMedia('(prefers-reduced-motion: reduce)'));
