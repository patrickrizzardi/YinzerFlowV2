import { existsSync, mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import dts from 'bun-plugin-dts';

// Check for dead packages
console.log('Checking for dead packages...');
try {
  execSync('bun run find-unused-packages', { stdio: 'inherit' });
  console.log('No dead packages found.');
} catch (_) {
  // We don't need to log the error because the files will be logged in the find-unused-packages command
  console.error('Error checking for dead packages.');
  process.exit(1);
}

// Clean the output directory
console.log('Cleaning output directory...');
try {
  execSync('rm -rf lib');
  console.log('Output directory cleaned.');
} catch (error: unknown) {
  console.error('Error cleaning output directory:', error instanceof Error ? error.message : String(error));
}

// Create the output directory if it doesn't exist
if (!existsSync('lib')) {
  mkdirSync('lib');
  console.log('Created output directory.');
}

// Run tests and ensure coverage is 95%
console.log('Running tests and ensuring coverage is 95%...');
try {
  execSync('bun run test:production', { stdio: 'inherit' });
  console.log('Tests passed and coverage is 95%.');
} catch (error: unknown) {
  console.error('Error running tests or coverage is below 95%:', error instanceof Error ? error.message : String(error));
  process.exit(1);
}

// Check prettier format and linting
console.log('Checking prettier format and linting...');
try {
  execSync('bun run lint', { stdio: 'inherit' });
  execSync('bun run lint:format', { stdio: 'inherit' });
  execSync('bun run lint:spelling', { stdio: 'inherit' });
  console.log('Prettier format and linting passed.');
} catch (error: unknown) {
  console.error('Error checking prettier format and linting:', error instanceof Error ? error.message : String(error));
  process.exit(1);
}

// Build the Main app
console.log('Building Main app...');
try {
  await Bun.build({
    entrypoints: ['./app/core/YinzerFlow.ts'],
    outdir: './lib',
    target: 'node',
    minify: true,
    sourcemap: 'external',
    plugins: [
      dts({
        output: {
          noBanner: true,
          exportReferencedTypes: false,
        },
      }),
    ],
  });
  console.log('Main app built successfully.');
} catch (error: unknown) {
  console.error('Error during build:');
  if (error instanceof Error) {
    console.error(error.message);
    console.error(error.stack);
  } else {
    console.error(String(error));
  }
  process.exit(1);
}

// // Build the Constants
// console.log('Building Constants...');
// try {
//   await Bun.build({
//     entrypoints: ['./app/@constants/index.ts'],
//     outdir: './lib/constants',
//     target: 'node',
//     minify: true,
//     sourcemap: 'external',
//     plugins: [
//       dts({
//         output: {
//           noBanner: true,
//           exportReferencedTypes: false,
//         },
//       }),
//     ],
//   });
//   console.log('Constants built successfully.');
// } catch (error: unknown) {
//   console.error('Error during build:');
//   if (error instanceof Error) {
//     console.error(error.message);
//     console.error(error.stack);
//   } else {
//     console.error(String(error));
//   }
//   process.exit(1);
// }

// // Process the generated files to fix imports
// console.log('Processing generated files...');
// try {
//   // Fix imports in the main index.js
//   const indexJsFile = Bun.file(`${import.meta.dir}/lib/index.js`);
//   if (await indexJsFile.exists()) {
//     const writer = indexJsFile.writer();
//     let content = await indexJsFile.text();

//     // Fix import paths to use package path - handle different import formats
//     content = content
//       .replace(/from\s*['"]constants\/(?<file>[^'"]+)(?:\.ts)?['"]/g, () => `from "yinzerflow/@constants/index.js"`)
//       .replace(
//         /import\s*{(?<imports>[^}]+)}\s*from\s*['"]constants\/(?<file>[^'"]+)(?:\.ts)?['"]/g,
//         (_match, imports) => `import {${imports}} from "yinzerflow/@constants/index.js"`,
//       );

//     writer.write(content);
//     await writer.end();
//   }

//   console.log('Files processed successfully.');
// } catch (error: unknown) {
//   console.warn('Warning: Could not process generated files.');
//   if (error instanceof Error) {
//     console.warn(error.message);
//   } else {
//     console.warn(String(error));
//   }
// }

// // Process the generated d.ts file to fix any issues
// console.log('Processing TypeScript declaration file...');
// try {
//   const file = Bun.file(`${import.meta.dir}/lib/index.d.ts`);
//   if (await file.exists()) {
//     const writer = file.writer();
//     let content = await file.text();

//     // Fix class declarations
//     content = content.replace(/declare class/g, 'export declare class');

//     writer.write(content);
//     await writer.end();
//     console.log('TypeScript declaration file processed successfully.');
//   } else {
//     console.warn('Warning: TypeScript declaration file not found.');
//   }
// } catch (error: unknown) {
//   console.warn('Warning: Could not process TypeScript declaration file.');
//   if (error instanceof Error) {
//     console.warn(error.message);
//   } else {
//     console.warn(String(error));
//   }
// }

// // Copy package.json to the lib directory
// console.log('Copying package.json to lib directory...');
// try {
//   const packageJson = Bun.file(`${import.meta.dir}/package.json`);
//   if (await packageJson.exists()) {
//     const content = await packageJson.text();

//     // Create a new package.json in the lib directory
//     const libPackageJson = Bun.file(`${import.meta.dir}/lib/package.json`);
//     const writer = libPackageJson.writer();
//     writer.write(content);
//     await writer.end();

//     console.log('package.json copied successfully.');
//   } else {
//     console.warn('Warning: package.json not found.');
//   }
// } catch (error: unknown) {
//   console.warn('Warning: Could not copy package.json.');
//   if (error instanceof Error) {
//     console.warn(error.message);
//   } else {
//     console.warn(String(error));
//   }
// }

// // Copy README.md to the lib directory
// console.log('Copying README.md to lib directory...');
// try {
//   const readmeFile = Bun.file(`${import.meta.dir}/README.md`);
//   if (await readmeFile.exists()) {
//     const content = await readmeFile.text();

//     const libReadmeFile = Bun.file(`${import.meta.dir}/lib/README.md`);
//     const writer = libReadmeFile.writer();
//     writer.write(content);
//     await writer.end();

//     console.log('README.md copied successfully.');
//   } else {
//     console.warn('Warning: README.md not found.');
//   }
// } catch (error: unknown) {
//   console.warn('Warning: Could not copy README.md.');
//   if (error instanceof Error) {
//     console.warn(error.message);
//   } else {
//     console.warn(String(error));
//   }
// }

// // Copy LICENSE to the lib directory
// console.log('Copying LICENSE to lib directory...');
// try {
//   const licenseFile = Bun.file(`${import.meta.dir}/LICENSE`);
//   if (await licenseFile.exists()) {
//     const content = await licenseFile.text();

//     const libLicenseFile = Bun.file(`${import.meta.dir}/lib/LICENSE`);
//     const writer = libLicenseFile.writer();
//     writer.write(content);
//     await writer.end();

//     console.log('LICENSE copied successfully.');
//   } else {
//     console.warn('Warning: LICENSE not found.');
//   }
// } catch (error: unknown) {
//   console.warn('Warning: Could not copy LICENSE.');
//   if (error instanceof Error) {
//     console.warn(error.message);
//   } else {
//     console.warn(String(error));
//   }
// }

// // Copy docs folder to the lib directory
// console.log('Copying docs folder to lib directory...');
// try {
//   if (existsSync(`${import.meta.dir}/docs`)) {
//     // Create docs directory in lib if it doesn't exist
//     if (!existsSync(`${import.meta.dir}/lib/docs`)) {
//       mkdirSync(`${import.meta.dir}/lib/docs`, { recursive: true });
//     }

//     // Use execSync to copy the entire docs directory
//     execSync(`cp -R ${import.meta.dir}/docs/* ${import.meta.dir}/lib/docs/`);

//     console.log('docs folder copied successfully.');
//   } else {
//     console.warn('Warning: docs folder not found.');
//   }
// } catch (error: unknown) {
//   console.warn('Warning: Could not copy docs folder.');
//   if (error instanceof Error) {
//     console.warn(error.message);
//   } else {
//     console.warn(String(error));
//   }
// }

// // Copy example folder to the lib directory
// console.log('Copying example folder to lib directory...');
// try {
//   if (existsSync(`${import.meta.dir}/example`)) {
//     // Create example directory in lib if it doesn't exist
//     if (!existsSync(`${import.meta.dir}/lib/example`)) {
//       mkdirSync(`${import.meta.dir}/lib/example`, { recursive: true });
//     }

//     // Use execSync to copy the entire example directory
//     execSync(`cp -R ${import.meta.dir}/example/* ${import.meta.dir}/lib/example/`);

//     console.log('example folder copied successfully.');
//   } else {
//     console.warn('Warning: example folder not found.');
//   }
// } catch (error: unknown) {
//   console.warn('Warning: Could not copy example folder.');
//   if (error instanceof Error) {
//     console.warn(error.message);
//   } else {
//     console.warn(String(error));
//   }
// }

console.log('Build completed.');
