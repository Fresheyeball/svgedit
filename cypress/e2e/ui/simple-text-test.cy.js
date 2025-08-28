import {
  visitAndApproveStorage
} from '../../support/ui-test-helper.js'

describe('Simple Text Test', { testIsolation: false }, function () {
  before(() => {
    visitAndApproveStorage()
  })

  it('should create a text element', function () {
    // Clear the canvas
    cy.get('#tool_source').click({ force: true })
    cy.get('#svg_source_textarea')
      .type('{selectall}', { force: true })
      .type(`<svg width="640" height="480" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg" xmlns:svg="http://www.w3.org/2000/svg" xmlns:se="http://svg-edit.googlecode.com">
      <g class="layer">
       <title>Layer 1</title>
       </g>
     </svg>`, { force: true, parseSpecialCharSequences: false })
    cy.get('#tool_source_save').click({ force: true })

    // Create text element
    cy.get('#tool_text').click({ force: true })
    cy.get('#svgroot').trigger('mousedown', { clientX: 300, clientY: 200, force: true })
      .trigger('mouseup', { force: true })

    // Check if text input appears
    cy.get('#text').should('be.visible')
    cy.get('#text').type('Hello World', { force: true })

    // Check for text element creation
    cy.get('svg', { timeout: 5000 }).then(($svg) => {
      cy.log('SVG content:', $svg[0].outerHTML)
    })

    cy.get('[se\\:type="text"]', { timeout: 10000 }).should('exist')
  })
})
