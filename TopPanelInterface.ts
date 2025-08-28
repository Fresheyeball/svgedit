/**
 * TypeScript interface for TopPanel.js
 * Generated based on the public methods and properties exposed in TopPanel.js
 */

interface Editor {
  selectedElement: Element | null;
  multiselected: boolean;
  svgCanvas: any;
  title: string;
  i18next: any;
  $svgEditor: HTMLElement;
  $container: HTMLElement;
  configObj: {
    curConfig: {
      baseUnit: string;
    };
  };
}

interface PathActions {
  getNodePoint(): any;
}

export interface TopPanelInterface {
  // Constructor
  new (editor: Editor): TopPanelInterface;

  // Properties
  editor: Editor;

  // Getters
  readonly selectedElement: Element | null;
  readonly multiselected: boolean;
  readonly path: PathActions;
  readonly anyTextSelected: boolean;

  // Core display methods
  displayTool(className: string): void;
  hideTool(className: string): void;

  // Update methods
  update(): void;
  updateContextPanel(): void;
  updateTitle(title?: string): void;

  // Stroke and style methods
  setStrokeOpt(opt: Element, changeElem?: boolean): void;

  // Media/URL methods
  promptImgURL(options?: { cancelDeletes?: boolean }): Promise<void>;
  setImageURL(url: string): void;

  // Source editor
  showSourceEditor(e: Event, forSaving?: boolean): void;

  // UI state methods
  clickWireframe(): void;

  // History methods
  clickUndo(): void;
  clickRedo(): void;

  // Attribute/value change handlers
  changeRectRadius(e: Event): void;
  changeFontSize(e: Event): void;
  changeRotationAngle(e: Event): void;
  changeBlur(e: Event): void;
  changeLetterSpacing(e: Event): void;
  changeWordSpacing(e: Event): void;
  changeTextLength(e: Event): void;
  changeLengthAdjust(evt: Event): void;
  attrChanger(e: Event): void;

  // Group/selection operations
  clickGroup(): void;
  clickClone(): void;
  deleteSelected(): void;

  // Alignment methods
  clickAlignEle(evt: Event): void;
  clickAlign(pos: string): void;

  // Z-order methods  
  moveToTopSelected(): void;
  moveToBottomSelected(): void;

  // Path operations
  convertToPath(): void;
  reorientPath(): void;
  togglePathEditMode(editMode: boolean, elems: Element[]): void;

  // Path node operations
  linkControlPoints(): void;
  clonePathNode(): void;
  deletePathNode(): void;
  addSubPath(): void;
  opencloseSubPath(): void;

  // Hyperlink operations
  makeHyperlink(): void;

  // Text formatting methods
  clickBold(): boolean | void;
  clickItalic(): boolean | void;
  clickTextDecoration(value: string): boolean | void;
  clickTextAnchor(evt: Event): boolean | void;

  // Initialization
  init(): void;
}

export default TopPanelInterface;