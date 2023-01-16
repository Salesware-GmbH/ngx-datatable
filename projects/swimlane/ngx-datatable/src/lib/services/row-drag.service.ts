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
   * The Event currently beeing emitted
   */
  public currentEvent: DragEvent;

  /**
   * Event which will be emitted on Drag Start
   */
  @Output() onDragStart = new EventEmitter<DataTableBodyRowComponent>();

  /**
   * Event which will be emitted on Drag End
   */
  @Output() onDragEnd = new EventEmitter<DataTableBodyRowComponent>();

  private currentDropDirective: RowDropDirective = null;

  startDrag(row: DataTableBodyRowComponent, event: DragEvent) {
    this.row = row;
    this.dragActive = true;
    this.currentEvent = event;
    this.onDragStart.emit(row);
    this.currentEvent = null;
    this.row = null;
  }

  endDrag(event: DragEvent) {
    const currentDragElement = this.row;
    this.currentEvent = event;
    this.dragActive = false;
    this.onDragEnd.emit(currentDragElement);
    if (this.currentDropDirective !== null) {
      this.currentDropDirective.removeDragOverClass();
      this.currentDropDirective = null;
    }
    this.row = null;
    this.currentEvent = null;
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
