/**
 * Utility functions for converting between SVG text attributes and CSS styles
 * This provides the isomorphism needed to store text styling information
 * exclusively in the div element's style attribute instead of foreignObject attributes
 * @module text-style-utils
 */

/**
 * Maps SVG text-anchor values to CSS text-align values
 */
export const textAnchorToTextAlign = {
  start: 'left',
  middle: 'center',
  end: 'right',
  justify: 'justify'
}

/**
 * Maps CSS text-align values to SVG text-anchor values
 */
export const textAlignToTextAnchor = {
  left: 'start',
  center: 'middle',
  right: 'end',
  justify: 'justify'
}

/**
 * Maps SVG font-style values to CSS font-style values (1:1 mapping)
 */
export const svgFontStyleToCssFontStyle = {
  normal: 'normal',
  italic: 'italic',
  oblique: 'oblique'
}

/**
 * Maps SVG font-weight values to CSS font-weight values (1:1 mapping)
 */
export const svgFontWeightToCssFontWeight = {
  normal: 'normal',
  bold: 'bold',
  bolder: 'bolder',
  lighter: 'lighter',
  100: '100',
  200: '200',
  300: '300',
  400: '400',
  500: '500',
  600: '600',
  700: '700',
  800: '800',
  900: '900'
}

/**
 * Maps SVG text-decoration values to CSS text-decoration values
 * SVG allows multiple space-separated values, CSS uses the same format
 */
export const svgTextDecorationToCssTextDecoration = {
  none: 'none',
  underline: 'underline',
  overline: 'overline',
  'line-through': 'line-through'
}

/**
 * Get the text-align CSS value from a text div element
 * @param {HTMLElement} textDiv - The div element containing the text
 * @returns {string} The text-align value (left, center, right, justify)
 */
export const getTextAlignFromDiv = (textDiv) => {
  if (!textDiv) return 'left'

  // Check inline style first, then computed style
  const inlineAlign = textDiv.style.textAlign
  if (inlineAlign && inlineAlign !== 'initial' && inlineAlign !== 'inherit') {
    return inlineAlign
  }

  const computedAlign = window.getComputedStyle(textDiv).textAlign
  return computedAlign || 'left'
}

/**
 * Set the text-align CSS value on a text div element
 * @param {HTMLElement} textDiv - The div element containing the text
 * @param {string} textAlign - The text-align value (left, center, right, justify)
 */
export const setTextAlignOnDiv = (textDiv, textAlign) => {
  if (textDiv) {
    textDiv.style.textAlign = textAlign
  }
}

/**
 * Get the equivalent text-anchor value for the current text alignment of a div
 * @param {HTMLElement} textDiv - The div element containing the text
 * @returns {string} The equivalent text-anchor value (start, middle, end, justify)
 */
export const getTextAnchorFromDiv = (textDiv) => {
  const textAlign = getTextAlignFromDiv(textDiv)
  return textAlignToTextAnchor[textAlign] || 'start'
}

/**
 * Set text alignment using text-anchor semantics but applying to div styles
 * @param {HTMLElement} textDiv - The div element containing the text
 * @param {string} textAnchor - The text-anchor value (start, middle, end, justify)
 */
export const setTextAnchorOnDiv = (textDiv, textAnchor) => {
  const textAlign = textAnchorToTextAlign[textAnchor] || 'left'
  setTextAlignOnDiv(textDiv, textAlign)
}

/**
 * Get font-style from a text div element
 * @param {HTMLElement} textDiv - The div element containing the text
 * @returns {string} The font-style value (normal, italic, oblique)
 */
export const getFontStyleFromDiv = (textDiv) => {
  if (!textDiv) return 'normal'

  const inlineStyle = textDiv.style.fontStyle
  if (inlineStyle && inlineStyle !== 'initial' && inlineStyle !== 'inherit') {
    return inlineStyle
  }

  const computedStyle = window.getComputedStyle(textDiv).fontStyle
  return computedStyle || 'normal'
}

/**
 * Set font-style on a text div element
 * @param {HTMLElement} textDiv - The div element containing the text
 * @param {string} fontStyle - The font-style value (normal, italic, oblique)
 */
export const setFontStyleOnDiv = (textDiv, fontStyle) => {
  if (textDiv) {
    textDiv.style.fontStyle = fontStyle
  }
}

/**
 * Get font-weight from a text div element
 * @param {HTMLElement} textDiv - The div element containing the text
 * @returns {string} The font-weight value (normal, bold, or numeric)
 */
export const getFontWeightFromDiv = (textDiv) => {
  if (!textDiv) return 'normal'

  const inlineWeight = textDiv.style.fontWeight
  if (inlineWeight && inlineWeight !== 'initial' && inlineWeight !== 'inherit') {
    return inlineWeight
  }

  const computedWeight = window.getComputedStyle(textDiv).fontWeight
  return computedWeight || 'normal'
}

