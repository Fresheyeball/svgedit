/**
 * @module text-actions Tools for Text edit functions
 * @license MIT
 *
 * @copyright 2010 Alexis Deveria, 2010 Jeff Schiller
 */

import { NS } from './namespaces.js'
import { transformPoint, getMatrix } from './math.js'
import {
  assignAttributes,
  getElement,
  getBBox as utilsGetBBox
} from './utilities.js'
import { supportsGoodTextCharPos } from '../common/browser.js'

let svgCanvas = null

/**
 * @function module:text-actions.init
 * @param {module:text-actions.svgCanvas} textActionsContext
 * @returns {void}
 */
export const init = canvas => {
  svgCanvas = canvas
}

/**
 * Helper function to check if element is a text foreignObject
 * @param {Element} elem
 * @returns {boolean}
 */
const isTextForeignObject = (elem) => {
  return elem && elem.tagName === 'foreignObject' && elem.getAttribute('se:type') === 'text'
}

/**
 * Helper function to get the div element inside a text foreignObject
 * @param {Element} fo
 * @returns {Element|null}
 */
const getTextDiv = (fo) => {
  if (!isTextForeignObject(fo)) return null
  return fo.querySelector('div')
}

/**
 * Group: Text edit functions
 * Functions relating to editing text elements.
 * @namespace {PlainObject} textActions
 * @memberof module:svgcanvas.SvgCanvas#
 */
