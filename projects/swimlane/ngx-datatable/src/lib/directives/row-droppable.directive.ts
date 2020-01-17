import {
  Output, EventEmitter, Input, HostListener, Directive,
  HostBinding, ElementRef, Renderer2
} from '@angular/core';
import { RowDragService } from '../services/row-drag.service';

export interface DropTargetOptions {
  zone?: string;
}

@Directive({
  selector: '[row-droppable]'
})
export class RowDropDirective {

  /**
   * Added to the element any time a draggable element is being dragged
   */
  @Input() dragActiveClass: string;

  /**
   * Added to the element when an element is dragged over it
   */
  @Input() dragOverClass: string;

  @Output() onDropEvent = new EventEmitter();
  private options: DropTargetOptions = {};

  constructor(
    private element: ElementRef<HTMLElement>,
    private renderer: Renderer2,
    private dragService: RowDragService) {

  }

  public addDragOverClass() {
    this.renderer.addClass(
      this.element.nativeElement,
      this.dragOverClass
    );
  }

  public removeDragOverClass() {
    this.renderer.removeClass(
      this.element.nativeElement,
      this.dragOverClass
    );
  }

  @HostListener('dragenter', ['$event'])
  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent) {
    const { zone = 'zone' } = this.options;

    this.dragService.setActiveDropElement(this);
    event.preventDefault();
  }

  @HostListener('dragexit', ['$event'])
  onDragLeave(event: DragEvent) {
    this.removeDragOverClass();

  }

  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent) {
    const data = Number.parseInt(event.dataTransfer.getData('data'), 10);
    this.removeDragOverClass();
    this.dragService.endDrag();
    this.onDropEvent.emit(data);
  }
}
