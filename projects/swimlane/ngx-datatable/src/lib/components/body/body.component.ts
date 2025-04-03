import {
  Component,
  Output,
  EventEmitter,
  Input,
  HostBinding,
  ChangeDetectorRef,
  ViewChild,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  HostListener,
  TemplateRef,
  ElementRef
} from '@angular/core';
import { ScrollerComponent } from './scroller.component';
import { SelectionType } from '../../types/selection.type';
import { columnsByPin, columnGroupWidths } from '../../utils/column';
import { RowHeightCache } from '../../utils/row-height-cache';
import { translateXY } from '../../utils/translate';
import { RowDragService } from '../../services/row-drag.service';
import { PerfectScrollbarComponent } from 'ngx-om-perfect-scrollbar';
import { Subject, Subscription } from 'rxjs';
import { takeUntil, throttleTime } from 'rxjs/operators';
import { DataTableBodyRowComponent } from './body-row.component';
import { DataTableRowWrapperComponent } from './body-row-wrapper.component';
import { Model } from './selection.component';

@Component({
    selector: 'datatable-body',
    template: `
    <datatable-selection
      #selector
      [selected]="selected"
      [rows]="rows"
      [selectCheck]="selectCheck"
      [selectEnabled]="selectEnabled"
      [selectionType]="selectionType"
      [rowIdentity]="rowIdentity"
      (select)="select.emit($event)"
      (activate)="onActivate($event)"
    >
      <perfect-scrollbar>
        <datatable-progress *ngIf="loadingIndicator && !useSkeletonLoader" [columnGroupWidths]="columnGroupWidths"> </datatable-progress>
        <datatable-scroller
          *ngIf="rows?.length"
          [scrollbarV]="scrollbarV"
          [scrollbarH]="scrollbarH"
          [scrollHeight]="scrollHeight"
          [scrollWidth]="columnGroupWidths?.total"
          (scroll)="onBodyScroll($event)"
        >
          <datatable-summary-row
            *ngIf="summaryRow && summaryPosition === 'top'"
            [rowHeight]="summaryHeight"
            [offsetX]="offsetX"
            [innerWidth]="innerWidth"
            [rows]="rows"
            [columns]="columns"
          >
          </datatable-summary-row>
          <datatable-row-wrapper
            row-draggable
            [dragReference]="dragReference"
            [dragEnabled]="rowsDraggable && !useCustomDragHandling"
            [dragData]="indexes.first + i"
            [groupedRows]="groupedRows"
            [selectOnDrag]="selectRowOnDrag"
            *ngFor="let group of temp; let i = index; trackBy: rowTrackingFn; let last = last"
            [innerWidth]="innerWidth"
            [ngStyle]="getRowsStyles(group, rowWrapper)"
            [rowDetail]="rowDetail"
            [groupHeader]="groupHeader"
            [offsetX]="offsetX"
            [detailRowHeight]="getDetailRowHeight(group && group[i], i)"
            [groupRowHeight]="getRowHeight(group)"
            [row]="group"
            [expanded]="getRowExpanded(group)"
            [rowIndex]="getRowIndex(group && group[i])"
            [groupWidth]="useTotalWidthForGroupHeaders ? innerWidth : columnGroupWidths?.total"
            [endOfDataRowTemplate]="endOfDataRow?.template"
            [groupPadding]="groupPadding"
            (rowContextmenu)="rowContextmenu.emit($event)"
            [resize-observer]="virtualizedFluidRowHeight"
            (heightChanged)="onRowHeightChanged(group, rowWrapper)"
            (activateGroup)="onActivate($event)"
            #rowWrapper
          >
            <div
              *ngIf="dragService.dragActive && rowsDraggable && dragReference === dragService.dragReference"
              row-droppable
              (onDropEvent)="onDrop($event, indexes.first + i)"
              (onDragOverEvent)="onDragOver(indexes.first + i)"
              [ngClass]="'drop-area-top' + (dragService.dragActive ? ' drag-active' : '')"
              dragOverClass="drop-over-active"
            >
              <div class="drop-indicator"></div>
            </div>
            <div
              *ngIf="dragService.dragActive && rowsDraggable && dragReference === dragService.dragReference"
              row-droppable
              (onDropEvent)="onDrop($event, indexes.first + i + 1)"
              (onDragOverEvent)="onDragOver(indexes.first + i)"
              [ngClass]="'drop-area-bottom' + (dragService.dragActive ? ' drag-active' : '')"
              dragOverClass="drop-over-active"
            >
              <div class="drop-indicator bottom" [class.last]="last"></div>
            </div>
            <ng-container *ngIf="!groupedRows; else groupedRowsTemplate">
              <datatable-body-row
                role="row"              
                tabindex="-1"
                [isSelected]="selector.getRowSelected(group)"
                [innerWidth]="innerWidth"
                [offsetX]="offsetX"
                [columns]="columns"
                [rowHeight]="getRowHeight(group)"
                [minRowHeight]="getMinRowHeight(group)"
                [maxRowHeight]="virtualizedFluidRowHeightMax"
                [row]="group"
                [rowIndex]="getRowIndex(group)"
                [expanded]="getRowExpanded(group)"
                [rowClass]="rowClass"
                [dataAttributesRow]="dataAttributesRow"
                [dataAttributesCell]="dataAttributesCell"
                [getColSpan]="colSpan"
                [displayCheck]="displayCheck"
                [rowPadding]="rowPadding"
                [groupPadding]="groupPadding"
                [treeStatus]="group && group.treeStatus"
                (treeAction)="onTreeAction(group)"
                (activate)="selector.onActivate($event, indexes.first + i)"
              >
              </datatable-body-row>            
              <div class="row-spacer" 
                *ngIf="lastRowSpacerHeight && !group.isRowGroup && (last || temp[i + 1]?.isRowGroup)" 
                [style.height.px]="lastRowSpacerHeight" 
                [style.width.px]="innerWidth">
              </div>
            </ng-container>
            <ng-template #groupedRowsTemplate>
              <datatable-body-row
                role="row"
                *ngFor="let row of group.value; let i = index; let last = last; trackBy: rowTrackingFn"
                tabindex="-1"
                [isSelected]="selector.getRowSelected(row)"
                [innerWidth]="innerWidth"
                [offsetX]="offsetX"
                [columns]="columns"
                [rowHeight]="getRowHeight(row)"
                [minRowHeight]="getMinRowHeight(row)"
                [maxRowHeight]="virtualizedFluidRowHeightMax"
                [row]="row"
                [group]="group.value"
                [rowIndex]="getRowIndex(row)"
                [expanded]="getRowExpanded(row)"
                [rowClass]="rowClass"
                [dataAttributesRow]="dataAttributesRow"
                [dataAttributesCell]="dataAttributesCell"
                [getColSpan]="colSpan"
                [rowPadding]="rowPadding"
                [groupPadding]="groupPadding"
                (activate)="selector.onActivate($event, i)"
              >
              </datatable-body-row>
              <div class="row-spacer" 
                *ngIf="lastRowSpacerHeight && last" 
                [style.height.px]="lastRowSpacerHeight" 
                [style.width.px]="innerWidth">
              </div>
            </ng-template>
          </datatable-row-wrapper>
          <datatable-summary-row
            role="row"
            *ngIf="summaryRow && summaryPosition === 'bottom'"
            [ngStyle]="getBottomSummaryRowStyles()"
            [rowHeight]="summaryHeight"
            [offsetX]="offsetX"
            [innerWidth]="innerWidth"
            [rows]="rows"
            [columns]="columns"
          >
          </datatable-summary-row>
          <div
            *ngIf="endOfDataRow && endOfDataRow.template && endOfDataRow.isShown"
            [ngStyle]="getEndOfDataRowStyles()"
          >
            <ng-container [ngTemplateOutlet]="endOfDataRow.template"></ng-container>
          </div>
        </datatable-scroller>
      </perfect-scrollbar>
      <div class="empty-row" *ngIf="!rows?.length && !loadingIndicator" [innerHTML]="emptyMessage"></div>
    </datatable-selection>
  `,
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        class: 'datatable-body'
    },
    standalone: false
})
export class DataTableBodyComponent implements OnInit, OnDestroy {
  @Input() scrollbarV: boolean;
  @Input() scrollbarH: boolean;
  @Input() loadingIndicator: boolean;
  @Input() externalPaging: boolean;
  @Input() rowHeight: number | 'auto' | ((row?: any) => number);
  @Input() virtualizedFluidRowHeightMin: number | 'auto' | ((row?: any) => number);
  @Input() virtualizedFluidRowHeightMax: number = undefined;
  @Input() offsetX: number;
  @Input() emptyMessage: string;
  @Input() selectionType: SelectionType;
  @Input() selected: any[] = [];
  @Input() rowIdentity: any;
  @Input() rowDetail: any;
  @Input() groupHeader: any;
  @Input() selectCheck: any;
  @Input() displayCheck: any;
  @Input() trackByProp: string;
  @Input() rowClass: any;
  @Input() groupedRows: any;
  @Input() groupExpansionDefault: boolean;
  @Input() innerWidth: number;
  @Input() groupRowsBy: string;
  @Input() virtualization: boolean;
  @Input() summaryRow: boolean;
  @Input() summaryPosition: string;
  @Input() summaryHeight: number;
  @Input() rowsDraggable: boolean;
  @Input() useCustomDragHandling: boolean;
  @Input() selectRowOnDrag: boolean;
  @Input() dataAttributesRow: any;
  @Input() dataAttributesCell: any;
  @Input() colSpan: (row: any, column: any, columns: any[]) => number;
  @Input() virtualizedFluidRowHeight: boolean;
  @Input() forceDetailOpen = false;

