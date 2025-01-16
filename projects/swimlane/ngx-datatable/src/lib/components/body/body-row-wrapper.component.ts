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
  OnDestroy,
  TemplateRef
} from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'datatable-row-wrapper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (row?.isRowGroup && groupHeader?.template) {
      <div class="datatable-body-row-group-header" [ngStyle]="getGroupHeaderStyle()" (click)="onGroupClick($event)">
        <ng-template
          [ngTemplateOutlet]="groupHeader.template"
          [ngTemplateOutletContext]="groupContext"
        >
        </ng-template>
      </div>
    }
    @else {
      @if (endOfDataRowTemplate && row?.format?.isEndOfDataRow) {
        <div
          class="datatable-body-row-group-header-end-of-data"
          [style.width.px]="groupWidth"
          [style.height.px]="groupRowHeight"
        >
          <ng-container [ngTemplateOutlet]="endOfDataRowTemplate"></ng-container>
        </div>
      }
      @else {
        <ng-content></ng-content>
      }
    }
    <div
      *ngIf="rowDetail && rowDetail.template && expanded && !row?.isRowGroup"
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
export class DataTableRowWrapperComponent implements OnDestroy, DoCheck {
  @Input() innerWidth: number;
  @Input() rowDetail: any;
  @Input() groupHeader: any;
  @Input() detailRowHeight: any;
  @Input() groupRowHeight: any;
  @Input() row: any;
  @Input() groupedRows: any;
  @Input() groupWidth: number;
  @Input() endOfDataRowTemplate: TemplateRef<any>;

  @Output() rowContextmenu = new EventEmitter<{ event: MouseEvent; row: any }>(false);
  @Output() activateGroup = new EventEmitter<any>();

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
    this.expandedSubject.next(val);
    this.cd.markForCheck();
  }

  get expanded(): boolean {
    return this._expanded;
  }

  private _offsetX: number;
  @Input()
  public get offsetX(): number {
    return this._offsetX;
  }
  public set offsetX(value: number) {
    this._offsetX = value;
    this.groupContext.offsetX = value;
  }

  groupContext: any;
  rowContext: any;

  private rowDiffer: KeyValueDiffer<{}, {}>;
  private _expanded: boolean = false;
  private _rowIndex: number;
  private expandedSubject = new BehaviorSubject(this._expanded);

  constructor(private cd: ChangeDetectorRef, private differs: KeyValueDiffers, private elementRef: ElementRef) {
    this.groupContext = {
      group: this.row,
      expanded: this.expanded,
      expanded$: this.expandedSubject.asObservable(),
      rowIndex: this.rowIndex,
      offsetX: this.offsetX
    };

    this.rowContext = {
      row: this.row,
      expanded: this.expanded,
      expanded$: this.expandedSubject.asObservable(),
      rowIndex: this.rowIndex
    };

    this.rowDiffer = differs.find({}).create();
  }

  ngOnDestroy(): void {
    this.expandedSubject.complete();
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

  onGroupClick(event: MouseEvent) {
    this.activateGroup.emit({
      type: 'click',
      event,
      row: this.row,
      expanded: this.expanded
    });
  }
}
