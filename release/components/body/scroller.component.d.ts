import { ElementRef, EventEmitter } from '@angular/core';
export declare class ScrollerComponent {
    scrollbarV: boolean;
    scrollbarH: boolean;
    scrollHeight: number;
    scrollWidth: number;
    scroll: EventEmitter<any>;
    scrollYPos: number;
    scrollXPos: number;
    prevScrollYPos: number;
    prevScrollXPos: number;
    element: any;
    parentElement: any;
    onScrollListener: any;
    constructor(element: ElementRef);
    setOffset(offsetY: number): void;
    onScrolled(event: CustomEvent): void;
    updateOffset(): void;
}
