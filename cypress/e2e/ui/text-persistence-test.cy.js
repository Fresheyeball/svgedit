/* eslint-env node */
import { visitAndApproveStorage } from '../../support/ui-test-helper.js'

describe('Text Style Persistence Test', function () {
  before(() => {
    cy.on('uncaught:exception', (err, runnable) => {
      console.log('Ignoring error:', err.message)
      return false
    })

    visitAndApproveStorage()
  })

  it('should persist text alignment after browser refresh', function () {
    // Create text element first
    cy.get('#tool_text').click()
    cy.get('#svgcanvas').click(200, 150)
    cy.get('#text').type('Test persistence text{enter}', { force: true })
    
    // Change alignment to left
    cy.get('#tool_text_anchor').click({ force: true })
    cy.get('se-list-item[value="start"]').click({ force: true })
    
    // Verify alignment is set correctly before refresh
    cy.get('foreignObject[se\\:type="text"]').should(($fo) => {
      const foreignObject = $fo[0]
      const textDiv = foreignObject.querySelector('div')
      
      expect(textDiv.style.textAlign).to.equal('left')
    })
    
    // Simulate save by getting SVG string and setting it back (this simulates the localStorage save/load process)
    cy.window().then((win) => {
      const svgString = win.svgCanvas.getSvgString()
      cy.log('SVG string contains:', svgString.substring(0, 200) + '...')
      
      // Clear and reload the SVG (simulates refresh)
      win.svgCanvas.setSvgString(svgString)
    })
    
    // Wait a moment for processing
    cy.wait(500)
    
    // Verify alignment is still correct after reload
    cy.get('foreignObject[se\\:type="text"]').should(($fo) => {
      const foreignObject = $fo[0]
      const textDiv = foreignObject.querySelector('div')
      
      // This should work with the fix
      expect(textDiv.style.textAlign).to.equal('left', 'Text alignment should persist after setSvgString')
      
      // Also check that the style attribute contains the alignment
      const styleAttr = textDiv.getAttribute('style')
      expect(styleAttr).to.include('text-align')
    })
  })

  it('should persist multiple text style properties', function () {
    // Create text with multiple styling properties
    cy.get('#tool_text').click()
    cy.get('#svgcanvas').click(300, 200)
    cy.get('#text').type('Styled text{enter}', { force: true })
    
    // Apply multiple styles
    cy.get('#tool_bold').click({ force: true })
    cy.get('#tool_italic').click({ force: true })
    cy.get('#tool_text_anchor').click({ force: true })
    cy.get('se-list-item[value="end"]').click({ force: true })
    
    // Verify styles are applied
    cy.get('foreignObject[se\\:type="text"]').should(($fo) => {
      const textDiv = $fo[0].querySelector('div')
      expect(textDiv.style.fontWeight).to.contain('bold')
      expect(textDiv.style.fontStyle).to.equal('italic')
      expect(textDiv.style.textAlign).to.equal('right')
    })
    
    // Simulate save/load cycle
    cy.window().then((win) => {
      const svgString = win.svgCanvas.getSvgString()
      win.svgCanvas.setSvgString(svgString)
    })
    
    cy.wait(500)
    
    // Verify all styles persist
    cy.get('foreignObject[se\\:type="text"]').should(($fo) => {
      const textDiv = $fo[0].querySelector('div')
      expect(textDiv.style.fontWeight).to.contain('bold', 'Bold should persist')
      expect(textDiv.style.fontStyle).to.equal('italic', 'Italic should persist')
      expect(textDiv.style.textAlign).to.equal('right', 'Right alignment should persist')
    })
  })
})