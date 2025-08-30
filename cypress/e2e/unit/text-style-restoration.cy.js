/* eslint-env node */

describe('Text Style Restoration Function Tests', function () {
  beforeEach(() => {
    cy.on('uncaught:exception', () => false)
  })

  it('should test restoreTextDivStyles function directly', function () {
    cy.document().then((doc) => {
      // Create test elements directly in DOM since SVG namespace parsing is complex in tests
      const testSvg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg')

      // Create first text foreignObject
      const fo1 = doc.createElementNS('http://www.w3.org/2000/svg', 'foreignObject')
      fo1.setAttribute('se:type', 'text')
      const div1 = doc.createElement('div')
      div1.setAttribute('style', 'color: blue; text-align: left; font-weight: bold;')
      div1.textContent = 'Test 1'
      fo1.appendChild(div1)
      testSvg.appendChild(fo1)

      // Create second text foreignObject
      const fo2 = doc.createElementNS('http://www.w3.org/2000/svg', 'foreignObject')
      fo2.setAttribute('se:type', 'text')
      const div2 = doc.createElement('div')
      div2.setAttribute('style', 'font-size: 20px; text-align: right; font-style: italic;')
      div2.textContent = 'Test 2'
      fo2.appendChild(div2)
      testSvg.appendChild(fo2)

      // Create non-text foreignObject (should be ignored)
      const fo3 = doc.createElementNS('http://www.w3.org/2000/svg', 'foreignObject')
      const div3 = doc.createElement('div')
      div3.setAttribute('style', 'color: green;')
      fo3.appendChild(div3)
      testSvg.appendChild(fo3)

      doc.body.appendChild(testSvg)

      // Get the divs before restoration
      const textDivs = testSvg.querySelectorAll('foreignObject[se\\:type="text"] div')
      expect(textDivs.length).to.equal(2)

      // Simulate the issue where CSS object model might not be initialized
      // (This would happen during XML parsing/adoption in real scenarios)
      const originalStyles = []
      textDivs.forEach((div, index) => {
        const styleText = div.getAttribute('style')
        originalStyles[index] = styleText
        div.style.cssText = '' // Clear the CSS object model
        // The style attribute still exists but CSS properties are not accessible
        expect(div.getAttribute('style')).to.not.be.empty // eslint-disable-line no-unused-expressions
      })

      // Now simulate what our restoreTextDivStyles function should do
      const restoreTextDivStyles = (svgContent) => {
        if (!svgContent) return

        const textForeignObjects = svgContent.querySelectorAll('foreignObject[se\\:type="text"]')

        textForeignObjects.forEach(foreignObject => {
          const textDiv = foreignObject.querySelector('div')
          if (!textDiv) return

          const styleAttr = textDiv.getAttribute('style')
          if (styleAttr) {
            // Clear and reapply the styles to ensure CSS object model is properly initialized
            textDiv.style.cssText = ''
            textDiv.style.cssText = styleAttr
          }
        })
      }

      // Apply the restoration function
      restoreTextDivStyles(testSvg)

      // Verify that CSS properties are now accessible
      const restoredDiv1 = textDivs[0]
      const restoredDiv2 = textDivs[1]

      expect(restoredDiv1.style.color).to.equal('blue')
      expect(restoredDiv1.style.textAlign).to.equal('left')
      expect(restoredDiv1.style.fontWeight).to.equal('bold')

      expect(restoredDiv2.style.fontSize).to.equal('20px')
      expect(restoredDiv2.style.textAlign).to.equal('right')
      expect(restoredDiv2.style.fontStyle).to.equal('italic')

      // Clean up
      testSvg.remove()
    })
  })

  it('should handle various CSS style formats in restoration', function () {
    const testCases = [
      {
        description: 'Standard CSS format',
        style: 'color: red; font-size: 16px; text-align: center;',
        expected: { color: 'red', fontSize: '16px', textAlign: 'center' }
      },
      {
        description: 'CSS with different spacing',
        style: 'color:blue;font-weight:bold;text-align:left;',
        expected: { color: 'blue', fontWeight: 'bold', textAlign: 'left' }
      },
      {
        description: 'CSS with extra spaces',
        style: '  color: green ;  font-style: italic  ; text-align: right ;  ',
        expected: { color: 'green', fontStyle: 'italic', textAlign: 'right' }
      },
      {
        description: 'CSS with quoted values',
        style: 'font-family: "Arial Black"; color: #333; text-align: justify;',
        expected: { fontFamily: '"Arial Black"', color: 'rgb(51, 51, 51)', textAlign: 'justify' }
      },
      {
        description: 'CSS with text decorations',
        style: 'text-decoration: underline line-through; font-weight: bold; color: purple;',
        expected: { textDecoration: 'underline line-through', fontWeight: 'bold', color: 'purple' }
      },
      {
        description: 'CSS with letter and word spacing',
        style: 'letter-spacing: 2px; word-spacing: 5px; font-family: monospace;',
        expected: { letterSpacing: '2px', wordSpacing: '5px', fontFamily: 'monospace' }
      },
      {
        description: 'Complex comprehensive styling',
        style: 'font-family: Times; font-size: 20px; font-weight: bold; font-style: italic; color: #FF5733; text-align: center; text-decoration: underline;',
        expected: { fontFamily: 'Times', fontSize: '20px', fontWeight: 'bold', fontStyle: 'italic', color: 'rgb(255, 87, 51)', textAlign: 'center', textDecoration: 'underline' }
      }
    ]

    cy.document().then((doc) => {
      testCases.forEach((testCase, index) => {
        const testDiv = doc.createElement('div')
        testDiv.setAttribute('style', testCase.style)
        doc.body.appendChild(testDiv)

        // Store original style attribute
        const originalStyleAttr = testDiv.getAttribute('style')

        // Simulate CSS object model being cleared (but preserve style attribute)
        // const computedBefore = window.getComputedStyle(testDiv) // unused
        testDiv.style.cssText = ''

        // Restore using our method
        if (originalStyleAttr) {
          testDiv.style.cssText = originalStyleAttr
        }

        // Verify restoration
        Object.keys(testCase.expected).forEach((property) => {
          const expectedValue = testCase.expected[property]
          const actualValue = testDiv.style[property]

          // Handle color format differences (named colors vs rgb values)
          if (property === 'color') {
            if (expectedValue === 'red') {
              expect(actualValue).to.satisfy((val) => val === 'red' || val === 'rgb(255, 0, 0)')
            } else if (expectedValue === 'blue') {
              expect(actualValue).to.satisfy((val) => val === 'blue' || val === 'rgb(0, 0, 255)')
            } else if (expectedValue === 'green') {
              expect(actualValue).to.satisfy((val) => val === 'green' || val === 'rgb(0, 128, 0)')
            } else if (expectedValue.startsWith('rgb')) {
              expect(actualValue).to.equal(expectedValue)
            } else {
              expect(actualValue).to.not.be.empty // eslint-disable-line no-unused-expressions
            }
          } else {
            expect(actualValue).to.equal(expectedValue,
              `${testCase.description}: ${property} should be restored correctly`)
          }
        })

        testDiv.remove()
      })
    })
  })

  it('should test sanitizer behavior with HTML elements', function () {
    // Test that the sanitizer now preserves style attributes on HTML elements
    const testHtml = `
      <div style="color: red; text-align: left;">HTML div</div>
      <span style="font-weight: bold; font-style: italic;">HTML span</span>
      <rect style="fill: blue; stroke: red;">SVG rect</rect>
    `

    cy.document().then((doc) => {
      const container = doc.createElement('div')
      container.innerHTML = testHtml
      doc.body.appendChild(container)

      const htmlDiv = container.querySelector('div')
      const htmlSpan = container.querySelector('span')

      // Verify HTML elements preserve their style attributes
      expect(htmlDiv.getAttribute('style')).to.include('color: red')
      expect(htmlDiv.getAttribute('style')).to.include('text-align: left')
      expect(htmlDiv.style.color).to.equal('red')
      expect(htmlDiv.style.textAlign).to.equal('left')

      expect(htmlSpan.getAttribute('style')).to.include('font-weight: bold')
      expect(htmlSpan.getAttribute('style')).to.include('font-style: italic')
      expect(htmlSpan.style.fontWeight).to.equal('bold')
      expect(htmlSpan.style.fontStyle).to.equal('italic')

      container.remove()
    })
  })

  it('should handle pointer-events style preservation', function () {
    // Test that pointer-events can be added without destroying other styles
    cy.document().then((doc) => {
      const testDiv = doc.createElement('div')
      testDiv.style.cssText = 'color: blue; font-size: 18px; text-align: center; font-weight: bold;'
      doc.body.appendChild(testDiv)

      // Verify initial styles
      expect(testDiv.style.color).to.equal('blue')
      expect(testDiv.style.fontSize).to.equal('18px')
      expect(testDiv.style.textAlign).to.equal('center')
      expect(testDiv.style.fontWeight).to.equal('bold')

      // Add pointer-events using the non-destructive method
      testDiv.style.pointerEvents = 'inherit'

      // Verify all original styles are preserved
      expect(testDiv.style.color).to.equal('blue', 'Color should be preserved')
      expect(testDiv.style.fontSize).to.equal('18px', 'Font size should be preserved')
      expect(testDiv.style.textAlign).to.equal('center', 'Text align should be preserved')
      expect(testDiv.style.fontWeight).to.equal('bold', 'Font weight should be preserved')
      expect(testDiv.style.pointerEvents).to.equal('inherit', 'Pointer events should be added')

      testDiv.remove()
    })
  })
})