export const textActionsMethod = (function () {
  let curtext
  let textinput
  let cursor
  let selblock
  let blinker
  let chardata = []
  let textbb // , transbb;
  let matrix
  let lastX
  let lastY
  let allowDbl
  let currentTextDiv = null // For foreignObject text editing

  // Event handlers for foreignObject text editing
  const handleTextInput = (evt) => {
    // Trigger change event for undo/redo
    svgCanvas.call('changed', [curtext])
  }

  const handleTextBlur = (evt) => {
    // Exit text edit mode when div loses focus
    svgCanvas.textActions.toSelectMode(true)
  }

  const handleTextKeydown = (evt) => {
    // Handle escape key to exit edit mode
    if (evt.key === 'Escape') {
      evt.preventDefault()
      svgCanvas.textActions.toSelectMode(true)
      return
    }
    
    // Handle enter key to create proper line breaks
    if (evt.key === 'Enter') {
      evt.preventDefault()
      
      // Insert a line break using document.execCommand or manual DOM manipulation
      const selection = window.getSelection()
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        range.deleteContents()
        
        // Create a new div element for the new line
        const newDiv = document.createElement('div')
        newDiv.innerHTML = '<br>' // Ensure the div has some content
        
        range.insertNode(newDiv)
        
        // Move cursor to the new div
        range.setStartAfter(newDiv)
        range.setEndAfter(newDiv)
        selection.removeAllRanges()
        selection.addRange(range)
      }
      
      // Trigger change event for undo/redo
      svgCanvas.call('changed', [curtext])
    }
  }

  /**
   *
   * @param {Integer} index
   * @returns {void}
   */
  function setCursor (index) {
    const empty = textinput.value === ''
    textinput.focus()

    if (!arguments.length) {
      if (empty) {
        index = 0
      } else {
        if (textinput.selectionEnd !== textinput.selectionStart) {
          return
        }
        index = textinput.selectionEnd
      }
    }

    const charbb = chardata[index]
    if (!empty) {
      textinput.setSelectionRange(index, index)
    }
    cursor = getElement('text_cursor')
    if (!cursor) {
      cursor = document.createElementNS(NS.SVG, 'line')
      assignAttributes(cursor, {
        id: 'text_cursor',
        stroke: '#333',
        'stroke-width': 1
      })
      getElement('selectorParentGroup').append(cursor)
    }

    if (!blinker) {
      blinker = setInterval(function () {
        const show = cursor.getAttribute('display') === 'none'
        cursor.setAttribute('display', show ? 'inline' : 'none')
      }, 600)
    }

    const startPt = ptToScreen(charbb.x, textbb.y)
    const endPt = ptToScreen(charbb.x, textbb.y + textbb.height)

    assignAttributes(cursor, {
      x1: startPt.x,
      y1: startPt.y,
      x2: endPt.x,
      y2: endPt.y,
      visibility: 'visible',
      display: 'inline'
    })

    if (selblock) {
      selblock.setAttribute('d', '')
    }
  }

  /**
   *
   * @param {Integer} start
   * @param {Integer} end
   * @param {boolean} skipInput
   * @returns {void}
   */
  function setSelection (start, end, skipInput) {
    if (start === end) {
      setCursor(end)
      return
    }

    if (!skipInput) {
      textinput.setSelectionRange(start, end)
    }

    selblock = getElement('text_selectblock')
    if (!selblock) {
      selblock = document.createElementNS(NS.SVG, 'path')
      assignAttributes(selblock, {
        id: 'text_selectblock',
        fill: 'green',
        opacity: 0.5,
        style: 'pointer-events:none'
      })
      getElement('selectorParentGroup').append(selblock)
    }

    const startbb = chardata[start]
    const endbb = chardata[end]

    cursor.setAttribute('visibility', 'hidden')

    const tl = ptToScreen(startbb.x, textbb.y)
    const tr = ptToScreen(startbb.x + (endbb.x - startbb.x), textbb.y)
    const bl = ptToScreen(startbb.x, textbb.y + textbb.height)
    const br = ptToScreen(
      startbb.x + (endbb.x - startbb.x),
      textbb.y + textbb.height
    )

    const dstr =
      'M' +
      tl.x +
      ',' +
      tl.y +
      ' L' +
      tr.x +
      ',' +
      tr.y +
      ' ' +
      br.x +
      ',' +
      br.y +
      ' ' +
      bl.x +
      ',' +
      bl.y +
      'z'

    assignAttributes(selblock, {
      d: dstr,
      display: 'inline'
    })
  }

  /**
   *
   * @param {Float} mouseX
   * @param {Float} mouseY
   * @returns {Integer}
   */
  function getIndexFromPoint (mouseX, mouseY) {
    // Position cursor here
    const pt = svgCanvas.getSvgRoot().createSVGPoint()
    pt.x = mouseX
    pt.y = mouseY

    // No content, so return 0
    if (chardata.length === 1) {
      return 0
    }
    // Determine if cursor should be on left or right of character
    let charpos = curtext.getCharNumAtPosition(pt)
    if (charpos < 0) {
      // Out of text range, look at mouse coords
      charpos = chardata.length - 2
      if (mouseX <= chardata[0].x) {
        charpos = 0
      }
    } else if (charpos >= chardata.length - 2) {
      charpos = chardata.length - 2
    }
    const charbb = chardata[charpos]
    const mid = charbb.x + charbb.width / 2
    if (mouseX > mid) {
      charpos++
    }
    return charpos
  }

  /**
   *
   * @param {Float} mouseX
   * @param {Float} mouseY
   * @returns {void}
   */
  function setCursorFromPoint (mouseX, mouseY) {
    setCursor(getIndexFromPoint(mouseX, mouseY))
  }

  /**
   *
   * @param {Float} x
   * @param {Float} y
   * @param {boolean} apply
   * @returns {void}
   */
  function setEndSelectionFromPoint (x, y, apply) {
    const i1 = textinput.selectionStart
    const i2 = getIndexFromPoint(x, y)

    const start = Math.min(i1, i2)
    const end = Math.max(i1, i2)
    setSelection(start, end, !apply)
  }

  /**
   *
   * @param {Float} xIn
   * @param {Float} yIn
   * @returns {module:math.XYObject}
   */
  function screenToPt (xIn, yIn) {
    const out = {
      x: xIn,
      y: yIn
    }
    const zoom = svgCanvas.getZoom()
    out.x /= zoom
    out.y /= zoom

    if (matrix) {
      const pt = transformPoint(out.x, out.y, matrix.inverse())
      out.x = pt.x
      out.y = pt.y
    }

    return out
  }

  /**
   *
   * @param {Float} xIn
   * @param {Float} yIn
   * @returns {module:math.XYObject}
   */
  function ptToScreen (xIn, yIn) {
    const out = {
      x: xIn,
      y: yIn
    }

    if (matrix) {
      const pt = transformPoint(out.x, out.y, matrix)
      out.x = pt.x
      out.y = pt.y
    }
    const zoom = svgCanvas.getZoom()
    out.x *= zoom
    out.y *= zoom

    return out
  }

  /**
   *
   * @param {Event} evt
   * @returns {void}
   */
  function selectAll (evt) {
    setSelection(0, curtext.textContent.length)
    evt.target.removeEventListener('click', selectAll)
  }

  /**
   *
   * @param {Event} evt
   * @returns {void}
   */
  function selectWord (evt) {
    if (!allowDbl || !curtext) {
      return
    }
    const zoom = svgCanvas.getZoom()
    const ept = transformPoint(evt.pageX, evt.pageY, svgCanvas.getrootSctm())
    const mouseX = ept.x * zoom
    const mouseY = ept.y * zoom
    const pt = screenToPt(mouseX, mouseY)

    const index = getIndexFromPoint(pt.x, pt.y)
    const str = curtext.textContent
    const first = str.substr(0, index).replace(/[a-z\d]+$/i, '').length
    const m = str.substr(index).match(/^[a-z\d]+/i)
    const last = (m ? m[0].length : 0) + index
    setSelection(first, last)

    // Set tripleclick
    svgCanvas.$click(evt.target, selectAll)

    setTimeout(function () {
      evt.target.removeEventListener('click', selectAll)
    }, 300)
  }

  return /** @lends module:svgcanvas.SvgCanvas#textActions */ {
    /**
     * @param {Element} target
     * @param {Float} x
     * @param {Float} y
     * @returns {void}
     */
    select (target, x, y) {
      curtext = target
      svgCanvas.textActions.toEditMode(x, y)
    },
    /**
     * @param {Element} elem
     * @returns {void}
     */
    start (elem) {
      curtext = elem
      svgCanvas.textActions.toEditMode()
    },
    /**
     * @param {external:MouseEvent} evt
     * @param {Element} mouseTarget
     * @param {Float} startX
     * @param {Float} startY
     * @returns {void}
     */
    mouseDown (evt, mouseTarget, startX, startY) {
      const pt = screenToPt(startX, startY)

      textinput.focus()
      setCursorFromPoint(pt.x, pt.y)
      lastX = startX
      lastY = startY

      // TODO: Find way to block native selection
    },
    /**
     * @param {Float} mouseX
     * @param {Float} mouseY
     * @returns {void}
     */
    mouseMove (mouseX, mouseY) {
      const pt = screenToPt(mouseX, mouseY)
      setEndSelectionFromPoint(pt.x, pt.y)
    },
    /**
     * @param {external:MouseEvent} evt
     * @param {Float} mouseX
     * @param {Float} mouseY
     * @returns {void}
     */
    mouseUp (evt, mouseX, mouseY) {
      const pt = screenToPt(mouseX, mouseY)

      setEndSelectionFromPoint(pt.x, pt.y, true)

      // TODO: Find a way to make this work: Use transformed BBox instead of evt.target
      // if (lastX === mouseX && lastY === mouseY
      //   && !rectsIntersect(transbb, {x: pt.x, y: pt.y, width: 0, height: 0})) {
      //   svgCanvas.textActions.toSelectMode(true);
      // }

      if (
        evt.target !== curtext &&
        mouseX < lastX + 2 &&
        mouseX > lastX - 2 &&
        mouseY < lastY + 2 &&
        mouseY > lastY - 2
      ) {
        svgCanvas.textActions.toSelectMode(true)
      }
    },
    /**
     * @function
     * @param {Integer} index
     * @returns {void}
     */
    setCursor,
    /**
     * @param {Float} x
     * @param {Float} y
     * @returns {void}
     */
    toEditMode (x, y) {
      allowDbl = false
      svgCanvas.setCurrentMode('textedit')
      svgCanvas.selectorManager.requestSelector(curtext).showGrips(false)

      // Check if this is a foreignObject text element
      if (isTextForeignObject(curtext)) {
        currentTextDiv = getTextDiv(curtext)
        if (currentTextDiv) {
          // Enable editing on the div
          currentTextDiv.focus()
          // Select all text on first click
          const range = document.createRange()
          range.selectNodeContents(currentTextDiv)
          const selection = window.getSelection()
          selection.removeAllRanges()
          selection.addRange(range)

          // Add event listeners for content changes
          currentTextDiv.addEventListener('input', handleTextInput)
          currentTextDiv.addEventListener('blur', handleTextBlur)
          currentTextDiv.addEventListener('keydown', handleTextKeydown)
        }
        return
      }

      // Original text element handling
      svgCanvas.textActions.init()
      curtext.style.cursor = 'text'

      if (!arguments.length) {
        setCursor()
      } else {
        const pt = screenToPt(x, y)
        setCursorFromPoint(pt.x, pt.y)
      }

      setTimeout(function () {
        allowDbl = true
      }, 300)
    },
    /**
     * @param {boolean|Element} selectElem
     * @fires module:svgcanvas.SvgCanvas#event:selected
     * @returns {void}
     */
    toSelectMode (selectElem) {
      svgCanvas.setCurrentMode('select')

      // Handle foreignObject text cleanup
      if (currentTextDiv) {
        currentTextDiv.removeEventListener('input', handleTextInput)
        currentTextDiv.removeEventListener('blur', handleTextBlur)
        currentTextDiv.removeEventListener('keydown', handleTextKeydown)
        currentTextDiv.blur()

        // Check if empty and delete if so
        if (!currentTextDiv.textContent.trim()) {
          svgCanvas.deleteSelectedElements()
        }
        currentTextDiv = null
      }

      // Original text element cleanup
      clearInterval(blinker)
      blinker = null
      if (selblock) {
        selblock.setAttribute('display', 'none')
      }
      if (cursor) {
        cursor.setAttribute('visibility', 'hidden')
      }
      if (curtext) {
        curtext.style.cursor = 'move'
      }

      if (selectElem) {
        svgCanvas.clearSelection()
        if (curtext) {
          curtext.style.cursor = 'move'
          svgCanvas.call('selected', [curtext])
          svgCanvas.addToSelection([curtext], true)
        }
      }

      // For regular text elements
      if (curtext && !isTextForeignObject(curtext) && !curtext.textContent.length) {
        svgCanvas.deleteSelectedElements()
      }

      textinput.blur()
      curtext = false
    },
    /**
     * @param {Element} elem
     * @returns {void}
     */
    setInputElem (elem) {
      textinput = elem
    },
    /**
     * @returns {void}
     */
    clear () {
      if (svgCanvas.getCurrentMode() === 'textedit') {
        svgCanvas.textActions.toSelectMode()
      }
    },
    /**
     * @param {Element} _inputElem Not in use
     * @returns {void}
     */
    init (_inputElem) {
      if (!curtext) {
        return
      }

      // Handle foreignObject text elements
      if (isTextForeignObject(curtext)) {
        currentTextDiv = getTextDiv(curtext)
        if (currentTextDiv) {
          // Just ensure the div is ready for editing
          // The actual focus and selection happens in toEditMode
        }
        return
      }

      // Original text element handling
      let i
      let end

      if (!curtext.parentNode) {
        // Result of the ffClone, need to get correct element
        const selectedElements = svgCanvas.getSelectedElements()
        curtext = selectedElements[0]
        svgCanvas.selectorManager.requestSelector(curtext).showGrips(false)
      }

      const str = curtext.textContent
      const len = str.length

      const xform = curtext.getAttribute('transform')

      textbb = utilsGetBBox(curtext)

      matrix = xform ? getMatrix(curtext) : null

      chardata = []
      chardata.length = len
      textinput.focus()

      curtext.removeEventListener('dblclick', selectWord)
      curtext.addEventListener('dblclick', selectWord)

      if (!len) {
        end = { x: textbb.x + textbb.width / 2, width: 0 }
      }

      for (i = 0; i < len; i++) {
        const start = curtext.getStartPositionOfChar(i)
        end = curtext.getEndPositionOfChar(i)

        if (!supportsGoodTextCharPos()) {
          const zoom = svgCanvas.getZoom()
          const offset = svgCanvas.contentW * zoom
          start.x -= offset
          end.x -= offset

          start.x /= zoom
          end.x /= zoom
        }

        // Get a "bbox" equivalent for each character. Uses the
        // bbox data of the actual text for y, height purposes

        // TODO: Decide if y, width and height are actually necessary
        chardata[i] = {
          x: start.x,
          y: textbb.y, // start.y?
          width: end.x - start.x,
          height: textbb.height
        }
      }

      // Add a last bbox for cursor at end of text
      chardata.push({
        x: end.x,
        width: 0
      })
      setSelection(textinput.selectionStart, textinput.selectionEnd, true)
    }
  }
})()
