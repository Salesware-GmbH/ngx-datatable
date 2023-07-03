import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostListener,
  DoCheck,
  ChangeDetectionStrategy,
  KeyValueDiffer,
  ChangeDetectorRef,
  KeyValueDiffers,
  ElementRef,
  ViewChild,
  ContentChild
} from '@angular/core';
import { DataTableBodyRowComponent } from './body-row.component';

@Component({
  selector: 'datatable-row-wrapper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div *ngIf="row?.isRowGroup && groupHeader?.template" class="datatable-group-header" [ngStyle]="getGroupHeaderStyle()">
      <ng-template
        *ngIf="groupHeader && groupHeader.template"
        [ngTemplateOutlet]="groupHeader.template"
        [ngTemplateOutletContext]="groupContext"
      >
      </ng-template>
    </div>
    <ng-content *ngIf="!row?.isRowGroup">
    </ng-content>
    <div
      *ngIf="rowDetail && rowDetail.template && expanded"
      [style.height.px]="detailRowHeight"
      class="datatable-row-detail"
    >
      <ng-template
        *ngIf="rowDetail && rowDetail.template"
        [ngTemplateOutlet]="rowDetail.template"
        [ngTemplateOutletContext]="rowContext"
      >
      </ng-template>
    </div>
  `,
  host: {
    class: 'datatable-row-wrapper'
  }
})
export class DataTableRowWrapperComponent implements DoCheck {
  @Input() innerWidth: number;
  @Input() rowDetail: any;
  @Input() groupHeader: any;
  @Input() offsetX: number;
  @Input() detailRowHeight: any;
  @Input() groupRowHeight: any;
  @Input() row: any;
  @Input() groupedRows: any;
  @Input() groupWidth: number;

  @Output() rowContextmenu = new EventEmitter<{ event: MouseEvent; row: any }>(false);

  @Input() set rowIndex(val: number) {
    this._rowIndex = val;
    this.rowContext.rowIndex = val;
    this.groupContext.rowIndex = val;
    this.cd.markForCheck();
  }

  get rowIndex(): number {
    return this._rowIndex;
  }

  @Input() set expanded(val: boolean) {
    this._expanded = val;
    this.groupContext.expanded = val;
    this.rowContext.expanded = val;
    this.cd.markForCheck();
  }

  get expanded(): boolean {
    return this._expanded;
  }

  groupContext: any;
  rowContext: any;

  private rowDiffer: KeyValueDiffer<{}, {}>;
  private _expanded: boolean = false;
  private _rowIndex: number;

  constructor(private cd: ChangeDetectorRef, private differs: KeyValueDiffers, private elementRef: ElementRef) {
    this.groupContext = {
      group: this.row,
      expanded: this.expanded,
      rowIndex: this.rowIndex
    };

    this.rowContext = {
      row: this.row,
      expanded: this.expanded,
      rowIndex: this.rowIndex
    };

    this.rowDiffer = differs.find({}).create();
  }

  ngDoCheck(): void {
    if (this.rowDiffer.diff(this.row)) {
      this.rowContext.row = this.row;
      this.groupContext.group = this.row;
      this.cd.markForCheck();
    }
  }

  @HostListener('contextmenu', ['$event'])
  onContextmenu($event: MouseEvent): void {
    this.rowContextmenu.emit({ event: $event, row: this.row });
  }

  getGroupHeaderStyle(): any {
    const styles = {};

    styles['transform'] = 'translate3d(' + this.offsetX + 'px, 0px, 0px)';
    styles['backface-visibility'] = 'hidden';
    styles['width.px'] = this.groupWidth;
    styles['height.px'] = this.groupRowHeight;

    return styles;
  }

  public getActualRowHeight(): number {
    const element = <HTMLElement>(<HTMLElement>this.elementRef?.nativeElement)?.querySelector('datatable-body-row');
    return this.getHeight(element);
  }

  public getActualRowDetailHeight(): number {
    const element = <HTMLElement>(<HTMLElement>this.elementRef?.nativeElement)?.querySelector('.datatable-row-detail');
    return this.getHeight(element);
  }

  private getHeight(element: HTMLElement): number {
    if (!!element) {
      const oldHeight = element.style.height;
      element.style.height = 'auto';
      const bounds = element.getBoundingClientRect();
      element.style.height = oldHeight;
      return bounds.height;
    }

    return 0;
  }
}
