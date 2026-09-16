import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './lib.mjs';

const dist = path.join(ROOT, 'dist');
fs.copyFileSync(path.join(dist, 'index.html'), path.join(dist, '404.html'));
console.log('已生成 GitHub Pages History 路由回退页。');
