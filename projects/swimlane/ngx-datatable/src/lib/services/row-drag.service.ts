import { Injectable, EventEmitter, Output, Renderer2 } from '@angular/core';
import { RowDropDirective } from '../directives/row-droppable.directive';
import { DataTableBodyRowComponent } from '../components/body/body-row.component';

@Injectable()
export class RowDragService {
  // variable for holding if drag is active at the moment
  // This is important for dynamically setting z-index on drop areas
  // @see body.component.ts
  public dragActive = false;

  /**
   * The Element current beening dragged
   */
  public row: DataTableBodyRowComponent = null;

  /**
   * Event which will be emitted on Drag Start
   */
  @Output() onDragStart = new EventEmitter<DataTableBodyRowComponent>();

  /**
   * Event which will be emitted on Drag End
   */
  @Output() onDragEnd = new EventEmitter<DataTableBodyRowComponent>();

  private currentDropDirective: RowDropDirective = null;

  startDrag(row: DataTableBodyRowComponent) {
    this.row = row;
    this.dragActive = true;
    this.onDragStart.emit(row);
  }

  endDrag() {
    const currentDragElement = this.row;
    this.row = null;
    this.dragActive = false;
    this.onDragEnd.emit(currentDragElement);
    if (this.currentDropDirective !== null) {
      this.currentDropDirective.removeDragOverClass();
      this.currentDropDirective = null;
    }
  }

  setActiveDropElement(dropDirective: RowDropDirective) {
    if (this.currentDropDirective !== dropDirective) {
      if (this.currentDropDirective !== null) {
        this.currentDropDirective.removeDragOverClass();
        this.currentDropDirective = null;
      }
      dropDirective.addDragOverClass();
      this.currentDropDirective = dropDirective;
    }
  }
}
