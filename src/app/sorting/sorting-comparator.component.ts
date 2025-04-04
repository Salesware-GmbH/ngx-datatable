import { Component } from '@angular/core';
import { ColumnMode } from 'projects/swimlane/ngx-datatable/src/public-api';

@Component({
    selector: 'comparator-sorting-demo',
    template: `
    <div>
      <h3>
        Custom Sorting Comparator
        <small>
          <a
            href="https://github.com/swimlane/ngx-datatable/blob/master/src/app/sorting/sorting-comparator.component.ts"
            target="_blank"
          >
            Source
          </a>
        </small>
      </h3>
      <ngx-datatable
        class="material"
        [rows]="rows"
        [columns]="columns"
        [columnMode]="ColumnMode.force"
        [headerHeight]="50"
        [footerHeight]="50"
        rowHeight="auto"
      >
      </ngx-datatable>
    </div>
  `,
    standalone: false
})
export class SortingComparatorComponent {
  rows = [];

  columns = [
    { name: 'Company', comparator: this.companyComparator.bind(this) },
    { name: 'Name', sortable: false },
    { name: 'Gender', sortable: false }
  ];

  ColumnMode = ColumnMode;

  constructor() {
    this.fetch(data => {
      this.rows = data;
    });
  }

  fetch(cb) {
    const req = new XMLHttpRequest();
    req.open('GET', `assets/data/company.json`);

    req.onload = () => {
      const data = JSON.parse(req.response);
      cb(data.splice(0, 20));
    };

    req.send();
  }

  companyComparator(propA, propB) {
    console.log('Sorting Comparator', propA, propB);

    // Just a simple sort function comparisoins
    if (propA.toLowerCase() < propB.toLowerCase()) {
      return -1;
    }
    if (propA.toLowerCase() > propB.toLowerCase()) {
      return 1;
    }
  }
}
