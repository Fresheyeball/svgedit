/* eslint-env node */
import { visitAndApproveStorage } from '../../support/ui-test-helper.js'

describe('Text Style Encoding and Restoration Tests', function () {
  before(() => {
    cy.on('uncaught:exception', (err, runnable) => {
      console.log('Ignoring error:', err.message)
      return false
    })

    visitAndApproveStorage()
  })

  it('should encode text styles in SVG string correctly', function () {
    // Create text element with various styles
    cy.get('#tool_text').click()
    cy.get('#svgcanvas').click(200, 150)
    cy.get('#text').type('Test encoding text{enter}', { force: true })

    // Apply multiple styles
    cy.get('#tool_bold').click({ force: true })
    cy.get('#tool_italic').click({ force: true })
    cy.get('#tool_text_anchor').click({ force: true })
    cy.get('se-list-item[value="start"]').click({ force: true })

    // Get SVG string and verify it contains the styles
    cy.window().then((win) => {
      const svgString = win.svgCanvas.getSvgString()
      cy.log('Generated SVG:', svgString)

      // Verify the SVG contains foreignObject with se:type="text"
      expect(svgString).to.include('foreignObject')
      expect(svgString).to.include('se:type="text"')

      // Verify the SVG contains div with style attribute
      expect(svgString).to.include('<div')
      expect(svgString).to.include('style=')

      // Verify specific styles are encoded
      expect(svgString).to.include('font-weight')
      expect(svgString).to.include('bold')
      expect(svgString).to.include('font-style')
      expect(svgString).to.include('italic')
      expect(svgString).to.include('text-align')
      expect(svgString).to.include('left')

      // Verify no styling attributes on foreignObject
      const foreignObjectMatch = svgString.match(/<foreignObject[^>]*>/)
      if (foreignObjectMatch) {
        const foTag = foreignObjectMatch[0]
        expect(foTag).to.not.include('font-weight=')
        expect(foTag).to.not.include('font-style=')
        expect(foTag).to.not.include('text-anchor=')
        cy.log('✓ ForeignObject clean of styling attributes')
      }
    })
  })

  it('should restore text styles from SVG string correctly', function () {
    // Create a known SVG string with styled text
    const testSvgString = `<svg width="640" height="480" xmlns="http://www.w3.org/2000/svg">
      <g class="layer">
        <title>Layer 1</title>
        <foreignObject x="100" y="100" width="200" height="50" se:type="text">
          <div xmlns="http://www.w3.org/1999/xhtml" style="font-size: 24px; color: red; text-align: right; font-weight: bold; font-style: italic; text-decoration: underline;">
            Restored test text
          </div>
        </foreignObject>
      </g>
    </svg>`

    // Load the SVG string
    cy.window().then((win) => {
      const success = win.svgCanvas.setSvgString(testSvgString)
      expect(success).to.not.equal(false, 'setSvgString should succeed')
    })

    // Wait for processing
    cy.wait(500)

    // Verify the text element was restored with correct styles
    cy.get('foreignObject[se\\:type="text"]').should(($fo) => {
      expect($fo.length).to.equal(1)

      const foreignObject = $fo[0]
      const textDiv = foreignObject.querySelector('div')

      // Verify div exists and has styles
      expect(textDiv).to.not.be.null // eslint-disable-line no-unused-expressions
      expect(textDiv.style.fontSize).to.equal('24px') // eslint-disable-line no-unused-expressions
      expect(textDiv.style.color).to.equal('red') // eslint-disable-line no-unused-expressions
      expect(textDiv.style.textAlign).to.equal('right') // eslint-disable-line no-unused-expressions
      expect(textDiv.style.fontWeight).to.equal('bold') // eslint-disable-line no-unused-expressions
      expect(textDiv.style.fontStyle).to.equal('italic') // eslint-disable-line no-unused-expressions
      expect(textDiv.style.textDecoration).to.equal('underline') // eslint-disable-line no-unused-expressions

      // Verify foreignObject has no styling attributes
      expect(foreignObject.getAttribute('font-size')).to.be.null // eslint-disable-line no-unused-expressions
      expect(foreignObject.getAttribute('color')).to.be.null // eslint-disable-line no-unused-expressions
      expect(foreignObject.getAttribute('text-anchor')).to.be.null // eslint-disable-line no-unused-expressions
      expect(foreignObject.getAttribute('font-weight')).to.be.null // eslint-disable-line no-unused-expressions
      expect(foreignObject.getAttribute('font-style')).to.be.null // eslint-disable-line no-unused-expressions
    })
  })

  it('should handle complete save/load cycle correctly', function () {
    // Create text with specific styles
    cy.get('#tool_text').click()
    cy.get('#svgcanvas').click(300, 200)
    cy.get('#text').type('Save/Load cycle test{enter}', { force: true })

    // Apply distinctive styles
    cy.get('#tool_text_anchor').click({ force: true })
    cy.get('se-list-item[value="end"]').click({ force: true }) // Right align
    cy.get('#tool_bold').click({ force: true })

    // Store the current styles for comparison
    let originalStyles = {}
    cy.get('foreignObject[se\\:type="text"]').then(($fo) => {
      const textDiv = $fo[0].querySelector('div')
      originalStyles = {
        textAlign: textDiv.style.textAlign,
        fontWeight: textDiv.style.fontWeight,
        fontSize: textDiv.style.fontSize,
        color: textDiv.style.color
      }
      cy.log('Original styles:', originalStyles)
    })

    // Perform save/load cycle
    cy.window().then((win) => {
      const svgString = win.svgCanvas.getSvgString()
      cy.log('Saved SVG length:', svgString.length)

      // Clear and reload
      const success = win.svgCanvas.setSvgString(svgString)
      expect(success).to.not.equal(false, 'setSvgString should succeed')

      return cy.wrap(originalStyles)
    }).then((styles) => {
      // Wait for restoration
      cy.wait(500)

      // Verify styles are preserved after save/load
      cy.get('foreignObject[se\\:type="text"]').should(($fo) => {
        const textDiv = $fo[0].querySelector('div')

        expect(textDiv.style.textAlign).to.equal(styles.textAlign, 'Text alignment should be preserved')
        expect(textDiv.style.fontWeight).to.equal(styles.fontWeight, 'Font weight should be preserved')
        expect(textDiv.style.fontSize).to.equal(styles.fontSize, 'Font size should be preserved')
        expect(textDiv.style.color).to.equal(styles.color, 'Color should be preserved')

        // Verify text is visually aligned (not just style property)
        const computedAlign = window.getComputedStyle(textDiv).textAlign
        expect(computedAlign).to.equal('right', 'Computed text alignment should be right')
      })
    })
  })

  it('should preserve styles through multiple save/load cycles', function () {
    // Create text with all possible styling
    cy.get('#tool_text').click()
    cy.get('#svgcanvas').click(150, 300)
    cy.get('#text').type('Multi-cycle test{enter}', { force: true })

    // Apply all available text styles
    cy.get('#tool_bold').click({ force: true })
    cy.get('#tool_italic').click({ force: true })
    cy.get('#tool_text_anchor').click({ force: true })
    cy.get('se-list-item[value="middle"]').click({ force: true }) // Center align

    // Perform multiple save/load cycles
    for (let cycle = 0; cycle < 3; cycle++) {
      cy.log(`Starting save/load cycle ${cycle + 1}`)

      cy.window().then((win) => {
        const svgString = win.svgCanvas.getSvgString()
        const success = win.svgCanvas.setSvgString(svgString)
        expect(success).to.not.equal(false, `Cycle ${cycle + 1} setSvgString should succeed`)
      })

      cy.wait(300)

      // Verify styles are still correct after this cycle
      cy.get('foreignObject[se\\:type="text"]').should(($fo) => {
        const textDiv = $fo[0].querySelector('div')

        expect(textDiv.style.fontWeight).to.contain('bold', `Cycle ${cycle + 1}: Bold should be preserved`)
        expect(textDiv.style.fontStyle).to.equal('italic', `Cycle ${cycle + 1}: Italic should be preserved`)
        expect(textDiv.style.textAlign).to.equal('center', `Cycle ${cycle + 1}: Center align should be preserved`)

        // Verify the style attribute itself exists and contains expected values
        const styleAttr = textDiv.getAttribute('style')
        expect(styleAttr).to.include('font-weight', `Cycle ${cycle + 1}: Style attr should contain font-weight`)
        expect(styleAttr).to.include('font-style', `Cycle ${cycle + 1}: Style attr should contain font-style`)
        expect(styleAttr).to.include('text-align', `Cycle ${cycle + 1}: Style attr should contain text-align`)
      })
    }
  })

  it('should handle edge cases in style preservation', function () {
    // Test with empty text
    cy.get('#tool_text').click()
    cy.get('#svgcanvas').click(400, 150)
    cy.get('#text').type('{enter}', { force: true })

    // Apply styles to empty text
    cy.get('#tool_text_anchor').click({ force: true })
    cy.get('se-list-item[value="start"]').click({ force: true })

    // Save/load empty styled text
    cy.window().then((win) => {
      const svgString = win.svgCanvas.getSvgString()
      const success = win.svgCanvas.setSvgString(svgString)
      expect(success).to.not.equal(false, 'Empty text setSvgString should succeed')
    })

    cy.wait(300)

    // Verify empty text still has styles
    cy.get('foreignObject[se\\:type="text"]').should(($fo) => {
      const textDiv = $fo[0].querySelector('div')
      expect(textDiv.style.textAlign).to.equal('left', 'Empty text should preserve alignment')
    })
  })

  it('should handle all text styling properties in encoding/restoration', function () {
    // Create a comprehensive SVG with all text styling properties
    const comprehensiveTestSvg = `<svg width="640" height="480" xmlns="http://www.w3.org/2000/svg">
      <g class="layer">
        <title>Layer 1</title>
        <foreignObject x="50" y="50" width="300" height="60" se:type="text">
          <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Times; font-size: 28px; font-weight: bold; font-style: italic; color: rgb(255, 0, 0); text-align: left; text-decoration: underline overline; letter-spacing: 1px; word-spacing: 3px;">
            Comprehensive styling test
          </div>
        </foreignObject>
        <foreignObject x="50" y="120" width="300" height="40" se:type="text">
          <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Helvetica; font-size: 16px; color: rgb(0, 128, 0); text-align: center; text-decoration: line-through;">
            Center green strikethrough
          </div>
        </foreignObject>
        <foreignObject x="50" y="170" width="300" height="40" se:type="text">
          <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: monospace; font-size: 14px; font-weight: normal; color: rgb(0, 0, 255); text-align: right; letter-spacing: 2px;">
            Right blue monospace
          </div>
        </foreignObject>
      </g>
    </svg>`

    // Load the comprehensive SVG
    cy.window().then((win) => {
      const success = win.svgCanvas.setSvgString(comprehensiveTestSvg)
      expect(success).to.not.equal(false, 'Comprehensive SVG setSvgString should succeed')
    })

    cy.wait(500)

    // Verify all text elements were restored with correct comprehensive styles
    cy.get('foreignObject[se\\:type="text"]').should('have.length', 3)

    // Test first element - comprehensive styling
    cy.get('foreignObject[se\\:type="text"]').eq(0).should(($fo) => {
      const textDiv = $fo[0].querySelector('div')
      expect(textDiv.style.fontFamily).to.include('Times') // eslint-disable-line no-unused-expressions
      expect(textDiv.style.fontSize).to.equal('28px') // eslint-disable-line no-unused-expressions
      expect(textDiv.style.fontWeight).to.equal('bold') // eslint-disable-line no-unused-expressions
      expect(textDiv.style.fontStyle).to.equal('italic') // eslint-disable-line no-unused-expressions
      expect(textDiv.style.color).to.equal('rgb(255, 0, 0)') // eslint-disable-line no-unused-expressions
      expect(textDiv.style.textAlign).to.equal('left') // eslint-disable-line no-unused-expressions
      expect(textDiv.style.textDecoration).to.include('underline') // eslint-disable-line no-unused-expressions
      expect(textDiv.style.textDecoration).to.include('overline') // eslint-disable-line no-unused-expressions
      expect(textDiv.style.letterSpacing).to.equal('1px') // eslint-disable-line no-unused-expressions
      expect(textDiv.style.wordSpacing).to.equal('3px') // eslint-disable-line no-unused-expressions
    })

    // Test second element - center green strikethrough
    cy.get('foreignObject[se\\:type="text"]').eq(1).should(($fo) => {
      const textDiv = $fo[0].querySelector('div')
      expect(textDiv.style.fontFamily).to.include('Helvetica') // eslint-disable-line no-unused-expressions
      expect(textDiv.style.fontSize).to.equal('16px') // eslint-disable-line no-unused-expressions
      expect(textDiv.style.color).to.equal('rgb(0, 128, 0)') // eslint-disable-line no-unused-expressions
      expect(textDiv.style.textAlign).to.equal('center') // eslint-disable-line no-unused-expressions
      expect(textDiv.style.textDecoration).to.include('line-through') // eslint-disable-line no-unused-expressions
    })

    // Test third element - right blue monospace
    cy.get('foreignObject[se\\:type="text"]').eq(2).should(($fo) => {
      const textDiv = $fo[0].querySelector('div')
      expect(textDiv.style.fontFamily).to.include('monospace') // eslint-disable-line no-unused-expressions
      expect(textDiv.style.fontSize).to.equal('14px') // eslint-disable-line no-unused-expressions
      expect(textDiv.style.fontWeight).to.equal('normal') // eslint-disable-line no-unused-expressions
      expect(textDiv.style.color).to.equal('rgb(0, 0, 255)') // eslint-disable-line no-unused-expressions
      expect(textDiv.style.textAlign).to.equal('right') // eslint-disable-line no-unused-expressions
      expect(textDiv.style.letterSpacing).to.equal('2px') // eslint-disable-line no-unused-expressions
    })

    // Test that encoding preserves all these styles
    cy.window().then((win) => {
      const svgString = win.svgCanvas.getSvgString()

      // Verify the encoded SVG contains all style properties
      expect(svgString).to.include('font-family') // eslint-disable-line no-unused-expressions
      expect(svgString).to.include('Times') // eslint-disable-line no-unused-expressions
      expect(svgString).to.include('Helvetica') // eslint-disable-line no-unused-expressions
      expect(svgString).to.include('monospace') // eslint-disable-line no-unused-expressions
      expect(svgString).to.include('font-size') // eslint-disable-line no-unused-expressions
      expect(svgString).to.include('28px') // eslint-disable-line no-unused-expressions
      expect(svgString).to.include('font-weight') // eslint-disable-line no-unused-expressions
      expect(svgString).to.include('bold') // eslint-disable-line no-unused-expressions
      expect(svgString).to.include('font-style') // eslint-disable-line no-unused-expressions
      expect(svgString).to.include('italic') // eslint-disable-line no-unused-expressions
      expect(svgString).to.include('text-decoration') // eslint-disable-line no-unused-expressions
      expect(svgString).to.include('underline') // eslint-disable-line no-unused-expressions
      expect(svgString).to.include('overline') // eslint-disable-line no-unused-expressions
      expect(svgString).to.include('line-through') // eslint-disable-line no-unused-expressions
      expect(svgString).to.include('letter-spacing') // eslint-disable-line no-unused-expressions
      expect(svgString).to.include('word-spacing') // eslint-disable-line no-unused-expressions
      expect(svgString).to.include('text-align') // eslint-disable-line no-unused-expressions
      expect(svgString).to.include('left') // eslint-disable-line no-unused-expressions
      expect(svgString).to.include('center') // eslint-disable-line no-unused-expressions
      expect(svgString).to.include('right') // eslint-disable-line no-unused-expressions

      // Test double restoration (ensure styles survive multiple cycles)
      const success = win.svgCanvas.setSvgString(svgString)
      expect(success).to.not.equal(false, 'Double restoration should succeed') // eslint-disable-line no-unused-expressions
    })

    cy.wait(500)

    // Verify styles still correct after double restoration
    cy.get('foreignObject[se\\:type="text"]').eq(0).should(($fo) => {
      const textDiv = $fo[0].querySelector('div')
      expect(textDiv.style.fontFamily).to.include('Times', 'Font family should survive double restoration') // eslint-disable-line no-unused-expressions
      expect(textDiv.style.fontSize).to.equal('28px', 'Font size should survive double restoration') // eslint-disable-line no-unused-expressions
      expect(textDiv.style.textDecoration).to.include('underline', 'Text decoration should survive double restoration') // eslint-disable-line no-unused-expressions
    })
  })

  it('should handle corrupted or malformed SVG gracefully', function () {
    // Test with malformed foreignObject (missing div)
    const malformedSvg = `<svg width="640" height="480" xmlns="http://www.w3.org/2000/svg">
      <g class="layer">
        <title>Layer 1</title>
        <foreignObject x="100" y="100" width="200" height="50" se:type="text">
          <!-- Missing div element -->
        </foreignObject>
      </g>
    </svg>`

    cy.window().then((win) => {
      const success = win.svgCanvas.setSvgString(malformedSvg)
      // Should not crash, even if malformed
      expect(success).to.not.equal(false, 'Should handle malformed SVG gracefully')
    })

    // Test with div missing style attribute
    const noStyleSvg = `<svg width="640" height="480" xmlns="http://www.w3.org/2000/svg">
      <g class="layer">
        <title>Layer 1</title>
        <foreignObject x="100" y="100" width="200" height="50" se:type="text">
          <div xmlns="http://www.w3.org/1999/xhtml">No style text</div>
        </foreignObject>
      </g>
    </svg>`

    cy.window().then((win) => {
      const success = win.svgCanvas.setSvgString(noStyleSvg)
      expect(success).to.not.equal(false, 'Should handle div without styles')
    })
  })
})
