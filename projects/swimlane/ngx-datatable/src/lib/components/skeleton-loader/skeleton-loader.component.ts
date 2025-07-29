import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostBinding,
  Input,
  OnDestroy,
  TemplateRef
} from '@angular/core';
import { TableColumn } from '../../types/table-column.type';
import { columnsByPin, columnsByPinArr, columnGroupWidths } from '../../utils/column';
import { translateXY } from '../../utils/translate';

@Component({
    selector: 'skeleton-loader',
    templateUrl: './skeleton-loader.component.html',
    styleUrl: './skeleton-loader.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class SkeletonLoaderComponent implements OnDestroy {
  @Input() template: TemplateRef<any>;
  @Input() rowHeight: number | 'auto' | ((row?: any) => number);
  @Input() numRows = 3;

  @Input() set columns(val: any[]) {
    this._columns = val;
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

  @Input() set innerWidth(val: number) {
    this._innerWidth = val;
    setTimeout(() => {
      this.calculateColumns();
      this.setStylesByGroup();
    });
  }

  get innerWidth(): number {
    return this._innerWidth;
  }
  
  private _rowPadding: number;
  @Input() set rowPadding(val: number) {
    this._rowPadding = val;
    this.calculateColumns();
    this.setStylesByGroup();
  }
  get rowPadding(): number {
    return this._rowPadding;
  }

  _columns: any[];
  _columnsByPin: any;
  _columnGroupWidths: any = {
    total: 100
  };
  _innerWidth: number;
  _styleByGroup: { [prop: string]: {} } = {
    left: {},
    center: {},
    right: {}
  };
  _offsetX: number;
  _classes: { [prop: string]: {} } = {};

  private destroyed = false;

  constructor(private cd: ChangeDetectorRef) {}

  ngOnDestroy(): void {
    this.destroyed = true;
  }

  private calculateColumns() {
    const colsByPin = columnsByPin(this.columns);
    this._columnsByPin = columnsByPinArr(this.columns);
    this._columnGroupWidths = columnGroupWidths(colsByPin, this.columns, this.rowPadding);
    this.setStylesByGroup();
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

    this.setClasses();
  }

  calcStylesByGroup(group: string): any {
    const widths = this._columnGroupWidths;
    const offsetX = this.offsetX;

    const styles = {
      width: `${widths[group]}px`
    };

    if (group === 'left') {
      translateXY(styles, offsetX, 0);
      if (this.rowPadding) {
        styles['padding-left.px'] = this.rowPadding;
      }
    }

    return styles;
  }

  setClasses() {
    this._classes =
      this.columns?.reduce<{}>((acc, cur) => {
        acc[cur.prop] = this.calcClassesForColumn(cur);
        return acc;
      }, {}) ?? {};

    if (!this.destroyed) {
      this.cd.detectChanges();
    }
  }

  calcClassesForColumn(column: TableColumn): string {
    let cls = '';

    if (column.headerClass) {
      if (typeof column.headerClass === 'string') {
        cls += ' ' + column.headerClass;
      } else if (typeof column.headerClass === 'function') {
        const res = column.headerClass({
          column: column
        });

        if (typeof res === 'string') {
          cls += res;
        } else if (typeof res === 'object') {
          const keys = Object.keys(res);
          for (const k of keys) {
            if (res[k] === true) cls += ` ${k}`;
          }
        }
      }
    }

    return cls;
  }

  getRowHeight(): number {
    if (typeof this.rowHeight === 'function') {
      return this.rowHeight();
    }

    return this.rowHeight as number;
  }
}
