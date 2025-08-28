import '../../../packages/svgcanvas/dist/svgcanvas.js'

describe('ForeignObject Text Persistence Unit Tests', function () {
  /**
   * Set up a mock canvas context for testing
   * @returns {Object} Mock context with necessary methods
   */
  function setup () {
    const canvas = document.createElement('div')
    canvas.id = 'svgcanvas'
    document.body.appendChild(canvas)

    // Create SVG element
    const svgElem = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svgElem.setAttribute('width', '640')
    svgElem.setAttribute('height', '480')
    svgElem.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    canvas.appendChild(svgElem)

    const config = {
      initFill: {
        color: '000000',
        opacity: 1
      },
      initStroke: {
        color: 'FF0000',
        opacity: 1,
        width: 5
      },
      text: {
        stroke_width: 0,
        font_size: 24,
        font_family: 'serif'
      },
      initOpacity: 1
    }

    const svgCanvas = new EmbeddedSVGEdit.SvgCanvas(canvas, config)
    return { svgCanvas, canvas, svgElem }
  }

  it('should create foreignObject text with all required attributes', function () {
    const { svgCanvas } = setup()
    
    // Set text properties
    svgCanvas.setCurText('font_size', 18)
    svgCanvas.setCurText('font_family', 'Arial')
    svgCanvas.setCurText('fill', 'blue')
    
    // Create text element by simulating mousedown
    svgCanvas.setCurrentMode('text')
    const mockEvent = {
      type: 'mousedown',
      clientX: 200,
      clientY: 150,
      preventDefault: () => {},
      stopPropagation: () => {}
    }
    
    // Get the mousedown handler and simulate text creation
    svgCanvas.handleMouseDown(mockEvent, mockEvent.clientX, mockEvent.clientY)
    
    // Check if foreignObject was created with required attributes
    const foreignObjects = svgCanvas.getSvgContent().querySelectorAll('foreignObject[se\\:type="text"]')
    expect(foreignObjects.length).to.be.at.least(1)
    
    const fo = foreignObjects[0]
    expect(fo.getAttribute('font-size')).to.equal('18')
    expect(fo.getAttribute('font-family')).to.equal('Arial')
    expect(fo.getAttribute('fill')).to.equal('blue')
    expect(fo.getAttribute('font-weight')).to.equal('normal')
    expect(fo.getAttribute('font-style')).to.equal('normal')
    expect(fo.getAttribute('text-decoration')).to.equal('none')
    expect(fo.getAttribute('text-anchor')).to.equal('middle')
  })

  it('should restore text attributes from SVG string', function () {
    const { svgCanvas } = setup()
    
    const svgString = `<svg width="640" height="480" xmlns="http://www.w3.org/2000/svg" xmlns:se="http://svg-edit.googlecode.com">
      <g>
        <foreignObject x="100" y="100" width="200" height="40" se:type="text" 
                       font-size="20" font-family="Verdana" font-weight="bold" 
                       font-style="italic" fill="green" text-anchor="start"
                       text-decoration="underline">
          <div xmlns="http://www.w3.org/1999/xhtml" style="width: 100%; height: 100%; display: block;">Test Text</div>
        </foreignObject>
      </g>
    </svg>`
    
    // Load the SVG
    const success = svgCanvas.setSvgString(svgString)
    expect(success).to.be.true
    
    // Check if attributes are preserved
    const fo = svgCanvas.getSvgContent().querySelector('foreignObject[se\\:type="text"]')
    expect(fo).to.not.be.null
    expect(fo.getAttribute('font-size')).to.equal('20')
    expect(fo.getAttribute('font-family')).to.equal('Verdana')
    expect(fo.getAttribute('font-weight')).to.equal('bold')
    expect(fo.getAttribute('font-style')).to.equal('italic')
    expect(fo.getAttribute('fill')).to.equal('green')
    expect(fo.getAttribute('text-anchor')).to.equal('start')
    expect(fo.getAttribute('text-decoration')).to.equal('underline')
    
    // Check if div styles are correctly restored
    const div = fo.querySelector('div')
    expect(div).to.not.be.null
    const computedStyle = window.getComputedStyle(div)
    expect(parseInt(computedStyle.fontSize)).to.equal(20)
    expect(computedStyle.fontFamily).to.include('Verdana')
    expect(computedStyle.fontWeight).to.equal('bold')
    expect(computedStyle.fontStyle).to.equal('italic')
    expect(computedStyle.color).to.equal('rgb(0, 128, 0)') // green
    expect(computedStyle.textAlign).to.equal('left') // start maps to left
    expect(computedStyle.textDecoration).to.include('underline')
  })

  it('should restore attributes even when div has no inline styles', function () {
    const { svgCanvas } = setup()
    
    const svgString = `<svg width="640" height="480" xmlns="http://www.w3.org/2000/svg" xmlns:se="http://svg-edit.googlecode.com">
      <g>
        <foreignObject x="100" y="100" width="200" height="40" se:type="text" 
                       font-size="16" font-family="Georgia" font-weight="bold" 
                       fill="red" text-anchor="middle">
          <div xmlns="http://www.w3.org/1999/xhtml" style="display: block;">No Inline Styles</div>
        </foreignObject>
      </g>
    </svg>`
    
    // Load the SVG
    const success = svgCanvas.setSvgString(svgString)
    expect(success).to.be.true
    
    // Check if div styles are correctly restored from foreignObject attributes
    const div = svgCanvas.getSvgContent().querySelector('foreignObject[se\\:type="text"] div')
    expect(div).to.not.be.null
    
    const computedStyle = window.getComputedStyle(div)
    expect(parseInt(computedStyle.fontSize)).to.equal(16)
    expect(computedStyle.fontFamily).to.include('Georgia')
    expect(computedStyle.fontWeight).to.equal('bold')
    expect(computedStyle.color).to.equal('rgb(255, 0, 0)') // red
    expect(computedStyle.textAlign).to.equal('center') // middle maps to center
  })

  it('should update both div style and foreignObject attribute when changing font size', function () {
    const { svgCanvas } = setup()
    
    // Create a text element first
    const svgString = `<svg width="640" height="480" xmlns="http://www.w3.org/2000/svg" xmlns:se="http://svg-edit.googlecode.com">
      <g>
        <foreignObject x="100" y="100" width="200" height="40" se:type="text" id="test_text">
          <div xmlns="http://www.w3.org/1999/xhtml" style="font-size: 16px;">Test</div>
        </foreignObject>
      </g>
    </svg>`
    
    svgCanvas.setSvgString(svgString)
    
    // Select the element
    const fo = svgCanvas.getSvgContent().querySelector('#test_text')
    svgCanvas.addToSelection([fo])
    
    // Change font size using the canvas method
    svgCanvas.setFontSize(24)
    
    // Check that both attribute and div style are updated
    expect(fo.getAttribute('font-size')).to.equal('24')
    const div = fo.querySelector('div')
    expect(div.style.fontSize).to.equal('24px')
  })

  it('should update both div style and foreignObject attribute when changing font family', function () {
    const { svgCanvas } = setup()
    
    // Create a text element first
    const svgString = `<svg width="640" height="480" xmlns="http://www.w3.org/2000/svg" xmlns:se="http://svg-edit.googlecode.com">
      <g>
        <foreignObject x="100" y="100" width="200" height="40" se:type="text" id="test_text">
          <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Arial;">Test</div>
        </foreignObject>
      </g>
    </svg>`
    
    svgCanvas.setSvgString(svgString)
    
    // Select the element
    const fo = svgCanvas.getSvgContent().querySelector('#test_text')
    svgCanvas.addToSelection([fo])
    
    // Change font family using the canvas method
    svgCanvas.setFontFamily('Verdana')
    
    // Check that both attribute and div style are updated
    expect(fo.getAttribute('font-family')).to.equal('Verdana')
    const div = fo.querySelector('div')
    expect(div.style.fontFamily).to.equal('Verdana')
  })

  it('should update both div style and foreignObject attribute when changing font weight', function () {
    const { svgCanvas } = setup()
    
    // Create a text element first
    const svgString = `<svg width="640" height="480" xmlns="http://www.w3.org/2000/svg" xmlns:se="http://svg-edit.googlecode.com">
      <g>
        <foreignObject x="100" y="100" width="200" height="40" se:type="text" id="test_text">
          <div xmlns="http://www.w3.org/1999/xhtml">Test</div>
        </foreignObject>
      </g>
    </svg>`
    
    svgCanvas.setSvgString(svgString)
    
    // Select the element
    const fo = svgCanvas.getSvgContent().querySelector('#test_text')
    svgCanvas.addToSelection([fo])
    
    // Make it bold using the canvas method
    svgCanvas.setBold(true)
    
    // Check that both attribute and div style are updated
    expect(fo.getAttribute('font-weight')).to.equal('bold')
    const div = fo.querySelector('div')
    expect(div.style.fontWeight).to.equal('bold')
  })

  it('should update both div style and foreignObject attribute when changing text color', function () {
    const { svgCanvas } = setup()
    
    // Create a text element first
    const svgString = `<svg width="640" height="480" xmlns="http://www.w3.org/2000/svg" xmlns:se="http://svg-edit.googlecode.com">
      <g>
        <foreignObject x="100" y="100" width="200" height="40" se:type="text" id="test_text">
          <div xmlns="http://www.w3.org/1999/xhtml">Test</div>
        </foreignObject>
      </g>
    </svg>`
    
    svgCanvas.setSvgString(svgString)
    
    // Select the element
    const fo = svgCanvas.getSvgContent().querySelector('#test_text')
    svgCanvas.addToSelection([fo])
    
    // Change color using the canvas method
    svgCanvas.setFontColor('purple')
    
    // Check that both attribute and div style are updated
    expect(fo.getAttribute('fill')).to.equal('purple')
    const div = fo.querySelector('div')
    expect(div.style.color).to.equal('purple')
  })

  it('should handle SVG export with all text attributes preserved', function () {
    const { svgCanvas } = setup()
    
    // Create a complex text element
    const svgString = `<svg width="640" height="480" xmlns="http://www.w3.org/2000/svg" xmlns:se="http://svg-edit.googlecode.com">
      <g>
        <foreignObject x="100" y="100" width="250" height="50" se:type="text" 
                       font-size="22" font-family="monospace" font-weight="bold" 
                       font-style="italic" fill="#ff6b35" text-anchor="start"
                       text-decoration="underline overline">
          <div xmlns="http://www.w3.org/1999/xhtml" style="font-size: 22px; font-family: monospace; font-weight: bold; font-style: italic; color: #ff6b35; text-align: left; text-decoration: underline overline;">Complex Text</div>
        </foreignObject>
      </g>
    </svg>`
    
    svgCanvas.setSvgString(svgString)
    
    // Export SVG and verify all attributes are preserved
    const exportedSvg = svgCanvas.svgCanvasToString()
    
    expect(exportedSvg).to.include('font-size="22"')
    expect(exportedSvg).to.include('font-family="monospace"')
    expect(exportedSvg).to.include('font-weight="bold"')
    expect(exportedSvg).to.include('font-style="italic"')
    expect(exportedSvg).to.include('fill="#ff6b35"')
    expect(exportedSvg).to.include('text-anchor="start"')
    expect(exportedSvg).to.include('text-decoration="underline overline"')
    expect(exportedSvg).to.include('se:type="text"')
  })

  afterEach(() => {
    // Clean up DOM
    const canvas = document.getElementById('svgcanvas')
    if (canvas) {
      canvas.remove()
    }
  })
})