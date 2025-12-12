import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]
const inputSvg = path.join(__dirname, 'public/icons/icon.svg')
const outputDir = path.join(__dirname, 'public/icons')

// Read SVG content
const svgBuffer = fs.readFileSync(inputSvg)

async function generateIcons() {
  console.log('🎨 Gerando ícones do app...\n')

  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon-${size}x${size}.png`)
    
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath)
    
    console.log(`✓ Gerado: icon-${size}x${size}.png`)
  }

  // Also create iOS app icon
  const iosPath = path.join(__dirname, 'ios/App/App/Assets.xcassets/AppIcon.appiconset')
  if (fs.existsSync(iosPath)) {
    const iosSizes = [20, 29, 40, 58, 60, 76, 80, 87, 120, 152, 167, 180, 1024]
    console.log('\n📱 Gerando ícones iOS...\n')
    
    for (const size of iosSizes) {
      const outputPath = path.join(iosPath, `icon-${size}.png`)
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath)
      console.log(`✓ iOS: icon-${size}.png`)
    }
  }

  // Android icons
  const androidBasePath = path.join(__dirname, 'android/app/src/main/res')
  if (fs.existsSync(androidBasePath)) {
    console.log('\n🤖 Gerando ícones Android...\n')
    const androidDirs = {
      'mipmap-mdpi': 48,
      'mipmap-hdpi': 72,
      'mipmap-xhdpi': 96,
      'mipmap-xxhdpi': 144,
      'mipmap-xxxhdpi': 192
    }

    for (const [dir, size] of Object.entries(androidDirs)) {
      const dirPath = path.join(androidBasePath, dir)
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true })
      }
      
      // Regular icon
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(path.join(dirPath, 'ic_launcher.png'))
      
      // Round icon (same as regular for now)
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(path.join(dirPath, 'ic_launcher_round.png'))
      
      // Foreground for adaptive icon
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(path.join(dirPath, 'ic_launcher_foreground.png'))
      
      console.log(`✓ Android ${dir}: ${size}x${size}`)
    }
  }

  console.log('\n✅ Todos os ícones gerados com sucesso!')
}

generateIcons().catch(console.error)
