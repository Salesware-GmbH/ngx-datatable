import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostBinding, Input, OnDestroy } from '@angular/core';
import { columnGroupWidths, columnsByPin, columnsByPinArr } from '../../utils/column';
import { translateXY } from '../../utils/translate';

@Component({
    selector: 'sticky-summary-row',
    templateUrl: './sticky-summary-row.component.html',
    host: {
        class: 'datatable-sticky-summary-row'
    },
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class StickySummaryRowComponent implements OnDestroy {
  @Input() set columns(val: any[]) {
    this._columns = val;

    this._columnsByPin = columnsByPinArr(val);
    
    setTimeout(() => {
      this.calculateColumns();
      this.setStylesByGroup();
    });
  }

  get columns(): any[] {
    return this._columns;
  }

  @Input()
  set offsetX(val: number) {
    this._offsetX = val;
    this.setStylesByGroup();
  }
  get offsetX() {
    return this._offsetX;
  }

  @Input() row: any;

  @HostBinding('style.height')
  @Input()
  set height(val: any) {
    if (val !== 'auto') {
      this._height = `${val}px`;
    } else {
      this._height = val;
    }
  }

  get height(): any {
    return this._height;
  }

  @Input() set innerWidth(val: number) {
    this._innerWidth = val;
    setTimeout(() => {
      this.calculateColumns();
      this.setStylesByGroup();
    });
  }

  private _rowPadding: number;
  @Input() set rowPadding(val: number) {
    this._rowPadding = val;
    this.calculateColumns();
    this.setStylesByGroup();
    this.calculateStyles();
  }
  get rowPadding(): number {
    return this._rowPadding;
  }


  get innerWidth(): number {
    return this._innerWidth;
  }

  _columns: any[];
  _columnsByPin: any;
  _columnGroupWidths: any = {
    total: 100
  };
  _height: string;
  _innerWidth: number;
  _styleByGroup: { [prop: string]: {} } = {
    left: {},
    center: {},
    right: {}
  };
  _offsetX: number;

  styles = {};

  private destroyed = false;

  constructor(private cd: ChangeDetectorRef) {}

  ngOnDestroy(): void {
    this.destroyed = true;
  }

  private calculateColumns() {
    if (this._columns) {
      const colByPin = columnsByPin(this._columns);
      this._columnGroupWidths = columnGroupWidths(colByPin, this._columns, this.rowPadding);
      this.calculateStyles();
    }
  }

  private calculateStyles() {
    this.styles = {
      width: `${this._columnGroupWidths.total - 2 * this.rowPadding}px`
    };
  }

  trackByGroups(index: number, colGroup: any): any {
    return colGroup.type;
  }

  columnTrackingFn(index: number, column: any): any {
    return column.$$id;
  }

  setStylesByGroup() {
    this._styleByGroup.left = this.calcStylesByGroup('left');
    this._styleByGroup.center = this.calcStylesByGroup('center');
    this._styleByGroup.right = this.calcStylesByGroup('right');
    if (!this.destroyed) {
      this.cd.detectChanges();
    }
  }

  calcStylesByGroup(group: string): any {
    const widths = this._columnGroupWidths;
    const offsetX = this.offsetX;

    const styles = {
      width: `${widths[group]}px`
    };

    if (group === 'left' && this.rowPadding) {
      styles['padding-left.px'] = this.rowPadding;      
    } else if (group === 'center') {
      translateXY(styles, offsetX * -1, 0);
    } else if (group === 'right') {
      const totalDiff = widths.total - this.innerWidth;
      const offset = totalDiff * -1;
      translateXY(styles, offset, 0);
    }

    return styles;
  }
}
