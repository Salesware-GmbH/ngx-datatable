import { SelectionType } from './../../../projects/swimlane/ngx-datatable/src/lib/types/selection.type';
import { Component, ViewEncapsulation, ViewChild } from '@angular/core';

@Component({
  selector: 'row-drag-drop-demo',
  template: `
    <div>
      <h3>
        Row Drag&Drop Demo
        <small>
          <a href="https://github.com/swimlane/ngx-datatable/blob/master/demo/basic/row-drag-drop.component.ts" target="_blank">
            Source
          </a>
        </small>        
      </h3>
      <ngx-datatable style="height : 700px;"
        class="material"
        [rowsDraggable]="true"
        [rows]="rows"
        [selectionType]="selectionType"
        [headerHeight]="50"
        [scrollbarV]="true"        
        [rowHeight]="50"
        [selected]="selected"
        [dataAttributesRow]="setDataAttributesRow"
        [dataAttributesCell]="setDataAttributesCell"
        (select)='onSelect($event)'
        (rowDropped)="onDrop($event)">
        <ngx-datatable-column name="Id" [width]="80"></ngx-datatable-column>
        <ngx-datatable-column name="Name" [width]="300"></ngx-datatable-column>
        <ngx-datatable-column name="Gender"></ngx-datatable-column>
        <ngx-datatable-column name="Age"></ngx-datatable-column>
        <ngx-datatable-column name="City" [width]="300" prop="address.city"></ngx-datatable-column>
        <ngx-datatable-column name="State" [width]="300" prop="address.state"></ngx-datatable-column>
      </ngx-datatable>
    </div>
  `,
  encapsulation: ViewEncapsulation.None

})
export class RowDragDropComponent {

  selectionType = SelectionType.multi;

  rows = [];
  public selected: any[] = [];  

  constructor() {
    this.fetch((data) => {
      this.rows = data;
    });
  }

  moveArraysElementPosition(array, from, to) {
    const extracted = this.rows.splice(from, 1)[0];
    this.rows.splice(to, 0, extracted);
    this.rows = [...this.rows];
  }

  fetch(cb) {
    const req = new XMLHttpRequest();
    req.open('GET', `assets/data/100k.json`);

    req.onload = () => {
      cb(JSON.parse(req.response));
    };

    req.send();
  }

  onSelect({ selected }) {
    this.selected.splice(0, this.selected.length);
    this.selected.push(...selected);
  }

  onDrop(event: any) {
    if (this.selected.length > 0) {
      // event start index doesnt matter because the user can start the drag on any item if multi selection
      const startIndex = event.startindex;
      const destIndex = event.destindex;

      // lets sort our selected aray after index so that it is not relevant which item was selected first
      let selectionIndependentArray = new Array();
      let isAnyIndexSmallerThanDest = false;
      for (const i of this.selected) {
        const srcIndex = this.rows.findIndex(t => t.id === i.id);
        if (srcIndex < destIndex) {
          isAnyIndexSmallerThanDest = true;
        }
        selectionIndependentArray.push({
          item: i,
          sourceIndex: srcIndex,
          destIndex: -1
        });
      }
      // sort asc or desc depending if we want to move the rows down or up
      selectionIndependentArray = selectionIndependentArray.sort((a, b) => {
        if (a.sourceIndex > b.sourceIndex) {
          return isAnyIndexSmallerThanDest ? 1 : -1;
        } else if (a.sourceIndex < b.sourceIndex) {
          return isAnyIndexSmallerThanDest ? -1 : 1;
        } else {
          return 0;
        }
      });

      for (let i = 0; i < selectionIndependentArray.length; i++) {
        const item = selectionIndependentArray[i];
        const dstIndex = item.sourceIndex < destIndex ? destIndex - 1 : destIndex;
        selectionIndependentArray[i].destIndex = dstIndex;
      }

      for (const item of selectionIndependentArray) {
        // source index is another if multiple selection !!
        const sourceIndex = this.rows.findIndex(t => t.id === item.item.id);
        this.moveArraysElementPosition(this.rows, sourceIndex, item.destIndex);
      }
    }
  }

  setDataAttributesRow(row) {
    return { 
      dataAttributes: [
        {key: 'row-id', value: row.id}
      ]
    };
  }
  
  setDataAttributesCell(column);
  setDataAttributesCell(column, row?) {
    if (!!row) {
      return { 
        dataAttributes: [
          {key: 'row-id', value: row.id},
          {key: 'column-name', value: column.name}
        ]
      };
    } else {
      return {
        dataAttributes: [
          {key: 'header-cell-name', value: column.name}
        ]
      }
    }
  }
}
