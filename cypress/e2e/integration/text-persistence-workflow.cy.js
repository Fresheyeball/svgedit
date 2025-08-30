/* eslint-env node */
import { visitAndApproveStorage } from '../../support/ui-test-helper.js'

describe('Text Persistence Complete Workflow Integration Tests', function () {
  before(() => {
    cy.on('uncaught:exception', (err, runnable) => {
      console.log('Ignoring error:', err.message)
      return false
    })

    visitAndApproveStorage()
  })

  it('should handle the complete text styling workflow end-to-end', function () {
    // Step 1: Create text and verify initial state
    cy.get('#tool_text').click()
    cy.get('#svgcanvas').click(200, 150)
    cy.get('#text').type('Complete workflow test{enter}', { force: true })

    // Verify text was created with default styling
    cy.get('foreignObject[se\\:type="text"]').should(($fo) => {
      const textDiv = $fo[0].querySelector('div')
      expect(textDiv).to.not.be.null // eslint-disable-line no-unused-expressions
      expect(textDiv.style.textAlign).to.equal('center') // Default alignment // eslint-disable-line no-unused-expressions
    })

    // Step 2: Change styling through TopPanel
    cy.get('#tool_bold').click({ force: true })
    cy.get('#tool_italic').click({ force: true })
    cy.get('#tool_text_anchor').click({ force: true })
    cy.get('se-list-item[value="start"]').click({ force: true })

    // Verify styling was applied immediately
    cy.get('foreignObject[se\\:type="text"]').should(($fo) => {
      const textDiv = $fo[0].querySelector('div')
      expect(textDiv.style.fontWeight).to.contain('bold')
      expect(textDiv.style.fontStyle).to.equal('italic')
      expect(textDiv.style.textAlign).to.equal('left')
    })

    // Step 3: Test getSvgString() preserves styles in encoding
    cy.window().then((win) => {
      const svgString = win.svgCanvas.getSvgString()

      // Verify SVG string contains the styles
      expect(svgString).to.include('foreignObject')
      expect(svgString).to.include('se:type="text"')
      expect(svgString).to.include('font-weight')
      expect(svgString).to.include('bold')
      expect(svgString).to.include('font-style')
      expect(svgString).to.include('italic')
      expect(svgString).to.include('text-align')
      expect(svgString).to.include('left')

      return svgString
    }).as('savedSvg')

    // Step 4: Clear the canvas
    cy.window().then((win) => {
      win.svgCanvas.clear()
    })

    // Verify canvas is cleared
    cy.get('foreignObject[se\\:type="text"]').should('not.exist')

    // Step 5: Reload from saved SVG
    cy.get('@savedSvg').then((svgString) => {
      cy.window().then((win) => {
        const success = win.svgCanvas.setSvgString(svgString)
        expect(success).to.not.equal(false, 'setSvgString should succeed')
      })
    })

    // Wait for restoration process
    cy.wait(500)

    // Step 6: Verify styles were restored correctly
    cy.get('foreignObject[se\\:type="text"]').should(($fo) => {
      const foreignObject = $fo[0]
      const textDiv = foreignObject.querySelector('div')

      // Verify text content was restored
      expect(textDiv.textContent.trim()).to.equal('Complete workflow test')

      // Verify all styles were restored
      expect(textDiv.style.fontWeight).to.contain('bold', 'Bold should be restored')
      expect(textDiv.style.fontStyle).to.equal('italic', 'Italic should be restored')
      expect(textDiv.style.textAlign).to.equal('left', 'Left alignment should be restored')

      // Verify foreignObject has no styling attributes (clean architecture)
      expect(foreignObject.getAttribute('font-weight')).to.be.null // eslint-disable-line no-unused-expressions
      expect(foreignObject.getAttribute('font-style')).to.be.null // eslint-disable-line no-unused-expressions
      expect(foreignObject.getAttribute('text-anchor')).to.be.null // eslint-disable-line no-unused-expressions

      // Verify computed styles work (visual verification)
      const computedStyle = window.getComputedStyle(textDiv)
      expect(computedStyle.fontWeight).to.satisfy((weight) =>
        weight === 'bold' || parseInt(weight) >= 700, 'Computed font weight should be bold')
      expect(computedStyle.fontStyle).to.equal('italic', 'Computed font style should be italic')
      expect(computedStyle.textAlign).to.equal('left', 'Computed text align should be left')
    })

    // Step 7: Test TopPanel synchronization
    // The TopPanel should reflect the restored styles
    cy.get('#tool_bold').should('have.class', 'pressed')
    cy.get('#tool_italic').should('have.class', 'pressed')
    cy.get('#tool_text_anchor').should('have.attr', 'value', 'start')

    // Step 8: Test that changes still work after restoration
    cy.get('#tool_text_anchor').click({ force: true })
    cy.get('se-list-item[value="end"]').click({ force: true })

    // Verify the change was applied
    cy.get('foreignObject[se\\:type="text"]').should(($fo) => {
      const textDiv = $fo[0].querySelector('div')
      expect(textDiv.style.textAlign).to.equal('right', 'Should be able to change alignment after restoration')
    })
  })

  it('should handle browser refresh simulation with localStorage', function () {
    // Create and style text
    cy.get('#tool_text').click()
    cy.get('#svgcanvas').click(300, 200)
    cy.get('#text').type('Browser refresh test{enter}', { force: true })

    cy.get('#tool_text_anchor').click({ force: true })
    cy.get('se-list-item[value="middle"]').click({ force: true })
    cy.get('#tool_bold').click({ force: true })

    // Trigger storage save (simulate what happens before page unload)
    cy.window().then((win) => {
      const svgString = win.svgCanvas.getSvgString()
      const canvasName = win.svgEditor.configObj.curConfig.canvasName || 'default'
      const storageKey = `svgedit-${canvasName}`

      // Simulate the storage save that happens on beforeunload
      if (win.localStorage) {
        win.localStorage.setItem(storageKey, svgString)
        cy.log('Saved to localStorage:', storageKey)
      }
    })

    // Simulate page refresh by clearing canvas and reloading from storage
    cy.window().then((win) => {
      win.svgCanvas.clear()

      const canvasName = win.svgEditor.configObj.curConfig.canvasName || 'default'
      const storageKey = `svgedit-${canvasName}`
      const cached = win.localStorage.getItem(storageKey)

      if (cached) {
        const success = win.svgCanvas.setSvgString(cached)
        expect(success).to.not.equal(false, 'Should load from localStorage')
      }
    })

    cy.wait(500)

    // Verify text and styles persist after simulated refresh
    cy.get('foreignObject[se\\:type="text"]').should(($fo) => {
      const textDiv = $fo[0].querySelector('div')
      expect(textDiv.textContent.trim()).to.equal('Browser refresh test')
      expect(textDiv.style.textAlign).to.equal('center', 'Center alignment should persist')
      expect(textDiv.style.fontWeight).to.contain('bold', 'Bold should persist')
    })
  })

  it('should handle multiple text elements with different comprehensive styles', function () {
    // Create multiple text elements with different comprehensive styles
    const textElements = [
      { x: 100, y: 100, text: 'Left Bold', align: 'start', bold: true, italic: false, underline: false },
      { x: 100, y: 150, text: 'Center Italic Underline', align: 'middle', bold: false, italic: true, underline: true },
      { x: 100, y: 200, text: 'Right Bold Italic', align: 'end', bold: true, italic: true, underline: false },
      { x: 100, y: 250, text: 'Justify All Styles', align: 'justify', bold: true, italic: true, underline: true }
    ]

    textElements.forEach((element, index) => {
      // Create text element
      cy.get('#tool_text').click()
      cy.get('#svgcanvas').click(element.x, element.y)
      cy.get('#text').type(`${element.text}{enter}`, { force: true })

      // Apply styles
      if (element.bold) {
        cy.get('#tool_bold').click({ force: true })
      }
      if (element.italic) {
        cy.get('#tool_italic').click({ force: true })
      }
      if (element.underline) {
        cy.get('#tool_text_decoration_underline').click({ force: true })
      }
      cy.get('#tool_text_anchor').click({ force: true })
      cy.get(`se-list-item[value="${element.align}"]`).click({ force: true })
    })

    // Verify all elements exist with correct styles
    cy.get('foreignObject[se\\:type="text"]').should('have.length', 4)

    // Save and restore
    cy.window().then((win) => {
      const svgString = win.svgCanvas.getSvgString()
      win.svgCanvas.clear()

      cy.wait(100)

      const success = win.svgCanvas.setSvgString(svgString)
      expect(success).to.not.equal(false)
    })

    cy.wait(500)

    // Verify all elements restored correctly
    cy.get('foreignObject[se\\:type="text"]').should('have.length', 4)

    // Verify each element has correct styles
    textElements.forEach((element, index) => {
      cy.get('foreignObject[se\\:type="text"]').eq(index).should(($fo) => {
        const textDiv = $fo[0].querySelector('div')
        expect(textDiv.textContent.trim()).to.equal(element.text)

        const expectedAlign = { start: 'left', middle: 'center', end: 'right', justify: 'justify' }[element.align]
        expect(textDiv.style.textAlign).to.equal(expectedAlign)

        if (element.bold) {
          expect(textDiv.style.fontWeight).to.contain('bold')
        }
        if (element.italic) {
          expect(textDiv.style.fontStyle).to.equal('italic')
        }
        if (element.underline) {
          expect(textDiv.style.textDecoration).to.include('underline')
        }
      })
    })
  })

  it('should handle complex style combinations and edge cases', function () {
    // Test with complex styling that might break serialization
    cy.get('#tool_text').click()
    cy.get('#svgcanvas').click(400, 300)
    cy.get('#text').type('Complex styling test with "quotes" & symbols!{enter}', { force: true })

    // Apply all possible styles
    cy.get('#tool_bold').click({ force: true })
    cy.get('#tool_italic').click({ force: true })
    cy.get('#tool_text_anchor').click({ force: true })
    cy.get('se-list-item[value="start"]').click({ force: true })

    // Test save/restore with complex content
    cy.window().then((win) => {
      const svgString = win.svgCanvas.getSvgString()

      // Verify SVG handles special characters in serialization
      expect(svgString).to.include('Complex styling test')
      expect(svgString).to.include('quotes')

      const success = win.svgCanvas.setSvgString(svgString)
      expect(success).to.not.equal(false)
    })

    cy.wait(500)

    // Verify complex text and styles are preserved
    cy.get('foreignObject[se\\:type="text"]').should(($fo) => {
      const textDiv = $fo[0].querySelector('div')
      expect(textDiv.textContent).to.include('Complex styling test')
      expect(textDiv.textContent).to.include('"quotes"')
      expect(textDiv.textContent).to.include('&')
      expect(textDiv.style.fontWeight).to.contain('bold')
      expect(textDiv.style.fontStyle).to.equal('italic')
      expect(textDiv.style.textAlign).to.equal('left')
    })
  })
})
