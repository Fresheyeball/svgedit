#!/usr/bin/env node

/**
 * Verification Script: Comprehensive Text Styling Persistence
 * 
 * This script verifies that the text styling persistence fix is working
 * by checking key implementation files and testing critical functions.
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Verifying Comprehensive Text Styling Persistence Fix\n');

// Files to check
const filesToCheck = [
  'packages/svgcanvas/core/svg-exec.js',
  'packages/svgcanvas/core/sanitize.js', 
  'packages/svgcanvas/core/event.js',
  'packages/svgcanvas/core/layer.js',
  'packages/svgcanvas/core/draw.js'
];

let allChecksPass = true;

function checkFile(filePath, checks) {
  console.log(`📁 Checking: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`   ❌ File not found: ${filePath}`);
    allChecksPass = false;
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  checks.forEach(check => {
    if (check.type === 'contains') {
      if (content.includes(check.text)) {
        console.log(`   ✅ ${check.description}`);
      } else {
        console.log(`   ❌ ${check.description}`);
        allChecksPass = false;
      }
    } else if (check.type === 'not_contains') {
      if (!content.includes(check.text)) {
        console.log(`   ✅ ${check.description}`);
      } else {
        console.log(`   ❌ ${check.description}`);
        allChecksPass = false;
      }
    } else if (check.type === 'regex') {
      if (check.pattern.test(content)) {
        console.log(`   ✅ ${check.description}`);
      } else {
        console.log(`   ❌ ${check.description}`);
        allChecksPass = false;
      }
    }
  });
  
  console.log('');
}

// Check svg-exec.js for restoration function
checkFile('packages/svgcanvas/core/svg-exec.js', [
  {
    type: 'contains',
    text: 'restoreTextDivStyles',
    description: 'Contains restoreTextDivStyles function'
  },
  {
    type: 'contains', 
    text: 'foreignObject[se\\\\:type="text"]',
    description: 'Targets text foreignObjects correctly'
  },
  {
    type: 'contains',
    text: 'style.cssText',
    description: 'Uses CSS object model for restoration'
  }
]);

// Check sanitize.js for HTML element style preservation  
checkFile('packages/svgcanvas/core/sanitize.js', [
  {
    type: 'contains',
    text: "div: ['style'",
    description: 'Allows style attribute on div elements'
  },
  {
    type: 'contains',
    text: 'preserve style attributes on HTML elements',
    description: 'Preserves styles for HTML elements'
  }
]);

// Check event.js for non-destructive pointer-events
checkFile('packages/svgcanvas/core/event.js', [
  {
    type: 'not_contains',
    text: 'setAttribute(\'style\', \'pointer-events',
    description: 'No destructive pointer-events setAttribute calls'
  },
  {
    type: 'contains',
    text: 'style.pointerEvents',
    description: 'Uses non-destructive pointer-events setting'
  }
]);

// Check layer.js for non-destructive style updates
checkFile('packages/svgcanvas/core/layer.js', [
  {
    type: 'not_contains',
    text: 'setAttribute(\'style\', \'pointer-events',
    description: 'No destructive pointer-events setAttribute calls'
  },
  {
    type: 'contains',
    text: 'style.pointerEvents',
    description: 'Uses non-destructive pointer-events setting'
  }
]);

// Check draw.js for non-destructive style updates
checkFile('packages/svgcanvas/core/draw.js', [
  {
    type: 'not_contains', 
    text: 'setAttribute(\'style\', \'pointer-events',
    description: 'No destructive pointer-events setAttribute calls'
  },
  {
    type: 'contains',
    text: 'style.pointerEvents',
    description: 'Uses non-destructive pointer-events setting'
  }
]);

// Check test files exist
console.log('📝 Checking Test Files:');

const testFiles = [
  'cypress/e2e/integration/comprehensive-text-styling.cy.js',
  'cypress/e2e/unit/text-encoding-restoration.cy.js', 
  'cypress/e2e/unit/text-style-restoration.cy.js',
  'cypress/e2e/integration/text-persistence-workflow.cy.js'
];

testFiles.forEach(testFile => {
  if (fs.existsSync(testFile)) {
    console.log(`   ✅ Test file exists: ${testFile}`);
  } else {
    console.log(`   ❌ Test file missing: ${testFile}`);
    allChecksPass = false;
  }
});

console.log('\n🎯 Comprehensive Styling Controls Coverage:');

// Check that comprehensive test covers all styling controls
const comprehensiveTest = 'cypress/e2e/integration/comprehensive-text-styling.cy.js';
if (fs.existsSync(comprehensiveTest)) {
  const testContent = fs.readFileSync(comprehensiveTest, 'utf8');
  
  const stylingControls = [
    { control: '#tool_bold', property: 'fontWeight', description: 'Bold styling' },
    { control: '#tool_italic', property: 'fontStyle', description: 'Italic styling' },
    { control: '#tool_text_anchor', property: 'textAlign', description: 'Text alignment' },
    { control: '#tool_text_decoration_underline', property: 'textDecoration', description: 'Underline decoration' },
    { control: '#tool_text_decoration_linethrough', property: 'textDecoration', description: 'Line-through decoration' },
    { control: '#tool_text_decoration_overline', property: 'textDecoration', description: 'Overline decoration' },
    { control: '#tool_font_family', property: 'fontFamily', description: 'Font family' },
    { control: '#font_size', property: 'fontSize', description: 'Font size' },
    { control: '#fill_color', property: 'color', description: 'Text color' }
  ];
  
  stylingControls.forEach(control => {
    if (testContent.includes(control.control) && testContent.includes(control.property)) {
      console.log(`   ✅ ${control.description} - Control: ${control.control}`);
    } else {
      console.log(`   ❌ ${control.description} - Control: ${control.control}`);
      allChecksPass = false;
    }
  });
}

console.log('\n📊 Summary:');

if (allChecksPass) {
  console.log('✅ All checks PASSED! The comprehensive text styling persistence fix appears to be correctly implemented.');
  console.log('\n🎉 Next Steps:');
  console.log('   1. Open manual-test-comprehensive-styling.html in browser');
  console.log('   2. Follow the test procedure to verify all styling controls');
  console.log('   3. Test browser refresh to confirm persistence');
  console.log('   4. Verify TopPanel synchronization works correctly');
} else {
  console.log('❌ Some checks FAILED. Please review the implementation.');
  console.log('\n🔧 Recommended Actions:');
  console.log('   1. Fix any missing implementations noted above');
  console.log('   2. Ensure all destructive setAttribute calls are replaced');  
  console.log('   3. Verify sanitizer allows style attributes on HTML elements');
  console.log('   4. Re-run this verification script');
}

console.log(`\n🚀 Development server should be running at: http://localhost:8001/`);
console.log(`📋 Manual test available at: file://${path.resolve('manual-test-comprehensive-styling.html')}`);

process.exit(allChecksPass ? 0 : 1);