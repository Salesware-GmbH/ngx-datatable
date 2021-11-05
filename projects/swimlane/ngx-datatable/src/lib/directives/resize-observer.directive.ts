import { AfterViewInit, Directive, ElementRef, EventEmitter, OnDestroy, Output } from '@angular/core';

// https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver
declare class ResizeObserver {
  constructor(callback: (data: any) => void);
  observe(node: Node);
  disconnect(): void;
  unobserve(node: Node);
}

@Directive({
  selector: '[resize-observer]'
})
export class ResizeObserverDirective implements AfterViewInit, OnDestroy {
  private _resizeObserver: ResizeObserver;
  private _element: HTMLElement;

  @Output() heightChanged: EventEmitter<any> = new EventEmitter();

  constructor(element: ElementRef) {
    this._element = element?.nativeElement;

    if ('ResizeObserver' in window) {
      this._resizeObserver = new ResizeObserver(data => {
        this.heightChanged.next(data);
      });
    }
  }

  ngAfterViewInit() {
    if (!this._resizeObserver) {
      return;
    }

    this._resizeObserver.observe(this._element);
  }

  ngOnDestroy() {
    if (!!this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
  }
}
