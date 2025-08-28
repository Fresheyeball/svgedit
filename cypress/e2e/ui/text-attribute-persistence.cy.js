import {
  visitAndApproveStorage
} from '../../support/ui-test-helper.js'

describe('Text Attribute Persistence Tests', { testIsolation: false }, function () {
  before(() => {
    visitAndApproveStorage()
  })

  beforeEach(() => {
    // Clear the canvas for each test
    cy.get('#tool_source').click({ force: true })
    cy.get('#svg_source_textarea')
      .type('{selectall}', { force: true })
      .type(`<svg width="640" height="480" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg" xmlns:svg="http://www.w3.org/2000/svg" xmlns:se="http://svg-edit.googlecode.com">
      <g class="layer">
       <title>Layer 1</title>
       </g>
     </svg>`, { force: true, parseSpecialCharSequences: false })
    cy.get('#tool_source_save').click({ force: true })
  })

  it('should persist font-size changes after save/load', function () {
    // Create text element
    cy.get('#tool_text').click({ force: true })
    cy.get('#svgroot').trigger('mousedown', { clientX: 300, clientY: 200, force: true })
      .trigger('mouseup', { force: true })
    cy.get('#text').type('Test Text', { force: true })
    
    // Select the text element and change font size
    cy.get('[se\\:type="text"]').first().click({ force: true })
    cy.get('#font_size').shadow().find('elix-number-spin-box').eq(0).shadow().find('#inner').eq(0)
      .type('{selectall}24', { force: true })
    
    // Verify font-size attribute is set on foreignObject
    cy.get('[se\\:type="text"]').first().should('have.attr', 'font-size', '24')
    
    // Save and reload
    cy.get('#tool_source').click({ force: true })
    cy.get('#svg_source_textarea').then(($textarea) => {
      const svgContent = $textarea.val()
      expect(svgContent).to.include('font-size="24"')
    })
    cy.get('#tool_source_save').click({ force: true })
    
    // Verify font-size is restored in the div
    cy.get('[se\\:type="text"] div').should('have.css', 'font-size', '24px')
  })

  it('should persist font-family changes after save/load', function () {
    // Create text element
    cy.get('#tool_text').click({ force: true })
    cy.get('#svgroot').trigger('mousedown', { clientX: 300, clientY: 200, force: true })
      .trigger('mouseup', { force: true })
    cy.get('#text').type('Test Text', { force: true })
    
    // Select the text element and change font family
    cy.get('[se\\:type="text"]').first().click({ force: true })
    cy.get('#tool_font_family').shadow().find('#select').eq(0)
      .select('Verdana', { force: true })
    
    // Verify font-family attribute is set on foreignObject
    cy.get('[se\\:type="text"]').first().should('have.attr', 'font-family', 'Verdana')
    
    // Save and reload
    cy.get('#tool_source').click({ force: true })
    cy.get('#svg_source_textarea').then(($textarea) => {
      const svgContent = $textarea.val()
      expect(svgContent).to.include('font-family="Verdana"')
    })
    cy.get('#tool_source_save').click({ force: true })
    
    // Verify font-family is restored in the div
    cy.get('[se\\:type="text"] div').should('have.css', 'font-family').and('include', 'Verdana')
  })

  it('should persist font-weight (bold) changes after save/load', function () {
    // Create text element
    cy.get('#tool_text').click({ force: true })
    cy.get('#svgroot').trigger('mousedown', { clientX: 300, clientY: 200, force: true })
      .trigger('mouseup', { force: true })
    cy.get('#text').type('Test Text', { force: true })
    
    // Select the text element and make it bold
    cy.get('[se\\:type="text"]').first().click({ force: true })
    cy.get('#tool_bold').click({ force: true })
    
    // Verify font-weight attribute is set on foreignObject
    cy.get('[se\\:type="text"]').first().should('have.attr', 'font-weight', 'bold')
    
    // Save and reload
    cy.get('#tool_source').click({ force: true })
    cy.get('#svg_source_textarea').then(($textarea) => {
      const svgContent = $textarea.val()
      expect(svgContent).to.include('font-weight="bold"')
    })
    cy.get('#tool_source_save').click({ force: true })
    
    // Verify font-weight is restored in the div
    cy.get('[se\\:type="text"] div').should('have.css', 'font-weight', 'bold')
  })

  it('should persist font-style (italic) changes after save/load', function () {
    // Create text element
    cy.get('#tool_text').click({ force: true })
    cy.get('#svgroot').trigger('mousedown', { clientX: 300, clientY: 200, force: true })
      .trigger('mouseup', { force: true })
    cy.get('#text').type('Test Text', { force: true })
    
    // Select the text element and make it italic
    cy.get('[se\\:type="text"]').first().click({ force: true })
    cy.get('#tool_italic').click({ force: true })
    
    // Verify font-style attribute is set on foreignObject
    cy.get('[se\\:type="text"]').first().should('have.attr', 'font-style', 'italic')
    
    // Save and reload
    cy.get('#tool_source').click({ force: true })
    cy.get('#svg_source_textarea').then(($textarea) => {
      const svgContent = $textarea.val()
      expect(svgContent).to.include('font-style="italic"')
    })
    cy.get('#tool_source_save').click({ force: true })
    
    // Verify font-style is restored in the div
    cy.get('[se\\:type="text"] div').should('have.css', 'font-style', 'italic')
  })

  it('should persist text-decoration (underline) changes after save/load', function () {
    // Create text element
    cy.get('#tool_text').click({ force: true })
    cy.get('#svgroot').trigger('mousedown', { clientX: 300, clientY: 200, force: true })
      .trigger('mouseup', { force: true })
    cy.get('#text').type('Test Text', { force: true })
    
    // Select the text element and add underline
    cy.get('[se\\:type="text"]').first().click({ force: true })
    cy.get('#tool_text_decoration_underline').click({ force: true })
    
    // Verify text-decoration attribute is set on foreignObject
    cy.get('[se\\:type="text"]').first().should('have.attr', 'text-decoration').and('include', 'underline')
    
    // Save and reload
    cy.get('#tool_source').click({ force: true })
    cy.get('#svg_source_textarea').then(($textarea) => {
      const svgContent = $textarea.val()
      expect(svgContent).to.include('text-decoration').and.include('underline')
    })
    cy.get('#tool_source_save').click({ force: true })
    
    // Verify text-decoration is restored in the div
    cy.get('[se\\:type="text"] div').should('have.css', 'text-decoration').and('include', 'underline')
  })

  it('should persist fill (text color) changes after save/load', function () {
    // Create text element
    cy.get('#tool_text').click({ force: true })
    cy.get('#svgroot').trigger('mousedown', { clientX: 300, clientY: 200, force: true })
      .trigger('mouseup', { force: true })
    cy.get('#text').type('Test Text', { force: true })
    
    // Select the text element and change color
    cy.get('[se\\:type="text"]').first().click({ force: true })
    cy.get('#fill_color').shadow().find('#picker').eq(0).click({ force: true })
    cy.get('#fill_color').shadow().find('#color_picker').eq(0)
      .find('#jGraduate_colPick').eq(0).find('#jPicker-table').eq(0)
      .find('.QuickColor').eq(3).click({ force: true }) // Red color
    cy.get('#fill_color').shadow().find('#color_picker').eq(0)
      .find('#jGraduate_colPick').eq(0).find('#jPicker-table').eq(0)
      .find('#Ok').eq(0).click({ force: true })
    
    // Verify fill attribute is set on foreignObject
    cy.get('[se\\:type="text"]').first().should('have.attr', 'fill').and('not.equal', '')
    
    // Save and reload
    cy.get('#tool_source').click({ force: true })
    cy.get('#svg_source_textarea').then(($textarea) => {
      const svgContent = $textarea.val()
      expect(svgContent).to.include('fill=')
    })
    cy.get('#tool_source_save').click({ force: true })
    
    // Verify color is restored in the div (should not be black)
    cy.get('[se\\:type="text"] div').should('have.css', 'color').and('not.equal', 'rgb(0, 0, 0)')
  })

  it('should persist text-anchor (alignment) changes after save/load', function () {
    // Create text element
    cy.get('#tool_text').click({ force: true })
    cy.get('#svgroot').trigger('mousedown', { clientX: 300, clientY: 200, force: true })
      .trigger('mouseup', { force: true })
    cy.get('#text').type('Test Text', { force: true })
    
    // Select the text element and change alignment to right
    cy.get('[se\\:type="text"]').first().click({ force: true })
    cy.get('#tool_text_anchor').shadow().find('#select').eq(0)
      .select('end', { force: true })
    
    // Verify text-anchor attribute is set on foreignObject
    cy.get('[se\\:type="text"]').first().should('have.attr', 'text-anchor', 'end')
    
    // Save and reload
    cy.get('#tool_source').click({ force: true })
    cy.get('#svg_source_textarea').then(($textarea) => {
      const svgContent = $textarea.val()
      expect(svgContent).to.include('text-anchor="end"')
    })
    cy.get('#tool_source_save').click({ force: true })
    
    // Verify text-align is restored in the div
    cy.get('[se\\:type="text"] div').should('have.css', 'text-align', 'right')
  })

  it('should persist multiple text attributes simultaneously', function () {
    // Create text element
    cy.get('#tool_text').click({ force: true })
    cy.get('#svgroot').trigger('mousedown', { clientX: 300, clientY: 200, force: true })
      .trigger('mouseup', { force: true })
    cy.get('#text').type('Complex Text', { force: true })
    
    // Select the text element and apply multiple formatting
    cy.get('[se\\:type="text"]').first().click({ force: true })
    
    // Change font size to 20
    cy.get('#font_size').shadow().find('elix-number-spin-box').eq(0).shadow().find('#inner').eq(0)
      .type('{selectall}20', { force: true })
    
    // Make it bold
    cy.get('#tool_bold').click({ force: true })
    
    // Make it italic
    cy.get('#tool_italic').click({ force: true })
    
    // Add underline
    cy.get('#tool_text_decoration_underline').click({ force: true })
    
    // Change font family
    cy.get('#tool_font_family').shadow().find('#select').eq(0)
      .select('Verdana', { force: true })
    
    // Verify all attributes are set on foreignObject
    cy.get('[se\\:type="text"]').first()
      .should('have.attr', 'font-size', '20')
      .should('have.attr', 'font-weight', 'bold')
      .should('have.attr', 'font-style', 'italic')
      .should('have.attr', 'text-decoration').and('include', 'underline')
      .should('have.attr', 'font-family', 'Verdana')
    
    // Save and reload
    cy.get('#tool_source').click({ force: true })
    cy.get('#svg_source_textarea').then(($textarea) => {
      const svgContent = $textarea.val()
      expect(svgContent).to.include('font-size="20"')
      expect(svgContent).to.include('font-weight="bold"')
      expect(svgContent).to.include('font-style="italic"')
      expect(svgContent).to.include('text-decoration').and.include('underline')
      expect(svgContent).to.include('font-family="Verdana"')
    })
    cy.get('#tool_source_save').click({ force: true })
    
    // Verify all styles are restored in the div
    cy.get('[se\\:type="text"] div')
      .should('have.css', 'font-size', '20px')
      .should('have.css', 'font-weight', 'bold')
      .should('have.css', 'font-style', 'italic')
      .should('have.css', 'text-decoration').and('include', 'underline')
      .should('have.css', 'font-family').and('include', 'Verdana')
  })

  it('should restore text attributes even when div styles are missing', function () {
    // Create SVG with foreignObject that has attributes but no inline div styles
    cy.get('#tool_source').click({ force: true })
    cy.get('#svg_source_textarea')
      .type('{selectall}', { force: true })
      .type(`<svg width="640" height="480" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg" xmlns:svg="http://www.w3.org/2000/svg" xmlns:se="http://svg-edit.googlecode.com">
      <g class="layer">
       <title>Layer 1</title>
       <foreignObject x="100" y="100" width="200" height="40" se:type="text" 
                      font-size="18" font-family="Georgia" font-weight="bold" 
                      font-style="italic" fill="red" text-anchor="middle" 
                      text-decoration="underline">
        <div xmlns="http://www.w3.org/1999/xhtml" style="width: 100%; height: 100%; display: block; white-space: pre-wrap; overflow-wrap: break-word; padding: 4px; box-sizing: border-box; cursor: text; min-height: 100%; outline: none;">Attributes Only Text</div>
       </foreignObject>
       </g>
     </svg>`, { force: true, parseSpecialCharSequences: false })
    cy.get('#tool_source_save').click({ force: true })
    
    // Verify that the restoration logic works
    cy.get('[se\\:type="text"] div')
      .should('have.css', 'font-size', '18px')
      .should('have.css', 'font-family').and('include', 'Georgia')
      .should('have.css', 'font-weight', 'bold')
      .should('have.css', 'font-style', 'italic')
      .should('have.css', 'color', 'rgb(255, 0, 0)') // red
      .should('have.css', 'text-align', 'center') // middle text-anchor
      .should('have.css', 'text-decoration').and('include', 'underline')
  })

  it('should maintain UI panel state when selecting text with saved attributes', function () {
    // Create SVG with foreignObject that has specific attributes
    cy.get('#tool_source').click({ force: true })
    cy.get('#svg_source_textarea')
      .type('{selectall}', { force: true })
      .type(`<svg width="640" height="480" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg" xmlns:svg="http://www.w3.org/2000/svg" xmlns:se="http://svg-edit.googlecode.com">
      <g class="layer">
       <title>Layer 1</title>
       <foreignObject x="100" y="100" width="200" height="40" se:type="text" 
                      font-size="22" font-family="Arial" font-weight="bold" 
                      font-style="italic" text-anchor="end">
        <div xmlns="http://www.w3.org/1999/xhtml" style="width: 100%; height: 100%; font-family: Arial; font-size: 22px; font-weight: bold; font-style: italic; text-align: right; display: block; white-space: pre-wrap; overflow-wrap: break-word; padding: 4px; box-sizing: border-box; cursor: text; min-height: 100%; outline: none;">Panel State Test</div>
       </foreignObject>
       </g>
     </svg>`, { force: true, parseSpecialCharSequences: false })
    cy.get('#tool_source_save').click({ force: true })
    
    // Select the text element
    cy.get('[se\\:type="text"]').first().click({ force: true })
    
    // Verify UI panel shows correct values
    cy.get('#font_size').shadow().find('elix-number-spin-box').eq(0).shadow().find('#inner').eq(0)
      .should('have.value', '22')
    cy.get('#tool_font_family').shadow().find('#select').eq(0)
      .should('have.value', 'Arial')
    cy.get('#tool_bold').should('have.class', 'pressed')
    cy.get('#tool_italic').should('have.class', 'pressed')
    cy.get('#tool_text_anchor').shadow().find('#select').eq(0)
      .should('have.value', 'end')
  })
})