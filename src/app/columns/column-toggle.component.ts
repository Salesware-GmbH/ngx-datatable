import { Component } from '@angular/core';
import { ColumnMode } from 'projects/swimlane/ngx-datatable/src/public-api';

@Component({
    selector: 'column-toggle-demo',
    template: `
    <div>
      <h3>
        Column Toggling
        <small>
          <a
            href="https://github.com/swimlane/ngx-datatable/blob/master/src/app/columns/column-toggle.component.ts"
            target="_blank"
          >
            Source
          </a>
        </small>
      </h3>
      <div style="float:left;width:75%">
        <ngx-datatable
          class="material"
          [rows]="rows"
          [columnMode]="ColumnMode.force"
          [headerHeight]="50"
          [footerHeight]="50"
          rowHeight="auto"
        >
          <ngx-datatable-column *ngFor="let col of columns" [name]="col.name"> </ngx-datatable-column>
        </ngx-datatable>
      </div>
      <div class="selected-column">
        <h4>Available Columns</h4>
        <ul>
          <li *ngFor="let col of allColumns">
            <input type="checkbox" [id]="col.name" (click)="toggle(col)" [checked]="isChecked(col)" />
            <label [attr.for]="col.name">{{ col.name }}</label>
          </li>
        </ul>
      </div>
    </div>
  `,
    standalone: false
})
export class ColumnToggleComponent {
  rows = [
    {
      name: 'Claudine Neal',
      gender: 'female',
      company: 'Sealoud'
    },
    {
      name: 'Beryl Rice',
      gender: 'female',
      company: 'Velity'
    }
  ];

  columns = [{ name: 'Name' }, { name: 'Gender' }, { name: 'Company' }];

  allColumns = [{ name: 'Name' }, { name: 'Gender' }, { name: 'Company' }];

  ColumnMode = ColumnMode;

  toggle(col) {
    const isChecked = this.isChecked(col);

    if (isChecked) {
      this.columns = this.columns.filter(c => {
        return c.name !== col.name;
      });
    } else {
      this.columns = [...this.columns, col];
    }
  }

  isChecked(col) {
    return (
      this.columns.find(c => {
        return c.name === col.name;
      }) !== undefined
    );
  }
}