/**
 * Set font-weight on a text div element
 * @param {HTMLElement} textDiv - The div element containing the text
 * @param {string} fontWeight - The font-weight value (normal, bold, or numeric)
 */
export const setFontWeightOnDiv = (textDiv, fontWeight) => {
  if (textDiv) {
    textDiv.style.fontWeight = fontWeight
  }
}

/**
 * Get font-family from a text div element
 * @param {HTMLElement} textDiv - The div element containing the text
 * @returns {string} The font-family value
 */
export const getFontFamilyFromDiv = (textDiv) => {
  if (!textDiv) return 'Arial'

  const inlineFamily = textDiv.style.fontFamily
  if (inlineFamily && inlineFamily !== 'initial' && inlineFamily !== 'inherit') {
    return inlineFamily.replace(/['"]/g, '') // Remove quotes
  }

  const computedFamily = window.getComputedStyle(textDiv).fontFamily
  return computedFamily ? computedFamily.replace(/['"]/g, '') : 'Arial'
}

/**
 * Set font-family on a text div element
 * @param {HTMLElement} textDiv - The div element containing the text
 * @param {string} fontFamily - The font-family value
 */
export const setFontFamilyOnDiv = (textDiv, fontFamily) => {
  if (textDiv) {
    textDiv.style.fontFamily = fontFamily
  }
}

/**
 * Get font-size from a text div element (returns numeric value in pixels)
 * @param {HTMLElement} textDiv - The div element containing the text
 * @returns {number} The font-size value in pixels
 */
export const getFontSizeFromDiv = (textDiv) => {
  if (!textDiv) return 16

  const inlineSize = textDiv.style.fontSize
  if (inlineSize && inlineSize !== 'initial' && inlineSize !== 'inherit') {
    return parseFloat(inlineSize) || 16
  }

  const computedSize = window.getComputedStyle(textDiv).fontSize
  return parseFloat(computedSize) || 16
}

/**
 * Set font-size on a text div element
 * @param {HTMLElement} textDiv - The div element containing the text
 * @param {number} fontSize - The font-size value in pixels
 */
export const setFontSizeOnDiv = (textDiv, fontSize) => {
  if (textDiv) {
    textDiv.style.fontSize = fontSize + 'px'
  }
}

/**
 * Get text color from a text div element
 * @param {HTMLElement} textDiv - The div element containing the text
 * @returns {string} The color value
 */
export const getColorFromDiv = (textDiv) => {
  if (!textDiv) return '#000000'

  const inlineColor = textDiv.style.color
  if (inlineColor && inlineColor !== 'initial' && inlineColor !== 'inherit') {
    return inlineColor
  }

  const computedColor = window.getComputedStyle(textDiv).color
  return computedColor || '#000000'
}

/**
 * Set text color on a text div element
 * @param {HTMLElement} textDiv - The div element containing the text
 * @param {string} color - The color value
 */
export const setColorOnDiv = (textDiv, color) => {
  if (textDiv) {
    textDiv.style.color = color
  }
}

/**
 * Get text-decoration from a text div element
 * @param {HTMLElement} textDiv - The div element containing the text
 * @returns {string} The text-decoration value
 */
export const getTextDecorationFromDiv = (textDiv) => {
  if (!textDiv) return 'none'

  const inlineDecoration = textDiv.style.textDecoration
  if (inlineDecoration && inlineDecoration !== 'initial' && inlineDecoration !== 'inherit') {
    return inlineDecoration
  }

  const computedDecoration = window.getComputedStyle(textDiv).textDecoration
  return computedDecoration || 'none'
}

/**
 * Set text-decoration on a text div element
 * @param {HTMLElement} textDiv - The div element containing the text
 * @param {string} textDecoration - The text-decoration value
 */
export const setTextDecorationOnDiv = (textDiv, textDecoration) => {
  if (textDiv) {
    textDiv.style.textDecoration = textDecoration
  }
}

/**
 * Helper to check if an element is a foreignObject text element
 * @param {Element} element - The element to check
 * @returns {boolean} True if it's a foreignObject with se:type="text"
 */
export const isTextForeignObject = (element) => {
  return element &&
         element.tagName === 'foreignObject' &&
         element.getAttribute('se:type') === 'text'
}

/**
 * Get the text div from a foreignObject element
 * @param {Element} foreignObject - The foreignObject element
 * @returns {HTMLElement|null} The text div element or null
 */
export const getTextDivFromForeignObject = (foreignObject) => {
  if (!isTextForeignObject(foreignObject)) return null
  return foreignObject.querySelector('div')
}
