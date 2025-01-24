import { AfterViewInit, Directive, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { SharedResizeObserver } from '../services/shared-resize-observer';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver
declare class ResizeObserver {
  constructor(callback: (data: any) => void);
  observe(node: Node);
  disconnect(): void;
  unobserve(node: Node);
}

@Directive({
    selector: '[resize-observer]',
    standalone: false
})
export class ResizeObserverDirective implements AfterViewInit, OnDestroy {
  @Input({ alias: 'resize-observer' }) enabled = false;

  private _element: HTMLElement;
  private ngUnsubscribe = new Subject<void>();

  @Output() heightChanged: EventEmitter<any> = new EventEmitter();

  constructor(element: ElementRef, private sharedResizeObserver: SharedResizeObserver) {
    this._element = element?.nativeElement;
  }

  ngAfterViewInit() {
    if (this.enabled) {
      this.sharedResizeObserver
        .observe(this._element)
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe(data => {
          requestAnimationFrame(() => {
            this.heightChanged.next(data);
          });
        });
    }
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
