import { AfterViewInit, Component, ContentChild, NgZone, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ColumnMode, TableColumn } from 'projects/swimlane/ngx-datatable/src/public-api';

@Component({
    selector: 'virtual-auto-demo',
    template: `
    <div>
      <h3>
        Virtual Fluid Row Heights
      </h3>
      <ngx-datatable
        class="material"
        [rows]="rows"
        [loadingIndicator]="loadingIndicator"
        [columns]="columns"
        [columnMode]="ColumnMode.force"
        [headerHeight]="50"
        [footerHeight]="50"
        [scrollbarV]="true"
        [scrollbarH]="false"
        [rowHeight]="60"
        [virtualizedFluidRowHeight]="true"
        rowHeight="auto"
        [reorderable]="reorderable"
      >
      </ngx-datatable>
    </div>
    <ng-template
      #textAreaCellTemplate
      let-row="row"
      let-column="column"
      let-isReplaced="isReplaced"
      ngx-datatable-cell-template
    >
      <div
        style=" width: 300px; border: 1px dashed red;"
        [style.height.px]="row.height"
        [attr.data-height]="row.height"
        class="dynamicSize"
      >
        Random Height of {{ row.height }} px
      </div>
    </ng-template>
  `,
    standalone: false
})
export class VirtualAutoComponent implements AfterViewInit {
  rows = [];
  loadingIndicator = true;
  reorderable = true;

  columns: TableColumn[] = [{ prop: 'name' }, { name: 'Gender' }, { name: 'Company', sortable: false }];

  ColumnMode = ColumnMode;
  @ViewChild('textAreaCellTemplate', { static: false }) cellTemplate: TemplateRef<any>;

  constructor(private zone: NgZone) {
    this.fetch((data: any[]) => {
      data.forEach(row => {
        row.height = Math.random() * 300;
      });

      this.rows = data;
      setTimeout(() => {
        this.loadingIndicator = false;
      }, 1500);
    });
  }

  ngAfterViewInit() {
    this.columns.find(col => col.prop === 'name').cellTemplate = this.cellTemplate;

    this.zone.runOutsideAngular(() => {
      window.setInterval(() => {
        const rows = document.querySelectorAll('.dynamicSize');
        rows.forEach((row: HTMLElement) => {
          const random = Math.random() * 200 - 100;
          let oldSize = Number(row.dataset.height) ?? 0;
          if (isNaN(oldSize)) {
            oldSize = 0;
          }
          const newSize = Math.min(300, Math.max(0, oldSize + random));
          row.style.height = `${newSize}px`;
          row.dataset.height = newSize.toString();
          row.innerText = `Random Height of ${newSize}px`;
        });
      }, 1000);
    });
  }

  fetch(cb) {
    const req = new XMLHttpRequest();
    req.open('GET', `assets/data/company.json`);

    req.onload = () => {
      cb(JSON.parse(req.response));
    };

    req.send();
  }
}
