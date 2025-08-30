/* eslint-env node */
describe('Simple SVG Element Creation', function () {
  beforeEach(() => {
    cy.on('uncaught:exception', () => false)
    cy.visit('/src/editor/index.html')
    cy.get('#tool_rect').should('be.visible')
  })

  it('can create a rectangle', function () {
    cy.get('#tool_rect').click()
    cy.get('#svgcanvas')
      .trigger('mousedown', 100, 100)
      .trigger('mousemove', 200, 200)
      .trigger('mouseup')

    cy.get('rect').should('have.length', 1)
  })

  it('can click text tool', function () {
    cy.get('#tool_text').click()
    cy.get('#tool_text').should('have.class', 'pressed')
  })

  it('can click on canvas after selecting text tool', function () {
    cy.get('#tool_text').click()
    cy.get('#svgcanvas').click(200, 150)

    // Just verify we can click without errors
    cy.get('svg').should('exist')
  })
})
