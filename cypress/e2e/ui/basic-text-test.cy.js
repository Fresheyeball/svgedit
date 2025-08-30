/* eslint-env node */
import { visitAndApproveStorage } from '../../support/ui-test-helper.js'

describe('Basic Text Creation Test', function () {
  before(() => {
    // Handle uncaught exceptions from SVGEdit
    cy.on('uncaught:exception', (err, runnable) => {
      // Don't fail the test on SVGEdit internal errors
      console.log('Ignoring error:', err.message)
      return false
    })

    visitAndApproveStorage()
  })

  it('should create a text element when clicking on canvas', function () {
    // Click the text tool
    cy.get('#tool_text').click()

    // Click on the canvas to create text
    cy.get('#svgcanvas').click(200, 150)

    // Wait a moment for element to be created
    cy.wait(1000)

    // Verify the new text styling approach
    cy.get('foreignObject[se\\:type="text"]').should(($fo) => {
      expect($fo.length).to.equal(1)

      const foreignObject = $fo[0]
      const textDiv = foreignObject.querySelector('div')

      // Verify foreignObject has NO styling attributes (new approach)
      expect(foreignObject.getAttribute('font-family')).to.be.null
      expect(foreignObject.getAttribute('font-size')).to.be.null
      expect(foreignObject.getAttribute('text-anchor')).to.be.null
      expect(foreignObject.getAttribute('font-weight')).to.be.null
      expect(foreignObject.getAttribute('font-style')).to.be.null
      expect(foreignObject.getAttribute('text-decoration')).to.be.null
      expect(foreignObject.getAttribute('fill')).to.be.null

      // Verify foreignObject only has positioning and identification attributes
      expect(foreignObject.getAttribute('se:type')).to.equal('text')
      expect(foreignObject.getAttribute('x')).to.not.be.null
      expect(foreignObject.getAttribute('y')).to.not.be.null
      expect(foreignObject.getAttribute('width')).to.not.be.null
      expect(foreignObject.getAttribute('height')).to.not.be.null

      // Verify div has all styling in CSS
      expect(textDiv).to.not.be.null
      expect(textDiv.style.fontFamily).to.not.be.empty
      expect(textDiv.style.fontSize).to.not.be.empty
      expect(textDiv.style.color).to.not.be.empty
      expect(textDiv.style.textAlign).to.equal('center') // Default alignment
      expect(textDiv.style.fontWeight).to.equal('normal')
      expect(textDiv.style.fontStyle).to.equal('normal')
      expect(textDiv.style.textDecoration).to.equal('none')
    })
  })

  it('should set text alignment using TopPanel controls', function () {
    // Create text element first
    cy.get('#tool_text').click()
    cy.get('#svgcanvas').click(200, 150)
    cy.get('#text').type('Test alignment{enter}', { force: true })

    // Change alignment to left
    cy.get('#tool_text_anchor').click({ force: true })
    cy.get('se-list-item[value="start"]').click({ force: true })

    // Verify alignment is stored in div style, not foreignObject attribute
    cy.get('foreignObject[se\\:type="text"]').should(($fo) => {
      const foreignObject = $fo[0]
      const textDiv = foreignObject.querySelector('div')

      // Verify no text-anchor attribute on foreignObject
      expect(foreignObject.getAttribute('text-anchor')).to.be.null

      // Verify text-align style is set on div
      expect(textDiv.style.textAlign).to.equal('left')
    })
  })
})
