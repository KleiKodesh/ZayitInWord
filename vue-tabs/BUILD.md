# Build Instructions

This document contains complete instructions for building and deploying the Vue.js frontend for the Zayit application.

## Prerequisites

- Node.js (v18 or higher)
- npm (comes with Node.js)

## Build Process

### 1. Install Dependencies

```bash
cd vue-tabs
npm install
```

### 2. Build for Production

```bash
npm run build
```

This command:
- Compiles TypeScript to JavaScript
- Bundles all Vue components
- Optimizes and minifies code
- Creates a **single HTML file** with all assets inlined (CSS, JS)
- Outputs to `vue-tabs/dist/index.html`

### 3. Deploy to C# Project

After building, copy the generated file to the C# project:

**Source:** `vue-tabs/dist/index.html`

**Destination:** `ZayitLib/Zayit/Html/index.html`

#### Manual Copy (Windows)

```cmd
copy vue-tabs\dist\index.html ZayitLib\Zayit\Html\index.html
```

#### Automated Build Script

Create `vue-tabs/build-and-deploy.bat`:

```batch
@echo off
echo Building Vue application...
call npm run build

echo Copying to C# project...
copy dist\index.html C:\Users\Admin\source\otzaria\vue-zayit\ZayitLib\Zayit\Html\index.html

echo Build and deploy complete!
pause
```

Run with:
```cmd
cd vue-tabs
build-and-deploy.bat
```

## Development

### Run Development Server

```bash
npm run dev
```

Opens at `http://localhost:5173` with hot-reload.

### Type Check

```bash
npm run type-check
```

### Lint Code

```bash
npm run lint
```

## Build Configuration

The build is configured in `vite.config.ts`:

- **Single File Output**: Uses `vite-plugin-singlefile` to inline all assets
- **Base Path**: Set to `./` for relative paths (works offline)
- **Plugins**: Vue 3, JSX support

## Offline Support

The built `index.html` file:
- ✅ Contains all JavaScript inlined
- ✅ Contains all CSS inlined
- ✅ Works completely offline
- ✅ No external dependencies
- ✅ No CDN links

## File Structure After Build

```
vue-tabs/
├── dist/
│   ├── index.html          ← Single file with everything inlined
│   ├── assets/             ← Empty (all inlined)
│   └── favicon.ico
```

## Troubleshooting

### Build Fails

1. Delete `node_modules` and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. Clear Vite cache:
   ```bash
   npm run build -- --force
   ```

### File Not Found After Deploy

Ensure the C# project path exists:
```
ZayitLib\Zayit\Html\
```

### Assets Not Loading

Check that `vite.config.ts` has `base: './'` for relative paths.

## Quick Reference

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Start dev server |
| `npm run build` | Build for production |
| `npm run type-check` | Check TypeScript types |
| `npm run lint` | Lint code |

## Notes

- The build process takes ~10-30 seconds
- Output file size: ~500KB (minified + gzipped)
- Always test in the C# WebView2 after deploying
- The single file approach ensures offline functionality
