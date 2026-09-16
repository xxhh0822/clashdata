import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { ROOT, catalogFromData, loadTranslations } from './lib.mjs';

const outputRoot = path.join(ROOT, 'public', 'generated');
const thumbRoot = path.join(outputRoot, 'thumbs');
fs.mkdirSync(thumbRoot, { recursive: true });

const catalog = catalogFromData(loadTranslations());
for (const item of catalog) {
  if (!item.icon?.startsWith('images/')) continue;
  const source = path.join(ROOT, 'public', ...item.icon.split('/'));
  if (!fs.existsSync(source)) continue;
  const name = `${crypto.createHash('sha1').update(`filled-v2:${item.icon}`).digest('hex').slice(0, 16)}.webp`;
  const target = path.join(thumbRoot, name);
  if (!fs.existsSync(target)) {
    const trimmed = await sharp(source).trim({ threshold: 8 }).png().toBuffer();
    const background = await sharp(trimmed)
      .resize(320, 240, { fit: 'cover' })
      .blur(14)
      .modulate({ brightness: 0.58, saturation: 0.9 })
      .flatten({ background: '#173a5b' })
      .png()
      .toBuffer();
    const foreground = await sharp(trimmed)
      .resize(320, 240, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    await sharp(background)
      .composite([{ input: foreground }])
      .webp({ quality: 84, alphaQuality: 90 })
      .toFile(target);
  }
  item.thumbnail = `generated/thumbs/${name}`;
}

fs.writeFileSync(path.join(outputRoot, 'catalog.json'), `${JSON.stringify({ generatedAt: new Date().toISOString(), items: catalog }, null, 2)}\n`);
console.log(`已生成 ${catalog.length} 条目录数据。`);
