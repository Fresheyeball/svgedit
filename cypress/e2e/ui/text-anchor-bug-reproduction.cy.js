/* eslint-env node */
/**
 * This test specifically reproduces the reported bug:
 * "Text that is left aligned, on page reload is still not visually left aligned,
 * until after I interact with TopPanel and set the anchor text there."
 *
 * This test should FAIL until the bug is properly fixed.
 */
describe('Text Anchor Bug Reproduction', function () {
  beforeEach(() => {
    // Handle uncaught exceptions from SVGEdit
    cy.on('uncaught:exception', (err, runnable) => {
      // Don't fail the test on SVGEdit internal errors like cursor positioning
      if (err.message.includes('Cannot read properties of undefined')) {
        return false
      }
      // Let other errors fail the test
      return true
    })

    cy.visit('/src/editor/index.html')
    cy.get('#tool_text').should('be.visible')
  })

  it('BUG: Left-aligned text should be visually left-aligned immediately on page load (currently fails)', function () {
    // Step 1: Create left-aligned text
    cy.get('#tool_text').click()
    cy.get('#svgcanvas').click(200, 150)
    cy.get('#text').type('This should be LEFT aligned{enter}', { force: true })

    // Step 2: Set to left alignment using the custom dropdown
    cy.get('#tool_text_anchor').click({ force: true })
    cy.get('se-list-item[value="start"]').click({ force: true })

    // Step 3: Verify it's working before reload - with new approach, no text-anchor on foreignObject
    cy.get('foreignObject[se\\:type="text"]').should(($fo) => {
      // With new approach, foreignObject should NOT have text-anchor attribute
      expect($fo.attr('text-anchor')).to.be.undefined
      const textDiv = $fo.find('div')[0]
      expect(textDiv.style.textAlign).to.equal('left')
    })

    // Step 4: Get the SVG source to save manually
    cy.get('#tool_source').click()
    cy.get('#svg_source_textarea').then(($textarea) => {
      const svgContent = $textarea.val()
      cy.wrap(svgContent).as('savedSvg')
    })
    cy.get('#tool_source_cancel').click()

    // Step 5: Clear and reload the saved SVG (simulating page reload)
    cy.get('#tool_clear').click()
    cy.get('.ok').click()

    // Step 6: Load the saved SVG back
    cy.get('@savedSvg').then((svgContent) => {
      cy.get('#tool_source').click()
      cy.get('#svg_source_textarea').clear().type(svgContent, { parseSpecialCharSequences: false, delay: 0 })
      cy.get('#tool_source_save').click()
    })

    // Step 7: The bug is now fixed - check if text-align style is present on the div
    cy.get('foreignObject[se\\:type="text"]').should(($fo) => {
      // With new approach, foreignObject should NOT have text-anchor attribute
      expect($fo.attr('text-anchor')).to.be.undefined

      const textDiv = $fo.find('div')[0]
      const inlineStyle = textDiv.style.textAlign
      const computedStyle = window.getComputedStyle(textDiv).textAlign

      // Log what we actually see
      cy.log(`foreignObject text-anchor attribute: ${$fo.attr('text-anchor') || 'undefined (correct!)'}`)
      cy.log(`div inline style textAlign: "${inlineStyle}"`)
      cy.log(`div computed style textAlign: "${computedStyle}"`)
      cy.log(`div style attribute: ${textDiv.getAttribute('style')}`)

      // With the fix, the inline style should be 'left'
      expect(inlineStyle).to.equal('left', 'Text alignment should be stored in div style attribute')
    })

    // Step 8: Demonstrate that selecting the element fixes the alignment
    cy.get('#tool_select').click()
    cy.get('foreignObject[se\\:type="text"]').click()

    // Now it should work correctly after selection
    cy.get('foreignObject[se\\:type="text"]').should(($fo) => {
      const textDiv = $fo.find('div')[0]
      expect(textDiv.style.textAlign).to.equal('left', 'Text should be left-aligned after selecting element')
    })
  })

  it('BUG: Should reproduce with any text-anchor value (not just start)', function () {
    const testCases = [
      { anchor: 'start', expected: 'left', description: 'left-aligned' },
      { anchor: 'end', expected: 'right', description: 'right-aligned' }
    ]

    testCases.forEach((testCase, index) => {
      // Create text with specific alignment
      cy.get('#tool_text').click()
      cy.get('#svgcanvas').click(100, 100 + index * 60)
      cy.get('#text').type(`${testCase.description} text{enter}`, { force: true })
      cy.get('#tool_text_anchor').click({ force: true })
      cy.get(`se-list-item[value="${testCase.anchor}"]`).click({ force: true })

      // Verify it works before reload
      cy.get('foreignObject[se\\:type="text"]').eq(index).should(($fo) => {
        // With new approach, no text-anchor on foreignObject
        expect($fo.attr('text-anchor')).to.be.undefined
        const textDiv = $fo.find('div')[0]
        expect(textDiv.style.textAlign).to.equal(testCase.expected)
      })
    })

    // Save and reload
    cy.get('#tool_save').click()
    cy.reload()
    cy.get('#tool_text').should('be.visible')

    // Check if alignments are correct after reload (this should now pass with the fix)
    testCases.forEach((testCase, index) => {
      cy.get('foreignObject[se\\:type="text"]').eq(index).should(($fo) => {
        // With new approach, no text-anchor on foreignObject
        expect($fo.attr('text-anchor')).to.be.undefined

        const textDiv = $fo.find('div')[0]
        const actualAlign = textDiv.style.textAlign || window.getComputedStyle(textDiv).textAlign

        // Log for debugging
        cy.log(`${testCase.description}: Expected ${testCase.expected}, Got ${actualAlign}`)

        // This should pass with the fix
        expect(actualAlign).to.equal(testCase.expected, `${testCase.description} text should be visually correct immediately after page reload`)
      })
    })
  })

  it('VERIFICATION: Selecting elements should apply correct alignment (this should always pass)', function () {
    // Create some test data first
    cy.get('#tool_text').click()
    cy.get('#svgcanvas').click(150, 200)
    cy.get('#text').type('Left text for selection test{enter}', { force: true })
    cy.get('#tool_text_anchor').click({ force: true })
    cy.get('se-list-item[value="start"]').click({ force: true })

    cy.get('#tool_save').click()
    cy.reload()
    cy.get('#tool_text').should('be.visible')

    // This part should always work (selecting element fixes alignment)
    cy.get('#tool_select').click()
    cy.get('foreignObject[se\\:type="text"]').click()

    // After selection, alignment should be correct
    cy.get('foreignObject[se\\:type="text"]').should(($fo) => {
      const textDiv = $fo.find('div')[0]
      expect(textDiv.style.textAlign).to.equal('left', 'Selecting element should fix the alignment')
    })

    // TopPanel should show correct value
    cy.get('#tool_text_anchor').should('have.attr', 'value', 'start')
  })

  it('DEBUG: Show actual vs expected CSS values on page load', function () {
    // Create test text
    cy.get('#tool_text').click()
    cy.get('#svgcanvas').click(300, 100)
    cy.get('#text').type('Debug alignment test{enter}', { force: true })
    cy.get('#tool_text_anchor').click({ force: true })
    cy.get('se-list-item[value="start"]').click({ force: true })

    cy.get('#tool_save').click()
    cy.reload()
    cy.get('#tool_text').should('be.visible')

    // Debug information
    cy.get('foreignObject[se\\:type="text"]').then(($fo) => {
      const textDiv = $fo.find('div')[0]
      const inlineStyle = textDiv.style.textAlign
      const computedStyle = window.getComputedStyle(textDiv).textAlign
      const attribute = $fo.attr('text-anchor')

      cy.log('=== DEBUG INFO ===')
      cy.log(`foreignObject text-anchor attribute: ${attribute || 'undefined (correct!)'}`)
      cy.log(`Inline style textAlign: "${inlineStyle}"`)
      cy.log(`Computed style textAlign: "${computedStyle}"`)
      cy.log(`Element innerHTML: ${textDiv.innerHTML}`)
      cy.log(`Element outerHTML: ${textDiv.outerHTML}`)

      // Force the test to fail with debug info if alignment is wrong
      if (inlineStyle !== 'left' && computedStyle !== 'left') {
        throw new Error(`BUG DETECTED: Expected left alignment but visual alignment is "${computedStyle}" (inline: "${inlineStyle}")`)
      }
    })
  })
})
