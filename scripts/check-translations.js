/**
 * Script de vérification des traductions
 * Vérifie que tous les textes en dur sont traduits
 */

const fs = require('fs');
const path = require('path');

// Chemins à vérifier
const pathsToCheck = [
  'src/app',
  'src/components'
];

// Patterns pour détecter les textes en dur (français/anglais)
const textPatterns = [
  /['"`]([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞß][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ\s]{3,})['"`]/g,
  />([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞß][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ\s]{3,})</g,
];

// Mots-clés à ignorer (props, attributs HTML, etc.)
const ignorePatterns = [
  /className/,
  /href=/,
  /src=/,
  /alt=/,
  /aria-label=/,
  /placeholder=/,
  /type=/,
  /id=/,
  /key=/,
  /value=/,
  /onClick/,
  /onChange/,
  /onSubmit/,
  /style=/,
  /width=/,
  /height=/,
  /fill=/,
  /priority/,
  /objectFit/,
];

// Extensions de fichiers à vérifier
const fileExtensions = ['.tsx', '.jsx', '.ts', '.js'];

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      // Ignorer node_modules, .next, etc.
      if (!file.startsWith('.') && file !== 'node_modules' && file !== '.next') {
        arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
      }
    } else {
      const ext = path.extname(file);
      if (fileExtensions.includes(ext)) {
        arrayOfFiles.push(filePath);
      }
    }
  });

  return arrayOfFiles;
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];

  // Vérifier si le fichier utilise useLanguage
  const hasUseLanguage = content.includes('useLanguage') || content.includes('from \'@/contexts/LanguageContext\'');
  
  // Chercher les textes en dur
  textPatterns.forEach((pattern, index) => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const text = match[1] || match[0];
      
      // Ignorer si c'est un pattern à ignorer
      const shouldIgnore = ignorePatterns.some(ignorePattern => 
        content.substring(Math.max(0, match.index - 50), match.index + 50).match(ignorePattern)
      );
      
      if (!shouldIgnore && text && text.length > 3) {
        // Vérifier si c'est du français ou de l'anglais (pas du code)
        const isFrench = /[àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/.test(text);
        const isEnglish = /^[A-Z][a-z\s]+$/.test(text);
        
        if ((isFrench || isEnglish) && !text.includes('{') && !text.includes('}')) {
          const lineNumber = content.substring(0, match.index).split('\n').length;
          issues.push({
            file: filePath,
            line: lineNumber,
            text: text.substring(0, 50),
            hasUseLanguage
          });
        }
      }
    }
  });

  return issues;
}

function main() {
  console.log('🔍 Vérification des traductions...\n');

  let allIssues = [];
  
  pathsToCheck.forEach(dirPath => {
    if (fs.existsSync(dirPath)) {
      const files = getAllFiles(dirPath);
      files.forEach(file => {
        const issues = checkFile(file);
        if (issues.length > 0) {
          allIssues = allIssues.concat(issues);
        }
      });
    }
  });

  if (allIssues.length === 0) {
    console.log('✅ Aucun texte en dur trouvé! Tous les fichiers utilisent les traductions.\n');
    process.exit(0);
  } else {
    console.log(`⚠️  ${allIssues.length} texte(s) en dur trouvé(s):\n`);
    
    // Grouper par fichier
    const issuesByFile = {};
    allIssues.forEach(issue => {
      if (!issuesByFile[issue.file]) {
        issuesByFile[issue.file] = [];
      }
      issuesByFile[issue.file].push(issue);
    });

    Object.keys(issuesByFile).forEach(file => {
      console.log(`📄 ${file}`);
      const issues = issuesByFile[file];
      issues.forEach(issue => {
        const status = issue.hasUseLanguage ? '⚠️' : '❌';
        console.log(`  ${status} Ligne ${issue.line}: "${issue.text}"`);
        if (!issue.hasUseLanguage) {
          console.log(`     → Ajoutez: import { useLanguage } from '@/contexts/LanguageContext';`);
          console.log(`     → Et utilisez: const { t } = useLanguage();`);
        }
      });
      console.log('');
    });

    console.log('\n💡 Pour corriger:');
    console.log('   1. Ajoutez les traductions dans src/translations.js (4 langues)');
    console.log('   2. Utilisez t(\'clé\') au lieu du texte en dur');
    console.log('   3. Assurez-vous d\'avoir \'use client\' si nécessaire\n');
    
    process.exit(1);
  }
}

main();

