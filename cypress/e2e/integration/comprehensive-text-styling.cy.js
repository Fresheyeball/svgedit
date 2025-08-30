/* eslint-env node */
import { visitAndApproveStorage } from '../../support/ui-test-helper.js'

describe('Comprehensive Text Styling Persistence Tests', function () {
  before(() => {
    cy.on('uncaught:exception', (err, runnable) => {
      console.log('Ignoring error:', err.message)
      return false
    })

    visitAndApproveStorage()
  })

  beforeEach(() => {
    // Clear canvas before each test
    cy.window().then((win) => {
      win.svgCanvas.clear()
    })
  })

  it('should test bold style persistence', function () {
    // Create text element
    cy.get('#tool_text').click()
    cy.get('#svgcanvas').click(200, 150)
    cy.get('#text').type('Bold text test{enter}', { force: true })

    // Apply bold
    cy.get('#tool_bold').click({ force: true })

    // Verify bold was applied immediately
    cy.get('foreignObject[se\\:type="text"]').should(($fo) => {
      const textDiv = $fo[0].querySelector('div')
      expect(textDiv.style.fontWeight).to.contain('bold') // eslint-disable-line no-unused-expressions
    })

    // Test persistence through save/load cycle
    cy.window().then((win) => {
      const svgString = win.svgCanvas.getSvgString()
      const success = win.svgCanvas.setSvgString(svgString)
      expect(success).to.not.equal(false) // eslint-disable-line no-unused-expressions
    })

    cy.wait(300)

    // Verify bold persisted
    cy.get('foreignObject[se\\:type="text"]').should(($fo) => {
      const textDiv = $fo[0].querySelector('div')
      expect(textDiv.style.fontWeight).to.contain('bold', 'Bold should persist') // eslint-disable-line no-unused-expressions
    })
  })

  it('should test italic style persistence', function () {
    cy.get('#tool_text').click()
    cy.get('#svgcanvas').click(200, 200)
    cy.get('#text').type('Italic text test{enter}', { force: true })

    // Apply italic
    cy.get('#tool_italic').click({ force: true })

    // Verify italic was applied
    cy.get('foreignObject[se\\:type="text"]').should(($fo) => {
      const textDiv = $fo[0].querySelector('div')
      expect(textDiv.style.fontStyle).to.equal('italic') // eslint-disable-line no-unused-expressions
    })

    // Test persistence
    cy.window().then((win) => {
      const svgString = win.svgCanvas.getSvgString()
      const success = win.svgCanvas.setSvgString(svgString)
      expect(success).to.not.equal(false) // eslint-disable-line no-unused-expressions
    })

    cy.wait(300)

    cy.get('foreignObject[se\\:type="text"]').should(($fo) => {
      const textDiv = $fo[0].querySelector('div')
      expect(textDiv.style.fontStyle).to.equal('italic', 'Italic should persist') // eslint-disable-line no-unused-expressions
    })
  })

  it('should test all text alignment options persistence', function () {
    const alignments = [
      { value: 'start', expected: 'left', label: 'Left' },
      { value: 'middle', expected: 'center', label: 'Center' },
      { value: 'end', expected: 'right', label: 'Right' },
      { value: 'justify', expected: 'justify', label: 'Justify' }
    ]

    alignments.forEach((alignment, index) => {
      // Create text for each alignment test
      cy.get('#tool_text').click()
      cy.get('#svgcanvas').click(200, 150 + (index * 30))
      cy.get('#text').type(`${alignment.label} alignment test{enter}`, { force: true })

      // Apply alignment
      cy.get('#tool_text_anchor').click({ force: true })
      cy.get(`se-list-item[value="${alignment.value}"]`).click({ force: true })

      // Verify alignment was applied
      cy.get('foreignObject[se\\:type="text"]').last().should(($fo) => {
        const textDiv = $fo[0].querySelector('div')
        expect(textDiv.style.textAlign).to.equal(alignment.expected) // eslint-disable-line no-unused-expressions
      })
    })

    // Test persistence for all alignments
    cy.window().then((win) => {
      const svgString = win.svgCanvas.getSvgString()
      const success = win.svgCanvas.setSvgString(svgString)
      expect(success).to.not.equal(false) // eslint-disable-line no-unused-expressions
    })

    cy.wait(500)

    // Verify all alignments persisted
    alignments.forEach((alignment, index) => {
      cy.get('foreignObject[se\\:type="text"]').eq(index).should(($fo) => {
        const textDiv = $fo[0].querySelector('div')
        expect(textDiv.style.textAlign).to.equal(alignment.expected, `${alignment.label} alignment should persist`) // eslint-disable-line no-unused-expressions
      })
    })
  })

  it('should test text decoration persistence', function () {
    const decorations = [
      { id: '#tool_text_decoration_underline', property: 'underline', label: 'Underline' },
      { id: '#tool_text_decoration_linethrough', property: 'line-through', label: 'Line-through' },
      { id: '#tool_text_decoration_overline', property: 'overline', label: 'Overline' }
    ]

    decorations.forEach((decoration, index) => {
      cy.get('#tool_text').click()
      cy.get('#svgcanvas').click(200, 150 + (index * 30))
      cy.get('#text').type(`${decoration.label} test{enter}`, { force: true })

      // Apply decoration
      cy.get(decoration.id).click({ force: true })

      // Verify decoration was applied
      cy.get('foreignObject[se\\:type="text"]').last().should(($fo) => {
        const textDiv = $fo[0].querySelector('div')
        expect(textDiv.style.textDecoration).to.include(decoration.property) // eslint-disable-line no-unused-expressions
      })
    })

    // Test persistence
    cy.window().then((win) => {
      const svgString = win.svgCanvas.getSvgString()
      const success = win.svgCanvas.setSvgString(svgString)
      expect(success).to.not.equal(false) // eslint-disable-line no-unused-expressions
    })

    cy.wait(500)

    // Verify decorations persisted
    decorations.forEach((decoration, index) => {
      cy.get('foreignObject[se\\:type="text"]').eq(index).should(($fo) => {
        const textDiv = $fo[0].querySelector('div')
        expect(textDiv.style.textDecoration).to.include(decoration.property, `${decoration.label} should persist`) // eslint-disable-line no-unused-expressions
      })
    })
  })

  it('should test font family persistence', function () {
    cy.get('#tool_text').click()
    cy.get('#svgcanvas').click(200, 150)
    cy.get('#text').type('Font family test{enter}', { force: true })

    // Change font family to Helvetica
    cy.get('#tool_font_family').click({ force: true })
    cy.get('#tool_font_family').then(($select) => {
      // Set the value directly since se-select might need special handling
      $select[0].value = 'Helvetica'
      $select[0].dispatchEvent(new Event('change', { bubbles: true }))
    })

    cy.wait(200)

    // Verify font family was applied
    cy.get('foreignObject[se\\:type="text"]').should(($fo) => {
      const textDiv = $fo[0].querySelector('div')
      expect(textDiv.style.fontFamily).to.include('Helvetica') // eslint-disable-line no-unused-expressions
    })

    // Test persistence
    cy.window().then((win) => {
      const svgString = win.svgCanvas.getSvgString()
      const success = win.svgCanvas.setSvgString(svgString)
      expect(success).to.not.equal(false) // eslint-disable-line no-unused-expressions
    })

    cy.wait(300)

    cy.get('foreignObject[se\\:type="text"]').should(($fo) => {
      const textDiv = $fo[0].querySelector('div')
      expect(textDiv.style.fontFamily).to.include('Helvetica', 'Font family should persist') // eslint-disable-line no-unused-expressions
    })
  })

  it('should test font size persistence', function () {
    cy.get('#tool_text').click()
    cy.get('#svgcanvas').click(200, 150)
    cy.get('#text').type('Font size test{enter}', { force: true })

    // Change font size to 32px
    cy.get('#font_size').clear().type('32{enter}', { force: true })

    cy.wait(200)

    // Verify font size was applied
    cy.get('foreignObject[se\\:type="text"]').should(($fo) => {
      const textDiv = $fo[0].querySelector('div')
      expect(textDiv.style.fontSize).to.equal('32px') // eslint-disable-line no-unused-expressions
    })

    // Test persistence
    cy.window().then((win) => {
      const svgString = win.svgCanvas.getSvgString()
      const success = win.svgCanvas.setSvgString(svgString)
      expect(success).to.not.equal(false) // eslint-disable-line no-unused-expressions
    })

    cy.wait(300)

    cy.get('foreignObject[se\\:type="text"]').should(($fo) => {
      const textDiv = $fo[0].querySelector('div')
      expect(textDiv.style.fontSize).to.equal('32px', 'Font size should persist') // eslint-disable-line no-unused-expressions
    })
  })

  it('should test text color persistence', function () {
    cy.get('#tool_text').click()
    cy.get('#svgcanvas').click(200, 150)
    cy.get('#text').type('Color test{enter}', { force: true })

    // Change text color to red
    cy.get('#fill_color').click({ force: true })
    // Set color to red - this might need adjustment based on the color picker implementation
    cy.get('#fill_color').then(($colorPicker) => {
      // Trigger color change to red
      $colorPicker[0].setAttribute('value', '#FF0000')
      $colorPicker[0].dispatchEvent(new Event('change', { bubbles: true }))
    })

    cy.wait(200)

    // Verify color was applied
    cy.get('foreignObject[se\\:type="text"]').should(($fo) => {
      const textDiv = $fo[0].querySelector('div')
      // Color might be in different formats (red, rgb(255,0,0), #FF0000)
      const color = textDiv.style.color
      expect(color).to.satisfy((val) =>
        val === 'red' || val === 'rgb(255, 0, 0)' || val.toLowerCase() === '#ff0000' || val.toLowerCase() === '#f00'
      ) // eslint-disable-line no-unused-expressions
    })

    // Test persistence
    cy.window().then((win) => {
      const svgString = win.svgCanvas.getSvgString()
      const success = win.svgCanvas.setSvgString(svgString)
      expect(success).to.not.equal(false) // eslint-disable-line no-unused-expressions
    })

    cy.wait(300)

    cy.get('foreignObject[se\\:type="text"]').should(($fo) => {
      const textDiv = $fo[0].querySelector('div')
      const color = textDiv.style.color
      expect(color).to.satisfy((val) =>
        val === 'red' || val === 'rgb(255, 0, 0)' || val.toLowerCase() === '#ff0000' || val.toLowerCase() === '#f00',
      'Text color should persist'
      ) // eslint-disable-line no-unused-expressions
    })
  })

  it('should test comprehensive combined styling persistence', function () {
    // Create text with ALL styling options applied
    cy.get('#tool_text').click()
    cy.get('#svgcanvas').click(200, 150)
    cy.get('#text').type('All styles combined test{enter}', { force: true })

    // Apply bold
    cy.get('#tool_bold').click({ force: true })

    // Apply italic
    cy.get('#tool_italic').click({ force: true })

    // Apply left alignment
    cy.get('#tool_text_anchor').click({ force: true })
    cy.get('se-list-item[value="start"]').click({ force: true })

    // Apply underline
    cy.get('#tool_text_decoration_underline').click({ force: true })

    // Apply font size
    cy.get('#font_size').clear().type('24{enter}', { force: true })

    // Apply font family
    cy.get('#tool_font_family').then(($select) => {
      $select[0].value = 'Times'
      $select[0].dispatchEvent(new Event('change', { bubbles: true }))
    })

    cy.wait(300)

    // Verify all styles applied immediately
    cy.get('foreignObject[se\\:type="text"]').should(($fo) => {
      const textDiv = $fo[0].querySelector('div')
      expect(textDiv.style.fontWeight).to.contain('bold') // eslint-disable-line no-unused-expressions
      expect(textDiv.style.fontStyle).to.equal('italic') // eslint-disable-line no-unused-expressions
      expect(textDiv.style.textAlign).to.equal('left') // eslint-disable-line no-unused-expressions
      expect(textDiv.style.textDecoration).to.include('underline') // eslint-disable-line no-unused-expressions
      expect(textDiv.style.fontSize).to.equal('24px') // eslint-disable-line no-unused-expressions
      expect(textDiv.style.fontFamily).to.include('Times') // eslint-disable-line no-unused-expressions
    })

    // Test persistence through multiple save/load cycles
    for (let cycle = 0; cycle < 2; cycle++) {
      cy.log(`Testing persistence cycle ${cycle + 1}`)

      cy.window().then((win) => {
        const svgString = win.svgCanvas.getSvgString()

        // Verify SVG string contains all the styles
        expect(svgString).to.include('font-weight') // eslint-disable-line no-unused-expressions
        expect(svgString).to.include('bold') // eslint-disable-line no-unused-expressions
        expect(svgString).to.include('font-style') // eslint-disable-line no-unused-expressions
        expect(svgString).to.include('italic') // eslint-disable-line no-unused-expressions
        expect(svgString).to.include('text-align') // eslint-disable-line no-unused-expressions
        expect(svgString).to.include('left') // eslint-disable-line no-unused-expressions
        expect(svgString).to.include('text-decoration') // eslint-disable-line no-unused-expressions
        expect(svgString).to.include('underline') // eslint-disable-line no-unused-expressions
        expect(svgString).to.include('font-size') // eslint-disable-line no-unused-expressions
        expect(svgString).to.include('24px') // eslint-disable-line no-unused-expressions

        const success = win.svgCanvas.setSvgString(svgString)
        expect(success).to.not.equal(false) // eslint-disable-line no-unused-expressions
      })

      cy.wait(400)

      // Verify all styles persisted
      cy.get('foreignObject[se\\:type="text"]').should(($fo) => {
        const textDiv = $fo[0].querySelector('div')
        expect(textDiv.style.fontWeight).to.contain('bold', `Cycle ${cycle + 1}: Bold should persist`) // eslint-disable-line no-unused-expressions
        expect(textDiv.style.fontStyle).to.equal('italic', `Cycle ${cycle + 1}: Italic should persist`) // eslint-disable-line no-unused-expressions
        expect(textDiv.style.textAlign).to.equal('left', `Cycle ${cycle + 1}: Text align should persist`) // eslint-disable-line no-unused-expressions
        expect(textDiv.style.textDecoration).to.include('underline', `Cycle ${cycle + 1}: Underline should persist`) // eslint-disable-line no-unused-expressions
        expect(textDiv.style.fontSize).to.equal('24px', `Cycle ${cycle + 1}: Font size should persist`) // eslint-disable-line no-unused-expressions
        expect(textDiv.style.fontFamily).to.include('Times', `Cycle ${cycle + 1}: Font family should persist`) // eslint-disable-line no-unused-expressions
      })
    }
  })

  it('should test TopPanel synchronization after restoration', function () {
    // Create text with multiple styles
    cy.get('#tool_text').click()
    cy.get('#svgcanvas').click(200, 150)
    cy.get('#text').type('TopPanel sync test{enter}', { force: true })

    // Apply styles
    cy.get('#tool_bold').click({ force: true })
    cy.get('#tool_italic').click({ force: true })
    cy.get('#tool_text_anchor').click({ force: true })
    cy.get('se-list-item[value="end"]').click({ force: true })
    cy.get('#tool_text_decoration_underline').click({ force: true })

    // Save and restore
    cy.window().then((win) => {
      const svgString = win.svgCanvas.getSvgString()
      win.svgCanvas.clear()

      cy.wait(100)

      const success = win.svgCanvas.setSvgString(svgString)
      expect(success).to.not.equal(false) // eslint-disable-line no-unused-expressions
    })

    cy.wait(500)

    // Select the restored text element
    cy.get('foreignObject[se\\:type="text"]').click({ force: true })

    cy.wait(200)

    // Verify TopPanel controls reflect the restored styles
    cy.get('#tool_bold').should('have.class', 'pressed')
    cy.get('#tool_italic').should('have.class', 'pressed')
    cy.get('#tool_text_anchor').should('have.attr', 'value', 'end')
    cy.get('#tool_text_decoration_underline').should('have.class', 'pressed')
  })
})
