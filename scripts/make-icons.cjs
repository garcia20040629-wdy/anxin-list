// 生成 PWA 图标（SVG → PNG），运行：node scripts/make-icons.cjs
const sharp = require('sharp')
const path = require('path')
const fs = require('fs')

const outDir = path.join(__dirname, '..', 'public', 'icons')
fs.mkdirSync(outDir, { recursive: true })

function svg(scale = 1, maskable = false) {
  // 512 画布；maskable 图标内容缩到中心 60% 安全区
  const s = maskable ? 0.62 : 1
  const half = 256 * s
  const r = 115 * s * scale
  const cx = 256
  const cy = 256
  const stroke = 58 * s * scale
  const x1 = cx - 128 * s, y1 = cy - 4 * s
  const x2 = cx - 16 * s, y2 = cy + 108 * s
  const x3 = cx + 138 * s, y3 = cy - 96 * s
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
  <rect width="512" height="512" rx="${maskable ? 0 : 115 * scale}" fill="#0d9488"/>
  <path d="M ${x1} ${y1} L ${x2} ${y2} L ${x3} ${y3}" fill="none" stroke="#ffffff" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`
}

const targets = [
  ['pwa-192.png', 192, false],
  ['pwa-512.png', 512, false],
  ['maskable-192.png', 192, true],
  ['maskable-512.png', 512, true],
  ['apple-touch-icon.png', 180, false],
]

;(async () => {
  fs.writeFileSync(path.join(outDir, 'favicon.svg'), svg())
  for (const [name, size, maskable] of targets) {
    await sharp(Buffer.from(svg(1, maskable)))
      .resize(size, size)
      .png()
      .toFile(path.join(outDir, name))
    console.log('generated', name)
  }
})()