  private _rowPadding: number;
  @Input() set rowPadding(val: number) {
    this._rowPadding = val;
    this.calculateColumns();
  }
  get rowPadding(): number {
    return this._rowPadding;
  }

  @Input() groupPadding: number;
  @Input() lastRowSpacerHeight: number;

  @Input() set pageSize(val: number) {
    this._pageSize = val;
    this.recalcLayout();
  }

  get pageSize(): number {
    return this._pageSize;
  }

  @Input() set rows(val: any[]) {
    this._rows = val;
    this.recalcLayout();

    // scroll to previous x-offset
    if (val.length && (this.previousOffsetX || this.scrollToLeftRequested)) {
      this.scrollerSetSubscription?.unsubscribe();
      this.scrollerSetSubscription = this.scrollerSet.pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => {
        this.scroller.scrollXPos = this.previousOffsetX;
        this.perfectScrollbar?.directiveRef?.scrollToX(this.previousOffsetX);
        this.scrollToLeftRequested = false;
      });
    }
  }

  get rows(): any[] {
    return this._rows;
  }

  @Input() set columns(val: any[]) {
    this._columns = val;
    this.calculateColumns();
  }

  get columns(): any[] {
    return this._columns;
  }

  @Input() set offset(val: number) {
    this._offset = val;
    if (!this.scrollbarV || (this.scrollbarV && !this.virtualization)) this.recalcLayout();
  }

  get offset(): number {
    return this._offset;
  }

  @Input() set rowCount(val: number) {
    this._rowCount = val;
    this.recalcLayout();
  }

  get rowCount(): number {
    return this._rowCount;
  }

  @HostBinding('style.width')
  get bodyWidth(): string {
    if (this.scrollbarH) {
      return this.innerWidth + 'px';
    } else {
      return '100%';
    }
  }

  @Input()
  @HostBinding('style.height')
  set bodyHeight(val) {
    if (this.scrollbarV) {
      this._bodyHeight = val + 'px';
    } else {
      this._bodyHeight = 'auto';
    }

    this.recalcLayout();
  }

  get bodyHeight() {
    return this._bodyHeight;
  }

  @Input() endOfDataRow: { template: TemplateRef<any>; isShown: boolean };
  @Input() useTotalWidthForGroupHeaders = false;  
  @Input() useSkeletonLoader = false;

  @Output() scroll: EventEmitter<any> = new EventEmitter();
  @Output() page: EventEmitter<any> = new EventEmitter();
  @Output() activate: EventEmitter<any> = new EventEmitter();
  @Output() select: EventEmitter<any> = new EventEmitter();
  @Output() detailToggle: EventEmitter<any> = new EventEmitter();
  @Output() rowDropped: EventEmitter<any> = new EventEmitter();
  @Output() rowContextmenu = new EventEmitter<{ event: MouseEvent; row: any }>(false);
  @Output() treeAction: EventEmitter<any> = new EventEmitter();
  @Output() rowSizeChanged: EventEmitter<{ row: any; newHeight: number; detailHeight: number }> = new EventEmitter();

  private scrollerSet = new Subject<void>();
  scrollerSet$ = this.scrollerSet.asObservable();
  private scrollOnDrag = new Subject<number>();
  private previousOffsetX: number;
  private scrollerSetSubscription: Subscription;
  private ngUnsubscribe = new Subject<void>();

  private _scroller: ScrollerComponent;
  @ViewChild(ScrollerComponent) set scroller(scroller: ScrollerComponent) {
    this._scroller = scroller;
    if (scroller) {
      this.scrollerSet.next();
    }
  }
  get scroller(): ScrollerComponent {
    return this._scroller;
  }

  @ViewChild(PerfectScrollbarComponent) perfectScrollbar: PerfectScrollbarComponent;
  @ViewChild(PerfectScrollbarComponent, { read: ElementRef }) perfectScrollbarElement: ElementRef;

  /**
   * Returns if selection is enabled.
   */
  get selectEnabled(): boolean {
    return !!this.selectionType;
  }

  /**
   * Property that would calculate the height of scroll bar
   * based on the row heights cache for virtual scroll and virtualization. Other scenarios
   * calculate scroll height automatically (as height will be undefined).
   */
  get scrollHeight(): number | undefined {
    if (this.scrollbarV && this.virtualization && this.rowCount) {
      return this.rowHeightsCache.query(this.rowCount - 1);
    }
    // avoid TS7030: Not all code paths return a value.
    return undefined;
  }

  dragReference = this;
  rowHeightsCache: RowHeightCache = new RowHeightCache();
  temp: any[] = [];
  offsetY = 0;
  indexes: any = {};
  columnGroupWidths: any;
  columnGroupWidthsWithoutGroup: any;
  rowTrackingFn: any;
  listener: any;
  rowIndexes: any = new WeakMap<any, string>();
  rowExpansions: any[] = [];
  scrollToLeftRequested = false;

  _rows: any[];
  _bodyHeight: any;
  _columns: any[];
  _rowCount: number;
  _offset: number;
  _pageSize: number;

  private preventFocusOut = false;

  /**
   * Creates an instance of DataTableBodyComponent.
   */
  constructor(private cd: ChangeDetectorRef, public dragService: RowDragService) {
    // declare fn here so we can get access to the `this` property
    this.rowTrackingFn = (index: number, row: any): any => {
      const idx = this.getRowIndex(row);
      if (this.trackByProp) {
        return row[this.trackByProp];
      } else {
        return idx;
      }
    };
  }

  /**
   * Called after the constructor, initializing input properties
   */
  ngOnInit(): void {
    if (this.rowDetail) {
      this.listener = this.rowDetail.toggle.subscribe(({ type, value }: { type: string; value: any }) => {
        if (type === 'row') {
          this.toggleRowExpansion(value);
        }
        if (type === 'all') {
          this.toggleAllRows(value);
        }

        // Refresh rows after toggle
        // Fixes #883
        this.updateIndexes();
        this.updateRows();
        this.cd.markForCheck();
      });
    }

    if (this.groupHeader) {
      this.listener = this.groupHeader.toggle.subscribe(({ type, value }: { type: string; value: any }) => {
        if (type === 'group') {
          this.toggleRowExpansion(value);
        }
        if (type === 'all') {
          this.toggleAllRows(value);
        }

        // Refresh rows after toggle
        // Fixes #883
        this.updateIndexes();
        this.updateRows();
        this.cd.markForCheck();
      });
    }

    this.scrollOnDrag.pipe(takeUntil(this.ngUnsubscribe), throttleTime(500)).subscribe(offsetY => {
      this.perfectScrollbar?.directiveRef?.scrollToY(offsetY);
    });
  }

  /**
   * Called once, before the instance is destroyed.
   */
  ngOnDestroy(): void {
    if (this.rowDetail || this.groupHeader) {
      this.listener.unsubscribe();
    }

    this.scrollerSet.complete();
    this.scrollOnDrag.complete();
    this.scrollerSetSubscription?.unsubscribe();
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  private calculateColumns() {
    const colsByPin = columnsByPin(this.columns);
    this.columnGroupWidths = columnGroupWidths(colsByPin, this.columns, this.rowPadding);
    this.perfectScrollbar?.directiveRef?.update();
  }

  /**
   * Updates the Y offset given a new offset.
   */
  updateOffsetY(offset?: number): void {
    // scroller is missing on empty table
    if (!this.scroller) {
      return;
    }

    if (this.scrollbarV && this.virtualization && offset) {
      // First get the row Index that we need to move to.
      const rowIndex = this.pageSize * offset;
      offset = this.rowHeightsCache.query(rowIndex - 1);
    } else if (this.scrollbarV && !this.virtualization) {
      offset = 0;
    }

    this.scroller.setOffset(offset || 0);
  }

  /**
   * Body was scrolled, this is mainly useful for
   * when a user is server-side pagination via virtual scroll.
   */
  onBodyScroll(event: any): void {
    const scrollYPos: number = event.scrollYPos;
    const scrollXPos: number = event.scrollXPos;

    // if scroll change, trigger update
    // this is mainly used for header cell positions
    if (this.offsetY !== scrollYPos || this.offsetX !== scrollXPos) {
      setTimeout(() =>
        this.scroll.emit({
          offsetY: scrollYPos,
          offsetX: scrollXPos
        })
      );
    }

    this.offsetY = scrollYPos;
    this.offsetX = scrollXPos;

    if (this.rows?.length && scrollXPos >= 0) {
      this.previousOffsetX = scrollXPos;
    }

    if (this.scrollToLeftRequested) {
      this.previousOffsetX = 0;
    }

    this.updateIndexes();
    this.updatePage(event.direction);
    this.updateRows();
  }

  /**
   * Updates the page given a direction.
   */
  updatePage(direction: string): void {
    let offset = this.indexes.first / this.pageSize;

    if (direction === 'up') {
      offset = Math.ceil(offset);
    } else if (direction === 'down') {
      offset = Math.floor(offset);
    }

    if (direction !== undefined && !isNaN(offset)) {
      this.page.emit({ offset });
    }
  }

  /**
   * Updates the rows in the view port
   */
  updateRows(): void {
    this.preventFocusOut = true;
    const { first, last } = this.indexes;
    let rowIndex = first;
    let idx = 0;
    const temp: any[] = [];

    // if grouprowsby has been specified treat row paging
    // parameters as group paging parameters ie if limit 10 has been
    // specified treat it as 10 groups rather than 10 rows
    if (this.groupedRows) {
      let maxRowsPerGroup = 3;
      // if there is only one group set the maximum number of
      // rows per group the same as the total number of rows
      if (this.groupedRows.length === 1) {
        maxRowsPerGroup = this.groupedRows[0].value.length;
      }

      while (rowIndex < last && rowIndex < this.groupedRows.length) {
        // Add the groups into this page
        const group = this.groupedRows[rowIndex];
        this.rowIndexes.set(group, rowIndex);

        if (group.value) {
          // add indexes for each group item
          group.value.forEach((g: any, i: number) => {
            const _idx = `${rowIndex}-${i}`;
            this.rowIndexes.set(g, _idx);
          });
        }
        temp[idx] = group;
        idx++;

        // Group index in this context
        rowIndex++;
      }
    } else {
      while (rowIndex < last && rowIndex < this.rowCount) {
        const row = this.rows[rowIndex];

        if (row) {
          // add indexes for each row
          this.rowIndexes.set(row, rowIndex);
          temp[idx] = row;
        }

        idx++;
        rowIndex++;
      }
    }

    this.temp = temp;
    setTimeout(() => (this.preventFocusOut = false));
  }

  /**
   * Get the row height
   */
  getRowHeight(row: any): number {
    if (this.virtualizedFluidRowHeight) {
      return undefined;
    }

    // if its a function return it
    if (typeof this.rowHeight === 'function') {
      return this.rowHeight(row);
    }

    return this.rowHeight as number;
  }

  getMinRowHeight(row: any): number {
    if (!this.virtualizedFluidRowHeight) {
      return undefined;
    }

    // if its a function return it
    if (typeof this.virtualizedFluidRowHeightMin === 'function') {
      return this.virtualizedFluidRowHeightMin(row);
    }

    return this.virtualizedFluidRowHeightMin as number;
  }

  onRowHeightChanged(rows: any, rowWrapper: DataTableRowWrapperComponent) {
    if (this.scrollbarV && this.virtualization && this.virtualizedFluidRowHeight) {
      let idx = 0;

      if (this.groupedRows) {
        // Get the latest row rowindex in a group
        const row = rows[rows.length - 1];
        idx = row ? this.getRowIndex(row) : 0;
      } else {
        idx = this.getRowIndex(rows);
      }
      let newRowHeight = rowWrapper?.getActualRowHeight() ?? 0;
      const newDetailHeight = !this.rowDetail ? 0 : rowWrapper?.getActualRowDetailHeight() ?? 0;
      const groupPadding = rowWrapper?.row?.isRowGroup ? this.groupPadding : 0;
      newRowHeight += groupPadding;
      if (newRowHeight !== 0) {
        if (this.rowHeightsCache.set(idx, newRowHeight + newDetailHeight)) {
          this.rowSizeChanged.emit({ row: rows, newHeight: newRowHeight, detailHeight: newDetailHeight });
        }
      }
    }
  }

  /**
   * @param group the group with all rows
   */
  getGroupHeight(group: any): number {
    let rowHeight = 0;

    if (group.value) {
      for (let index = 0; index < group.value.length; index++) {
        rowHeight += this.getRowAndDetailHeight(group.value[index]);
      }
    }

    return rowHeight;
  }

  /**
   * Calculate row height based on the expanded state of the row.
   */
  getRowAndDetailHeight(row: any): number {
    let rowHeight = this.getRowHeight(row);
    const expanded = this.getRowExpanded(row);

    // Adding detail row height if its expanded.
    if (expanded) {
      rowHeight += this.getDetailRowHeight(row);
    }

    return rowHeight;
  }

  /**
   * Get the height of the detail row.
   */
  getDetailRowHeight = (row?: any, index?: any): number => {
    if (!this.rowDetail || row?.isRowGroup) {
      return 0;
    }
    const rowHeight = this.rowDetail.rowHeight;
    return typeof rowHeight === 'function' ? rowHeight(row, index) : (rowHeight as number);
  };

  /**
   * Calculates the styles for the row so that the rows can be moved in 2D space
   * during virtual scroll inside the DOM.   In the below case the Y position is
   * manipulated.   As an example, if the height of row 0 is 30 px and row 1 is
   * 100 px then following styles are generated:
   *
   * transform: translate3d(0px, 0px, 0px);    ->  row0
   * transform: translate3d(0px, 30px, 0px);   ->  row1
   * transform: translate3d(0px, 130px, 0px);  ->  row2
   *
   * Row heights have to be calculated based on the row heights cache as we wont
   * be able to determine which row is of what height before hand.  In the above
   * case the positionY of the translate3d for row2 would be the sum of all the
   * heights of the rows before it (i.e. row0 and row1).
   *
   * @param rows the row that needs to be placed in the 2D space.
   * @returns the CSS3 style to be applied
   *
   * @memberOf DataTableBodyComponent
   */
  getRowsStyles(rows: any, rowInstance: DataTableRowWrapperComponent): any {
    const styles: any = {};

    // only add styles for the group if there is a group
    if (this.groupedRows) {
      styles.width = this.columnGroupWidths.total;
    }

    if (this.scrollbarV && this.virtualization) {
      let idx = 0;

      if (this.groupedRows) {
        // Get the latest row rowindex in a group
        const row = rows[rows.length - 1];
        idx = row ? this.getRowIndex(row) : 0;
      } else {
        idx = this.getRowIndex(rows);
      }

      // Make sure the correct height is set
      this.onRowHeightChanged(rows, rowInstance);

      // const pos = idx * rowHeight;
      // The position of this row would be the sum of all row heights
      // until the previous row position.
      const pos = this.rowHeightsCache.query(idx - 1);

      translateXY(styles, 0, pos);
    }

    return styles;
  }

  /**
   * Calculate bottom summary row offset for scrollbar mode.
   * For more information about cache and offset calculation
   * see description for `getRowsStyles` method
   *
   * @returns the CSS3 style to be applied
   *
   * @memberOf DataTableBodyComponent
   */
  getBottomSummaryRowStyles(): any {
    if (!this.scrollbarV || !this.rows || !this.rows.length) {
      return null;
    }

    const styles = { position: 'absolute' };
    const pos = this.rowHeightsCache.query(this.rows.length - 1);

    translateXY(styles, 0, pos);

    return styles;
  }

  getEndOfDataRowStyles(): any {
    if (!this.scrollbarV || !this.rows || !this.rows.length) {
      return null;
    }

    const styles = {
      position: 'absolute',
      display: 'flex',
      width: `${this.perfectScrollbarElement.nativeElement.offsetWidth}px`
    };
    const pos = this.rowHeightsCache.query(this.rows.length - 1);

    translateXY(styles, 0, pos);

    return styles;
  }

  /**
   * Hides the loading indicator
   */
  hideIndicator(): void {
    setTimeout(() => (this.loadingIndicator = false), 500);
  }

  /**
   * Updates the index of the rows in the viewport
   */
  updateIndexes(): void {
    let first = 0;
    let last = 0;

    if (this.scrollbarV) {
      if (this.virtualization) {
        // Calculation of the first and last indexes will be based on where the
        // scrollY position would be at.  The last index would be the one
        // that shows up inside the view port the last.
        const height = parseInt(this.bodyHeight, 0);
        first = this.rowHeightsCache.getRowIndex(this.offsetY);
        last = this.rowHeightsCache.getRowIndex(height + this.offsetY) + 1;
      } else {
        // If virtual rows are not needed
        // We render all in one go
        first = 0;
        last = this.rowCount;
      }
    } else {
      // The server is handling paging and will pass an array that begins with the
      // element at a specified offset.  first should always be 0 with external paging.
      if (!this.externalPaging) {
        first = Math.max(this.offset * this.pageSize, 0);
      }
      last = Math.min(first + this.pageSize, this.rowCount);
    }

    this.indexes = { first, last };
  }

  /**
   * Refreshes the full Row Height cache.  Should be used
   * when the entire row array state has changed.
   */
  refreshRowHeightCache(): void {
    if (!this.scrollbarV || (this.scrollbarV && !this.virtualization)) {
      return;
    }

    // clear the previous row height cache if already present.
    // this is useful during sorts, filters where the state of the
    // rows array is changed.
    this.rowHeightsCache.clearCache();

    // Initialize the tree only if there are rows inside the tree.
    if (this.rows && this.rows.length) {
      const rowExpansions = new Set();
      for (const row of this.rows) {
        if (this.getRowExpanded(row)) {
          rowExpansions.add(row);
        }
      }

      this.rowHeightsCache.initCache({
        rows: this.rows,
        rowHeight: this.rowHeight,
        detailRowHeight: this.getDetailRowHeight,
        externalVirtual: this.scrollbarV && this.externalPaging,
        rowCount: this.rowCount,
        rowIndexes: this.rowIndexes,
        rowExpansions,
        groupPadding: this.groupPadding,
        lastRowSpacerHeight: this.lastRowSpacerHeight
      });
    }
  }

  /**
   * Gets the index for the view port
   */
  getAdjustedViewPortIndex(): number {
    // Capture the row index of the first row that is visible on the viewport.
    // If the scroll bar is just below the row which is highlighted then make that as the
    // first index.
    const viewPortFirstRowIndex = this.indexes.first;

    if (this.scrollbarV && this.virtualization) {
      const offsetScroll = this.rowHeightsCache.query(viewPortFirstRowIndex - 1);
      return offsetScroll <= this.offsetY ? viewPortFirstRowIndex - 1 : viewPortFirstRowIndex;
    }

    return viewPortFirstRowIndex;
  }

  /**
   * Toggle the Expansion of the row i.e. if the row is expanded then it will
   * collapse and vice versa.   Note that the expanded status is stored as
   * a part of the row object itself as we have to preserve the expanded row
   * status in case of sorting and filtering of the row set.
   */
  toggleRowExpansion(row: any): void {
    // Capture the row index of the first row that is visible on the viewport.
    const viewPortFirstRowIndex = this.getAdjustedViewPortIndex();
    const rowExpandedIdx = this.getRowExpandedIdx(row, this.rowExpansions);
    const expanded = rowExpandedIdx > -1;

    // If the detailRowHeight is auto --> only in case of non-virtualized scroll
    if (this.scrollbarV && this.virtualization) {
      const detailRowHeight = this.getDetailRowHeight(row) * (expanded ? -1 : 1);
      // const idx = this.rowIndexes.get(row) || 0;
      const idx = this.getRowIndex(row);
      this.rowHeightsCache.update(idx, detailRowHeight);
    }

    // Update the toggled row and update thive nevere heights in the cache.
    if (expanded) {
      this.rowExpansions.splice(rowExpandedIdx, 1);
    } else {
      this.rowExpansions.push(row);
    }

    this.detailToggle.emit({
      rows: [row],
      currentIndex: viewPortFirstRowIndex
    });
  }

  /**
   * Expand/Collapse all the rows no matter what their state is.
   */
  toggleAllRows(expanded: boolean): void {
    // clear prev expansions
    this.rowExpansions = [];

    // Capture the row index of the first row that is visible on the viewport.
    const viewPortFirstRowIndex = this.getAdjustedViewPortIndex();

    if (expanded) {
      for (const row of this.rows) {
        this.rowExpansions.push(row);
      }
    }

    if (this.scrollbarV) {
      // Refresh the full row heights cache since every row was affected.
      this.recalcLayout();
    }

    // Emit all rows that have been expanded.
    this.detailToggle.emit({
      rows: this.rows,
      currentIndex: viewPortFirstRowIndex
    });
  }

  toggleRows(rowExpansions: { row: any, expanded: boolean}[]) {
    rowExpansions.forEach(expansion => {
      if (expansion.expanded) {
        this.rowExpansions.push(expansion.row);
      } else {
        const rowExpandedIdx = this.getRowExpandedIdx(expansion.row, this.rowExpansions);
        if (rowExpandedIdx > -1) {
          this.rowExpansions.splice(rowExpandedIdx, 1);
        }
      }
    });

    if (this.scrollbarV) {
      this.recalcLayout();
    }
  }

  /**
   * Recalculates the table
   */
  recalcLayout(): void {
    this.refreshRowHeightCache();
    this.updateIndexes();
    this.updateRows();
  }

  /**
   * Tracks the column
   */
  columnTrackingFn(index: number, column: any): any {
    return column.$$id;
  }

  /**
   * Gets the row pinning group styles
   */
  stylesByGroup(group: string) {
    const widths = this.columnGroupWidths;
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
      const offset = offsetDiff * -1;
      translateXY(styles, offset, 0);
    }

    return styles;
  }

  /**
   * Returns if the row was expanded and set default row expansion when row expansion is empty
   */
  getRowExpanded(row: any): boolean {
    if (this.forceDetailOpen) {
      return true;
    }

    if (this.rowExpansions.length === 0 && this.groupExpansionDefault) {
      for (const group of this.groupedRows) {
        this.rowExpansions.push(group);
      }
    }

    return this.getRowExpandedIdx(row, this.rowExpansions) > -1;
  }

  getRowExpandedIdx(row: any, expanded: any[]): number {
    if (!expanded || !expanded.length) return -1;

    const rowId = this.rowIdentity(row);
    return expanded.findIndex(r => {
      const id = this.rowIdentity(r);
      return id === rowId;
    });
  }

  /**
   * Gets the row index given a row
   */
  getRowIndex(row: any): number {
    return this.rowIndexes.get(row) || 0;
  }

  onTreeAction(row: any) {
    this.treeAction.emit({ row });
  }

  /** custom salesware */
  @HostListener('dragend', ['$event'])
  onDragEnd(event) {
    this.dragService.endDrag(event);
  }

  // Event when user dropped a row on a specific index
  // For movement logic see demo page (row-drag-drop.component)
  onDrop(startIndex: number, destIndex: number) {
    this.rowDropped.emit({
      startindex: startIndex,
      destindex: destIndex
    });
  }

  onDragOver(rowIndex: number) {
    if (rowIndex <= this.indexes.first) {
      const id = rowIndex - 1;
      const prevRow = this.rows[id];
      if (prevRow) {
        this.scrollOnDrag.next(this.rowHeightsCache.query(id - 1));
      }
    } else if (rowIndex >= this.indexes.last - 2) {
      const id = rowIndex + 1;
      const nextRow = this.rows[id];
      if (nextRow) {
        this.scrollOnDrag.next(this.rowHeightsCache.query(this.indexes.first));
      }
    }
  }

  @HostListener('focusout', ['$event'])
  onHostFocusout(event: Event) {
    if (this.preventFocusOut) {
      event.stopPropagation();
    }
  }

  onActivate(event: Model) {
    this.activate.emit(event);
  }
}
