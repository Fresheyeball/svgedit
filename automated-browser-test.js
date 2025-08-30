#!/usr/bin/env node

/**
 * Automated Browser Test for Comprehensive Text Styling Persistence
 * This test runs a headless browser to verify that all text styling controls work correctly
 */

const puppeteer = require('puppeteer');

async function runTest() {
  console.log('🚀 Starting automated browser test for text styling persistence...\n');
  
  let browser;
  let testsPassed = 0;
  let totalTests = 0;
  
  try {
    // Launch browser
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    // Navigate to SVGEdit
    console.log('📂 Navigating to SVGEdit...');
    await page.goto('http://localhost:8001/src/editor/index.html', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for editor to load
    await page.waitForSelector('#svgcanvas', { timeout: 10000 });
    console.log('✅ SVGEdit loaded successfully');
    
    // Handle any storage permission dialogs
    try {
      await page.click('button[id*="approve"], button:contains("Allow"), .modal button:first-child', { timeout: 2000 });
      console.log('✅ Storage permissions approved');
    } catch (e) {
      console.log('ℹ️  No storage permission dialog found');
    }
    
    // Test 1: Create text element
    console.log('\n🧪 Test 1: Creating text element...');
    totalTests++;
    
    await page.click('#tool_text');
    await page.click('#svgcanvas', { offset: { x: 200, y: 150 } });
    await page.type('#text', 'Comprehensive Style Test', { delay: 50 });
    await page.keyboard.press('Enter');
    
    // Wait for text element to be created
    await page.waitForSelector('foreignObject[se\\:type="text"]', { timeout: 5000 });
    console.log('✅ Text element created successfully');
    testsPassed++;
    
    // Test 2: Apply bold styling
    console.log('\n🧪 Test 2: Applying bold styling...');
    totalTests++;
    
    await page.click('#tool_bold');
    
    // Verify bold was applied
    const boldApplied = await page.evaluate(() => {
      const textDiv = document.querySelector('foreignObject[se\\:type="text"] div');
      return textDiv && textDiv.style.fontWeight === 'bold';
    });
    
    if (boldApplied) {
      console.log('✅ Bold styling applied successfully');
      testsPassed++;
    } else {
      console.log('❌ Bold styling failed to apply');
    }
    
    // Test 3: Apply italic styling  
    console.log('\n🧪 Test 3: Applying italic styling...');
    totalTests++;
    
    await page.click('#tool_italic');
    
    const italicApplied = await page.evaluate(() => {
      const textDiv = document.querySelector('foreignObject[se\\:type="text"] div');
      return textDiv && textDiv.style.fontStyle === 'italic';
    });
    
    if (italicApplied) {
      console.log('✅ Italic styling applied successfully');
      testsPassed++;
    } else {
      console.log('❌ Italic styling failed to apply');
    }
    
    // Test 4: Apply text alignment
    console.log('\n🧪 Test 4: Applying text alignment...');
    totalTests++;
    
    await page.click('#tool_text_anchor');
    await page.click('se-list-item[value="start"]');
    
    const alignmentApplied = await page.evaluate(() => {
      const textDiv = document.querySelector('foreignObject[se\\:type="text"] div');
      return textDiv && textDiv.style.textAlign === 'left';
    });
    
    if (alignmentApplied) {
      console.log('✅ Text alignment applied successfully');
      testsPassed++;
    } else {
      console.log('❌ Text alignment failed to apply');
    }
    
    // Test 5: Apply text decoration
    console.log('\n🧪 Test 5: Applying text decoration...');
    totalTests++;
    
    await page.click('#tool_text_decoration_underline');
    
    const decorationApplied = await page.evaluate(() => {
      const textDiv = document.querySelector('foreignObject[se\\:type="text"] div');
      return textDiv && textDiv.style.textDecoration.includes('underline');
    });
    
    if (decorationApplied) {
      console.log('✅ Text decoration applied successfully');
      testsPassed++;
    } else {
      console.log('❌ Text decoration failed to apply');
    }
    
    // Test 6: Get current styles before save/load
    const stylesBeforeReload = await page.evaluate(() => {
      const textDiv = document.querySelector('foreignObject[se\\:type="text"] div');
      if (!textDiv) return null;
      
      return {
        fontWeight: textDiv.style.fontWeight,
        fontStyle: textDiv.style.fontStyle,
        textAlign: textDiv.style.textAlign,
        textDecoration: textDiv.style.textDecoration,
        styleAttribute: textDiv.getAttribute('style')
      };
    });
    
    console.log('\n📊 Styles before save/load:');
    console.log(`   Font Weight: ${stylesBeforeReload?.fontWeight}`);
    console.log(`   Font Style: ${stylesBeforeReload?.fontStyle}`);
    console.log(`   Text Align: ${stylesBeforeReload?.textAlign}`);
    console.log(`   Text Decoration: ${stylesBeforeReload?.textDecoration}`);
    console.log(`   Style Attribute: ${stylesBeforeReload?.styleAttribute}`);
    
    // Test 7: Save and load cycle (simulating browser refresh)
    console.log('\n🧪 Test 7: Testing save/load persistence...');
    totalTests++;
    
    const svgString = await page.evaluate(() => {
      return window.svgCanvas.getSvgString();
    });
    
    console.log('✅ SVG string generated');
    
    // Clear canvas
    await page.evaluate(() => {
      window.svgCanvas.clear();
    });
    
    // Verify canvas is cleared
    const canvasCleared = await page.evaluate(() => {
      const textElements = document.querySelectorAll('foreignObject[se\\:type="text"]');
      return textElements.length === 0;
    });
    
    if (canvasCleared) {
      console.log('✅ Canvas cleared successfully');
    } else {
      console.log('❌ Canvas failed to clear');
    }
    
    // Restore from SVG string
    const restoreSuccess = await page.evaluate((svgString) => {
      return window.svgCanvas.setSvgString(svgString);
    }, svgString);
    
    if (restoreSuccess !== false) {
      console.log('✅ SVG restored successfully');
    } else {
      console.log('❌ SVG restoration failed');
    }
    
    // Wait a moment for restoration to complete
    await page.waitForTimeout(1000);
    
    // Test 8: Verify styles persisted
    console.log('\n🧪 Test 8: Verifying style persistence...');
    totalTests++;
    
    const stylesAfterReload = await page.evaluate(() => {
      const textDiv = document.querySelector('foreignObject[se\\:type="text"] div');
      if (!textDiv) return null;
      
      return {
        fontWeight: textDiv.style.fontWeight,
        fontStyle: textDiv.style.fontStyle, 
        textAlign: textDiv.style.textAlign,
        textDecoration: textDiv.style.textDecoration,
        styleAttribute: textDiv.getAttribute('style'),
        textContent: textDiv.textContent
      };
    });
    
    console.log('\n📊 Styles after save/load:');
    console.log(`   Font Weight: ${stylesAfterReload?.fontWeight}`);
    console.log(`   Font Style: ${stylesAfterReload?.fontStyle}`);
    console.log(`   Text Align: ${stylesAfterReload?.textAlign}`);
    console.log(`   Text Decoration: ${stylesAfterReload?.textDecoration}`);
    console.log(`   Style Attribute: ${stylesAfterReload?.styleAttribute}`);
    console.log(`   Text Content: ${stylesAfterReload?.textContent}`);
    
    // Verify persistence
    const persistenceTests = [
      { 
        name: 'Font Weight (Bold)', 
        before: stylesBeforeReload?.fontWeight,
        after: stylesAfterReload?.fontWeight,
        check: (before, after) => before === after && after === 'bold'
      },
      {
        name: 'Font Style (Italic)',
        before: stylesBeforeReload?.fontStyle,
        after: stylesAfterReload?.fontStyle,
        check: (before, after) => before === after && after === 'italic'
      },
      {
        name: 'Text Align (Left)',
        before: stylesBeforeReload?.textAlign, 
        after: stylesAfterReload?.textAlign,
        check: (before, after) => before === after && after === 'left'
      },
      {
        name: 'Text Decoration (Underline)',
        before: stylesBeforeReload?.textDecoration,
        after: stylesAfterReload?.textDecoration,
        check: (before, after) => before === after && after.includes('underline')
      }
    ];
    
    let persistenceSuccess = true;
    persistenceTests.forEach(test => {
      if (test.check(test.before, test.after)) {
        console.log(`✅ ${test.name} persisted correctly`);
      } else {
        console.log(`❌ ${test.name} failed to persist (before: ${test.before}, after: ${test.after})`);
        persistenceSuccess = false;
      }
    });
    
    if (persistenceSuccess) {
      console.log('✅ All styles persisted correctly!');
      testsPassed++;
    } else {
      console.log('❌ Some styles failed to persist');
    }
    
    // Test 9: Verify no pointer-events override
    console.log('\n🧪 Test 9: Verifying no pointer-events override...');
    totalTests++;
    
    const hasPointerEventsOnly = await page.evaluate(() => {
      const textDiv = document.querySelector('foreignObject[se\\:type="text"] div');
      if (!textDiv) return false;
      
      const styleAttr = textDiv.getAttribute('style');
      return styleAttr === 'pointer-events:inherit' || styleAttr === 'pointer-events: inherit';
    });
    
    if (!hasPointerEventsOnly) {
      console.log('✅ No destructive pointer-events override detected');
      testsPassed++;
    } else {
      console.log('❌ Destructive pointer-events override detected');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  // Test summary
  console.log('\n📊 TEST SUMMARY');
  console.log('================');
  console.log(`Tests Passed: ${testsPassed}/${totalTests}`);
  console.log(`Success Rate: ${Math.round((testsPassed/totalTests) * 100)}%`);
  
  if (testsPassed === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('✅ Comprehensive text styling persistence is working correctly!');
    console.log('\n🎯 Key achievements:');
    console.log('   • Text elements can be created and styled');
    console.log('   • All styling controls apply correctly');
    console.log('   • Styles persist through save/load cycles');
    console.log('   • No destructive pointer-events overrides');
    console.log('   • CSS object model is properly restored');
    
    return true;
  } else {
    console.log('\n❌ SOME TESTS FAILED');
    console.log('🔧 Please review the failing tests and fix any issues');
    
    return false;
  }
}

// Run the test
runTest()
  .then(success => {
    console.log('\n🏁 Test execution completed');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  });