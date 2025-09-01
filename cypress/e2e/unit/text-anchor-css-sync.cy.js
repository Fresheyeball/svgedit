/* eslint-env node */
/**
 * Unit test for text anchor CSS synchronization fix.
 * Tests the specific fix added to TopPanel.js updateContextPanel method
 * that ensures CSS text-align styles match text-anchor attributes.
 */
describe('Text Anchor CSS Synchronization', function () {
  beforeEach(() => {
    cy.visit('/src/editor/index.html')
    cy.get('#tool_text').should('be.visible')
  })

  it('should synchronize CSS text-align with text-anchor attribute during context panel update', function () {
    // Create a foreignObject text element with specific alignment
    cy.get('#tool_text').click()
    cy.get('#svgcanvas').click(100, 100)
    cy.get('#text').type('Test Text{enter}', { force: true })
    cy.get('#tool_text_anchor').select('start')

    // Get reference to the elements
    cy.get('foreignObject[se\\:type="text"]').as('foreignObject')
    cy.get('@foreignObject').find('div').as('textDiv')

    // Verify initial state
    cy.get('@foreignObject').should('have.attr', 'text-anchor', 'start')
    cy.get('@textDiv').should(($div) => {
      expect($div[0].style.textAlign).to.equal('left')
    })

    // Simulate the bug: manually clear the CSS style while keeping the attribute
    cy.get('@textDiv').then(($div) => {
      $div[0].style.textAlign = ''
    })

    // Verify CSS style is gone (simulating the bug condition)
    cy.get('@textDiv').should(($div) => {
      expect($div[0].style.textAlign).to.equal('')
    })

    // But attribute is still there
    cy.get('@foreignObject').should('have.attr', 'text-anchor', 'start')

    // Trigger context panel update by selecting another element and back
    cy.get('#tool_select').click()
    cy.get('#svgcanvas').click(300, 300) // Click empty space
    cy.get('@foreignObject').click() // Reselect the text element

    // The fix should have restored the CSS style
    cy.get('@textDiv').should(($div) => {
      expect($div[0].style.textAlign).to.equal('left')
    })
  })

  it('should handle all text-anchor values correctly', function () {
    const testCases = [
      { anchor: 'start', expectedCSS: 'left' },
      { anchor: 'middle', expectedCSS: 'center' },
      { anchor: 'end', expectedCSS: 'right' },
      { anchor: 'justify', expectedCSS: 'justify' }
    ]

    testCases.forEach((testCase, index) => {
      // Create text element
      cy.get('#tool_text').click()
      cy.get('#svgcanvas').click(100 + index * 50, 100 + index * 30)
      cy.get('#text').type(`${testCase.anchor} text{enter}`, { force: true })

      // Set alignment
      cy.get('#tool_text_anchor').select(testCase.anchor)

      // Clear CSS style to simulate bug
      cy.get('foreignObject[se\\:type="text"]').eq(index).find('div').then(($div) => {
        $div[0].style.textAlign = ''
      })

      // Trigger context panel update
      cy.get('#tool_select').click()
      cy.get('#svgcanvas').click(50, 50)
      cy.get('foreignObject[se\\:type="text"]').eq(index).click()

      // Verify fix applied correct CSS
      cy.get('foreignObject[se\\:type="text"]').eq(index).find('div').should(($div) => {
        expect($div[0].style.textAlign).to.equal(testCase.expectedCSS)
      })
    })
  })

  it('should default to left alignment for missing text-anchor', function () {
    // Create text element
    cy.get('#tool_text').click()
    cy.get('#svgcanvas').click(200, 200)
    cy.get('#text').type('No anchor attribute{enter}', { force: true })

    // Remove text-anchor attribute
    cy.get('foreignObject[se\\:type="text"]').then(($fo) => {
      $fo[0].removeAttribute('text-anchor')
    })

    // Clear CSS to simulate loading from SVG without proper CSS
    cy.get('foreignObject[se\\:type="text"] div').then(($div) => {
      $div[0].style.textAlign = ''
    })

    // Trigger context panel update
    cy.get('#tool_select').click()
    cy.get('#svgcanvas').click(50, 50)
    cy.get('foreignObject[se\\:type="text"]').click()

    // Should default to left alignment
    cy.get('foreignObject[se\\:type="text"] div').should(($div) => {
      expect($div[0].style.textAlign).to.equal('left')
    })
  })

  it('should work after loading SVG with existing text-anchor attributes', function () {
    // Simulate loading SVG content by directly creating elements
    const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" xmlns:se="http://svg-edit.googlecode.com" width="640" height="480">
        <g class="layer">
          <title>Layer 1</title>
          <foreignObject x="100" y="100" width="200" height="40" se:type="text" text-anchor="end" font-size="16">
            <div xmlns="http://www.w3.org/1999/xhtml" style="width: 100%; height: 100%; font-size: 16px; display: block; overflow-wrap: break-word; padding: 4px; box-sizing: border-box; cursor: text; min-height: 100%; outline: none;">Loaded Text</div>
          </foreignObject>
        </g>
      </svg>
    `

    // Load the SVG
    cy.get('#tool_source').click()
    cy.get('#svg_source_textarea').clear().type(svgContent, { parseSpecialCharSequences: false, delay: 0 })
    cy.get('#tool_source_save').click()

    // Verify the element exists with correct attribute but potentially missing CSS
    cy.get('foreignObject[se\\:type="text"]').should('have.attr', 'text-anchor', 'end')

    // Select the loaded text element to trigger context panel update
    cy.get('#tool_select').click()
    cy.get('foreignObject[se\\:type="text"]').click()

    // The fix should ensure CSS style is applied
    cy.get('foreignObject[se\\:type="text"] div').should(($div) => {
      expect($div[0].style.textAlign).to.equal('right')
    })

    // TopPanel should show correct value
    cy.get('#tool_text_anchor').should('have.attr', 'value', 'end')
  })

  it('should preserve existing CSS when text-anchor matches', function () {
    // Create text with alignment
    cy.get('#tool_text').click()
    cy.get('#svgcanvas').click(150, 150)
    cy.get('#text').type('Preserve CSS Test{enter}', { force: true })
    cy.get('#tool_text_anchor').select('middle')

    // Verify initial state is correct
    cy.get('foreignObject[se\\:type="text"] div').should(($div) => {
      expect($div[0].style.textAlign).to.equal('center')
    })

    // Trigger context panel update
    cy.get('#tool_select').click()
    cy.get('#svgcanvas').click(50, 50)
    cy.get('foreignObject[se\\:type="text"]').click()

    // CSS should still be correct (not changed/overridden)
    cy.get('foreignObject[se\\:type="text"] div').should(($div) => {
      expect($div[0].style.textAlign).to.equal('center')
    })
  })
})
