import { AfterViewInit, Component, ContentChild, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ColumnMode, TableColumn } from 'projects/swimlane/ngx-datatable/src/public-api';

@Component({
  selector: 'virtual-auto-demo',
  template: `
    <div>
      <h3>
        Virtual Fluid Row Heights
        <small>
          <a
            href="https://github.com/swimlane/ngx-datatable/blob/master/src/app/basic/virtual-auto.component.ts"
            target="_blank"
          >
            Source
          </a>
        </small>
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
      <div style=" width: 300px; border: 1px dashed red;" [style.height.px]="row.height">
        Random Height of {{ row.height }} px
      </div>
    </ng-template>
  `
})
export class VirtualAutoComponent implements AfterViewInit {
  rows = [];
  loadingIndicator = true;
  reorderable = true;

  columns: TableColumn[] = [{ prop: 'name' }, { name: 'Gender' }, { name: 'Company', sortable: false }];

  ColumnMode = ColumnMode;
  @ViewChild('textAreaCellTemplate', { static: false }) cellTemplate: TemplateRef<any>;

  constructor() {
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
