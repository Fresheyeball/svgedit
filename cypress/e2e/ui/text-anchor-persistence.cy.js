/* eslint-env node */
describe('Text Anchor Persistence', function () {
  beforeEach(() => {
    cy.visit('/src/editor/index.html')
    // Wait for SVGEdit to load completely
    cy.get('#tool_text').should('be.visible')
  })

  /**
   * Test that text alignment is properly applied immediately after loading an SVG,
   * without requiring user interaction with TopPanel controls.
   * This addresses the bug where left-aligned text was not visually left-aligned
   * on page reload until the user interacted with the anchor text controls.
   */
  it('should display text alignment correctly immediately after loading SVG', function () {
    // Step 1: Create a text element with specific alignment
    cy.get('#tool_text').click()
    cy.get('#svgcanvas').click(100, 100)
    cy.get('#text').type('Test Left Alignment{enter}', { force: true })

    // Step 2: Set text to left alignment using TopPanel
    cy.get('#tool_text_anchor').select('start')

    // Step 3: Verify the text is left-aligned in CSS only (no attribute on foreignObject)
    cy.get('foreignObject[se\\:type="text"]').should(($fo) => {
      expect($fo.attr('text-anchor')).to.be.undefined
      const textDiv = $fo.find('div')[0]
      expect(textDiv.style.textAlign).to.equal('left')
    })

    // Step 4: Save the document
    cy.get('#tool_save').click()

    // Step 5: Clear the canvas and load the saved document
    cy.get('#tool_clear').click()
    cy.get('.cancel').click()

    // Step 6: Load from localStorage (simulate reload)
    // SVGEdit auto-saves to localStorage, so we can reload the page
    cy.reload()

    // Wait for the editor to load
    cy.get('#tool_text').should('be.visible')

    // Step 7: Verify that text alignment is immediately correct after loading
    // This is the key test - the text should be visually aligned without user interaction
    cy.get('foreignObject[se\\:type="text"]').should(($fo) => {
      // Verify no attribute on foreignObject (new approach)
      expect($fo.attr('text-anchor')).to.be.undefined

      // Verify the CSS style is correctly applied (this was the bug)
      const textDiv = $fo.find('div')[0]
      expect(textDiv.style.textAlign).to.equal('left')
    })
  })

  it('should maintain correct alignment for all anchor values after reload', function () {
    const alignmentTests = [
      { anchor: 'start', cssAlign: 'left', testText: 'Left Aligned Text' },
      { anchor: 'middle', cssAlign: 'center', testText: 'Center Aligned Text' },
      { anchor: 'end', cssAlign: 'right', testText: 'Right Aligned Text' }
    ]

    alignmentTests.forEach((test, index) => {
      // Create text element
      cy.get('#tool_text').click()
      cy.get('#svgcanvas').click(100 + index * 50, 100 + index * 50)
      cy.get('#text').clear().type(`${test.testText}{enter}`, { force: true })

      // Set alignment
      cy.get('#tool_text_anchor').select(test.anchor)

      // Verify alignment is set correctly
      cy.get('foreignObject[se\\:type="text"]').eq(index).should(($fo) => {
        expect($fo.attr('text-anchor')).to.be.undefined
        const textDiv = $fo.find('div')[0]
        expect(textDiv.style.textAlign).to.equal(test.cssAlign)
      })
    })

    // Save and reload
    cy.get('#tool_save').click()
    cy.reload()
    cy.get('#tool_text').should('be.visible')

    // Verify all alignments are still correct after reload
    alignmentTests.forEach((test, index) => {
      cy.get('foreignObject[se\\:type="text"]').eq(index).should(($fo) => {
        expect($fo.attr('text-anchor')).to.be.undefined
        const textDiv = $fo.find('div')[0]
        expect(textDiv.style.textAlign).to.equal(test.cssAlign)
      })
    })
  })

  it('should correctly update TopPanel UI controls after loading SVG with text alignment', function () {
    // Create and align text
    cy.get('#tool_text').click()
    cy.get('#svgcanvas').click(200, 200)
    cy.get('#text').type('Center Test Text{enter}', { force: true })
    cy.get('#tool_text_anchor').select('middle')

    // Save and reload
    cy.get('#tool_save').click()
    cy.reload()
    cy.get('#tool_text').should('be.visible')

    // Select the text element
    cy.get('#tool_select').click()
    cy.get('foreignObject[se\\:type="text"]').click()

    // Verify TopPanel shows correct alignment in UI
    cy.get('#tool_text_anchor').should('have.attr', 'value', 'middle')

    // Verify the visual alignment is correct
    cy.get('foreignObject[se\\:type="text"]').should(($fo) => {
      const textDiv = $fo.find('div')[0]
      expect(textDiv.style.textAlign).to.equal('center')
    })
  })

  it('should sync CSS styles when TopPanel context is updated', function () {
    // This test verifies that the fix in updateContextPanel correctly applies CSS styles

    // Create text with alignment
    cy.get('#tool_text').click()
    cy.get('#svgcanvas').click(150, 150)
    cy.get('#text').type('Sync Test{enter}', { force: true })
    cy.get('#tool_text_anchor').select('end')

    // Programmatically remove the CSS style (simulate the bug condition)
    cy.get('foreignObject[se\\:type="text"] div').then(($div) => {
      $div[0].style.textAlign = ''
    })

    // Click away and back to trigger context panel update
    cy.get('#tool_select').click()
    cy.get('#svgcanvas').click(50, 50) // Click empty area
    cy.get('foreignObject[se\\:type="text"]').click() // Reselect text

    // Verify that the CSS style is restored by the context panel update
    cy.get('foreignObject[se\\:type="text"] div').should(($div) => {
      expect($div[0].style.textAlign).to.equal('right')
    })
  })

  it('should handle missing or invalid text-anchor attributes gracefully', function () {
    // Create text element
    cy.get('#tool_text').click()
    cy.get('#svgcanvas').click(100, 300)
    cy.get('#text').type('Default Alignment{enter}', { force: true })

    // Programmatically remove text-anchor attribute
    cy.get('foreignObject[se\\:type="text"]').then(($fo) => {
      $fo[0].removeAttribute('text-anchor')
    })

    // Trigger context panel update
    cy.get('#svgcanvas').click(50, 50)
    cy.get('foreignObject[se\\:type="text"]').click()

    // Should default to left alignment
    cy.get('foreignObject[se\\:type="text"] div').should(($div) => {
      expect($div[0].style.textAlign).to.equal('left')
    })

    // TopPanel should show default value
    cy.get('#tool_text_anchor').should('have.attr', 'value', 'middle') // default fallback
  })

  it('should work correctly when switching between different text elements', function () {
    // Create multiple text elements with different alignments
    const elements = [
      { x: 50, y: 50, text: 'Left', anchor: 'start', align: 'left' },
      { x: 50, y: 100, text: 'Center', anchor: 'middle', align: 'center' },
      { x: 50, y: 150, text: 'Right', anchor: 'end', align: 'right' }
    ]

    elements.forEach((el, index) => {
      cy.get('#tool_text').click()
      cy.get('#svgcanvas').click(el.x, el.y)
      cy.get('#text').type(`${el.text}{enter}`, { force: true })
      cy.get('#tool_text_anchor').select(el.anchor)
    })

    // Select each element and verify TopPanel and CSS are correct
    elements.forEach((el, index) => {
      cy.get('#tool_select').click()
      cy.get('foreignObject[se\\:type="text"]').eq(index).click()

      // Verify TopPanel shows correct value
      cy.get('#tool_text_anchor').should('have.attr', 'value', el.anchor)

      // Verify CSS is correct
      cy.get('foreignObject[se\\:type="text"]').eq(index).should(($fo) => {
        const textDiv = $fo.find('div')[0]
        expect(textDiv.style.textAlign).to.equal(el.align)
      })
    })
  })
})
