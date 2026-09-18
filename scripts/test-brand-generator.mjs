#!/usr/bin/env node

/**
 * BRAND GENERATOR & ARCHITECTURE ENGINE — COMPREHENSIVE TEST SUITE
 * 
 * Executes end-to-end automated verification across 9 critical scenarios:
 * 1. Brand creation (Brand Package, TS files, Manifest, README)
 * 2. Duplicate prevention (rejection without -Rebuild)
 * 3. Security validation (slug injection and path traversal blocking)
 * 4. Incomplete configuration detection
 * 5. Missing asset reporting
 * 6. Safe atomic activation
 * 7. Manual rollback restoration
 * 8. Invalid activation auto-rollback
 * 9. Lumina Home regression & active reference integrity
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 
  createBrand, 
  validateBrand, 
  activateBrand, 
  rollbackBrand, 
  listBrands,
  getActiveBrandId 
} from './brand-engine.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const BRANDS_DIR = path.join(PROJECT_ROOT, 'src', 'config', 'brands');
const TEST_SLUG = 'test-temp-brand';
const TEST_DIR = path.join(BRANDS_DIR, TEST_SLUG);
const CORRUPT_SLUG = 'corrupt-temp-brand';
const CORRUPT_DIR = path.join(BRANDS_DIR, CORRUPT_SLUG);

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`  ❌ FALLO: ${message}`);
    throw new Error(`Test assertion failed: ${message}`);
  }
  passedTests++;
  console.log(`  ✅ PASÓ: ${message}`);
}

async function cleanupTestBrands() {
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
  if (fs.existsSync(CORRUPT_DIR)) {
    fs.rmSync(CORRUPT_DIR, { recursive: true, force: true });
  }
}

async function runAllTests() {
  console.log('\n============================================================');
  console.log('   EJECUTANDO SUITE DE PRUEBAS DEL BRAND GENERATOR CORE     ');
  console.log('============================================================\n');

  try {
    await cleanupTestBrands();

    // Ensure baseline is lumina
    if (getActiveBrandId() !== 'lumina') {
      await activateBrand('lumina', { force: true });
    }

    // ------------------------------------------------------------------------
    // CASO 1: Crear marca nueva
    // ------------------------------------------------------------------------
    console.log('CASO 1: Crear marca nueva con Brand Package completo...');
    const createRes = await createBrand('Test Brand Temp', { slug: TEST_SLUG });
    assert(createRes.success === true, 'createBrand debe retornar success: true');
    assert(fs.existsSync(path.join(TEST_DIR, 'brand.ts')), 'brand.ts debe existir');
    assert(fs.existsSync(path.join(TEST_DIR, 'theme.ts')), 'theme.ts debe existir');
    assert(fs.existsSync(path.join(TEST_DIR, 'store.ts')), 'store.ts debe existir');
    assert(fs.existsSync(path.join(TEST_DIR, 'manifest.json')), 'manifest.json debe existir');
    assert(fs.existsSync(path.join(TEST_DIR, 'README.md')), 'README.md debe existir');
    assert(fs.existsSync(path.join(TEST_DIR, 'assets')), 'Carpeta assets/ debe existir');

    // ------------------------------------------------------------------------
    // CASO 2: Crear marca duplicada debe fallar
    // ------------------------------------------------------------------------
    console.log('\nCASO 2: Bloqueo de sobrescritura accidental de marcas duplicadas...');
    let duplicateBlocked = false;
    try {
      await createBrand('Test Brand Temp', { slug: TEST_SLUG });
    } catch (err) {
      duplicateBlocked = true;
      assert(err.message.includes('ya existe'), 'El error debe advertir que la marca ya existe');
    }
    assert(duplicateBlocked, 'Debe lanzar excepción al intentar crear una marca duplicada sin -Rebuild');

    // ------------------------------------------------------------------------
    // CASO 3: Slug inválido y Path Traversal
    // ------------------------------------------------------------------------
    console.log('\nCASO 3: Validación de seguridad contra slugs maliciosos / Path Traversal...');
    let traversalBlocked = false;
    try {
      await createBrand('Malicious', { slug: '../../escaped-dir' });
    } catch (err) {
      traversalBlocked = true;
      assert(err.message.includes('inválido') || err.message.includes('Traversal'), 'Debe detectar slug inválido o traversal');
    }
    assert(traversalBlocked, 'Debe bloquear intentos de path traversal en el slug');

    // ------------------------------------------------------------------------
    // CASO 4: Validación y detección de pendientes
    // ------------------------------------------------------------------------
    console.log('\nCASO 4: Validación estructural y reporte de placeholders...');
    const valRes = validateBrand(TEST_SLUG);
    assert(valRes.status === 'warning' || valRes.status === 'valid', 'El estado inicial debe ser warning (por placeholders) o valid');
    assert(valRes.errors.length === 0, 'No debe haber errores de sintaxis en el esqueleto generado');

    // ------------------------------------------------------------------------
    // CASO 5: Detección de assets faltantes
    // ------------------------------------------------------------------------
    console.log('\nCASO 5: Comprobación de auditoría de assets...');
    assert(valRes.manifest.assets.logo === false, 'El manifest debe reportar logo pendiente en borrador');
    assert(valRes.manifest.assets.favicon === false, 'El manifest debe reportar favicon pendiente');

    // ------------------------------------------------------------------------
    // CASO 6: Activación atómica válida
    // ------------------------------------------------------------------------
    console.log('\nCASO 6: Activación atómica con verificación TypeScript...');
    const actRes = await activateBrand(TEST_SLUG, { force: true });
    assert(actRes.success === true, 'La activación debe completarse con éxito');
    assert(actRes.activeBrand === TEST_SLUG, `La marca activa debe ser ahora ${TEST_SLUG}`);
    assert(getActiveBrandId() === TEST_SLUG, `getActiveBrandId() debe retornar ${TEST_SLUG}`);

    // ------------------------------------------------------------------------
    // CASO 7: Rollback manual
    // ------------------------------------------------------------------------
    console.log('\nCASO 7: Ejecución de Rollback manual para restaurar Lumina...');
    const rbRes = rollbackBrand();
    assert(rbRes.success === true, 'El rollback manual debe completarse exitosamente');
    assert(rbRes.restoredBrand === 'lumina', 'La marca restaurada debe ser "lumina"');
    assert(getActiveBrandId() === 'lumina', 'getActiveBrandId() debe volver a ser "lumina"');

    // ------------------------------------------------------------------------
    // CASO 8: Activación inválida con Auto-Rollback
    // ------------------------------------------------------------------------
    console.log('\nCASO 8: Intento de activación de marca corrupta con Auto-Rollback automático...');
    await createBrand('Corrupt Brand Temp', { slug: CORRUPT_SLUG });
    const brokenPath = path.join(CORRUPT_DIR, 'brand.ts');
    fs.writeFileSync(brokenPath, 'export const brokenSyntax = ;;;INVALID', 'utf-8');

    let autoRollbackTriggered = false;
    try {
      await activateBrand(CORRUPT_SLUG, { force: true });
    } catch (err) {
      autoRollbackTriggered = true;
      assert(err.message.includes('ACTIVACIÓN ABORTADA') || err.message.includes('rollback'), 'El error debe indicar auto-rollback');
    }
    assert(autoRollbackTriggered, 'Debe activar el auto-rollback ante fallas de compilación');
    assert(getActiveBrandId() === 'lumina', 'Tras el auto-rollback, Lumina debe seguir como marca activa');

    // ------------------------------------------------------------------------
    // CASO 9: Lumina Regression Test
    // ------------------------------------------------------------------------
    console.log('\nCASO 9: Verificación de Regresión Cero para Lumina Home...');
    const luminaVal = validateBrand('lumina');
    assert(luminaVal.status === 'valid', 'Lumina Home debe tener estado "valid"');
    assert(luminaVal.errors.length === 0, 'Lumina Home debe tener 0 errores');
    assert(luminaVal.warnings.length === 0, 'Lumina Home debe tener 0 advertencias');
    assert(luminaVal.manifest.status === 'ACTIVE', 'El manifest de Lumina debe tener status "ACTIVE"');

    // Clean up temp test brands
    await cleanupTestBrands();
    console.log('  [i] Marcas temporales de prueba eliminadas con éxito.');

    console.log('\n============================================================');
    console.log(`   RESULTADO: ${passedTests}/${totalTests} PRUEBAS PASADAS SATISFACTORIAMENTE   `);
    console.log('============================================================\n');
  } catch (error) {
    console.error('\n❌ ERROR EN LA SUITE DE PRUEBAS:', error.message);
    await cleanupTestBrands();
    process.exit(1);
  }
}

runAllTests();
