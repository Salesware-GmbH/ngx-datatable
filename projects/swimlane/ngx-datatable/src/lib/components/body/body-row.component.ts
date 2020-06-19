import {
  Component,
  Input,
  HostBinding,
  ElementRef,
  Output,
  KeyValueDiffers,
  KeyValueDiffer,
  EventEmitter,
  HostListener,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  DoCheck,
  SkipSelf
} from '@angular/core';

import { TreeStatus } from './body-cell.component';
import { columnsByPin, columnGroupWidths, columnsByPinArr } from '../../utils/column';
import { Keys } from '../../utils/keys';
import { ScrollbarHelper } from '../../services/scrollbar-helper.service';
import { translateXY } from '../../utils/translate';

@Component({
  selector: 'datatable-body-row',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      *ngFor="let colGroup of _columnsByPin; let i = index; trackBy: trackByGroups"
      class="datatable-row-{{ colGroup.type }} datatable-row-group"
      [ngStyle]="_groupStyles[colGroup.type]"
    >
      <datatable-body-cell
        *ngFor="let column of colGroup.columns; let ii = index; trackBy: columnTrackingFn"
        tabindex="-1"
        [row]="row"
        [group]="group"
        [expanded]="expanded"
        [isSelected]="isSelected"
        [rowIndex]="rowIndex"
        [column]="column"
        [rowHeight]="rowHeight"
        [displayCheck]="displayCheck"
        [treeStatus]="treeStatus"
        [dataAttributesCell]="dataAttributesCell"
        [explicitWidth]="getExplicitWidth(column)"
        (activate)="onActivate($event, ii)"
        (treeAction)="onTreeAction()"
      >
      </datatable-body-cell>
    </div>
  `
})
export class DataTableBodyRowComponent implements DoCheck {
  @Input() set columns(val: any[]) {
    this._columns = val;
    this.recalculateColumns(val);
    this.buildStylesByGroup();
    this.calculateColSpans();
  }

  get columns(): any[] {
    return this._columns;
  }

  @Input() set innerWidth(val: number) {
    if (this._columns) {
      const colByPin = columnsByPin(this._columns);
      this._columnGroupWidths = columnGroupWidths(colByPin, this._columns);
    }

    this._innerWidth = val;
    this.recalculateColumns();
    this.buildStylesByGroup();
  }

  get innerWidth(): number {
    return this._innerWidth;
  }

  private _dataAttributesRow: any;
  @Input() public get dataAttributesRow(): any {
    return this._dataAttributesRow;
  }
  public set dataAttributesRow(value: any) {
    this._dataAttributesRow = value;
    this.setDataAttributes();
  }

  @Input() dataAttributesCell: any;
  @Input() expanded: boolean;
  @Input() rowClass: any;

  private _row: any;
  @Input() public get row(): any {
    return this._row;
  }
  public set row(value: any) {
    this._row = value;
    this.setDataAttributes();
    this.calculateColSpans();
  }

  @Input() group: any;
  @Input() isSelected: boolean;
  @Input() rowIndex: number;
  @Input() displayCheck: any;
  @Input() treeStatus: TreeStatus = 'collapsed';

  @Input()
  set offsetX(val: number) {
    this._offsetX = val;
    this.buildStylesByGroup();
  }
  get offsetX() {
    return this._offsetX;
  }


  private _getColSpan: (row: any, column: any, columns: any[]) => number;
  @Input()
  public get getColSpan(): (row: any, column: any, columns: any[]) => number {
    return this._getColSpan;
  }
  public set getColSpan(value: (row: any, column: any, columns: any[]) => number) {
    this._getColSpan = value;
    this.calculateColSpans();
  }

  @HostBinding('class')
  get cssClass() {
    let cls = 'datatable-body-row';
    if (this.isSelected) {
      cls += ' active';
    }
    if (this.rowIndex % 2 !== 0) {
      cls += ' datatable-row-odd';
    }
    if (this.rowIndex % 2 === 0) {
      cls += ' datatable-row-even';
    }

    if (this.rowClass) {
      const res = this.rowClass(this.row);
      if (typeof res === 'string') {
        cls += ` ${res}`;
      } else if (typeof res === 'object') {
        const keys = Object.keys(res);
        for (const k of keys) {
          if (res[k] === true) {
            cls += ` ${k}`;
          }
        }
      }
    }

    return cls;
  }

  @HostBinding('style.height.px')
  @Input()
  rowHeight: number;

  @HostBinding('style.width.px')
  get columnsTotalWidths(): string {
    return this._columnGroupWidths.total;
  }

  @Output() activate: EventEmitter<any> = new EventEmitter();
  @Output() treeAction: EventEmitter<any> = new EventEmitter();

  _element: any;
  _columnGroupWidths: any;
  _columnsByPin: any;
  _offsetX: number;
  _columns: any[];
  _innerWidth: number;
  _groupStyles: { [prop: string]: {} } = {
    left: {},
    center: {},
    right: {}
  };

  private _rowDiffer: KeyValueDiffer<{}, {}>;
  private _columnWidthMap: WeakMap<any, number>;

  constructor(
    private differs: KeyValueDiffers,
    @SkipSelf() private scrollbarHelper: ScrollbarHelper,
    private cd: ChangeDetectorRef,
    element: ElementRef
  ) {
    this._element = element.nativeElement;
    this._rowDiffer = differs.find({}).create();
  }

  ngDoCheck(): void {
    if (this._rowDiffer.diff(this.row)) {
      this.cd.markForCheck();
    }
  }

  trackByGroups(index: number, colGroup: any): any {
    return colGroup.type;
  }

  columnTrackingFn(index: number, column: any): any {
    return column.$$id;
  }

  buildStylesByGroup() {
    this._groupStyles.left = this.calcStylesByGroup('left');
    this._groupStyles.center = this.calcStylesByGroup('center');
    this._groupStyles.right = this.calcStylesByGroup('right');
    this.cd.markForCheck();
  }

  calcStylesByGroup(group: string) {
    const widths = this._columnGroupWidths;
    const offsetX = this.offsetX;

    const styles = {
      width: `${widths[group]}px`
    };

    if (group === 'left') {
      translateXY(styles, offsetX, 0);
    } else if (group === 'right') {
      const bodyWidth = parseInt(this.innerWidth + '', 0);
      const totalDiff = widths.total - bodyWidth;
      const offsetDiff = totalDiff - offsetX;
      const offset = (offsetDiff + this.scrollbarHelper.width) * -1;
      translateXY(styles, offset, 0);
    }

    return styles;
  }

  onActivate(event: any, index: number): void {
    event.cellIndex = index;
    event.rowElement = this._element;
    this.activate.emit(event);
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    const keyCode = event.keyCode;
    const isTargetRow = event.target === this._element;

    const isAction =
      keyCode === Keys.return ||
      keyCode === Keys.down ||
      keyCode === Keys.up ||
      keyCode === Keys.left ||
      keyCode === Keys.right;

    if (isAction && isTargetRow) {
      event.preventDefault();
      event.stopPropagation();

      this.activate.emit({
        type: 'keydown',
        event,
        row: this.row,
        rowElement: this._element
      });
    }
  }

  @HostListener('mouseenter', ['$event'])
  onMouseenter(event: any): void {
    this.activate.emit({
      type: 'mouseenter',
      event,
      row: this.row,
      rowElement: this._element
    });
  }

  recalculateColumns(val: any[] = this.columns): void {
    this._columns = val;
    const colsByPin = columnsByPin(this._columns);
    this._columnsByPin = columnsByPinArr(this._columns);
    this._columnGroupWidths = columnGroupWidths(colsByPin, this._columns);
  }

  onTreeAction() {
    this.treeAction.emit();
  }

  simulateClick() {
    if (this._columns.length > 0 && !this.isSelected) {
      this.activate.emit({
        type: 'click',
        event: null,
        row: this.row,
        group: this.group,
        rowHeight: this.rowHeight,
        column: this._columns[0],
        value: '',
        cellIndex: 0,
        rowElement: this._element,
        cellElement: this._element
      });
    }
  }

  public getExplicitWidth(column: any) {
    if (!column || !this.row) {
      return null;
    }

    if (!this._columnWidthMap) {
      this.calculateColSpans();
    }

    const result = Number(this._columnWidthMap.get(column));
    if (isNaN(result) || !isFinite(result)) {
      return null;
    }
    return result;
  }

  private calculateColSpans() {
    this._columnWidthMap = new WeakMap();
    if (!this.getColSpan || !this.row || !this.columns) {
      return;
    }

    let ignoreCount = 0;
    this.columns.forEach((column, i) => {
      if (ignoreCount > 0) {
        this._columnWidthMap.set(column, 0);
        ignoreCount--;
        return;
      }

      const colSpan = Number(this.getColSpan(this.row, column, this.columns));
      if (colSpan <= 1 || isNaN(colSpan) || !isFinite(colSpan))
      {
        // Do not change Col-Span
        return;
      }

      let newWidth = 0;
      for (let j = i; j < i + colSpan; j++) {
        const col = this.columns[j];
        if (!!col && !!col.width) {
          newWidth += col.width;
        }
      }
      this._columnWidthMap.set(column, newWidth);
      ignoreCount = colSpan - 1;
    });

  }

  private setDataAttributes() {
    if (this.dataAttributesRow && this.row) {
      const pre = 'data-'
      const res = this.dataAttributesRow(this.row);
      if (res.dataAttributes && res.dataAttributes.length > 0) {
        res.dataAttributes.forEach(attribute => {
          const attrName = pre + attribute.key
          this._element.setAttribute(attrName, attribute.value);
        })
      }
    }
  }
}
