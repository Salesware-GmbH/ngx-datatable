import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
    selector: 'datatable-progress',
    template: `
    <div class="progress-linear" role="progressbar" [style.left.px]="columnGroupWidths?.left" [style.right.px]="columnGroupWidths?.right">
      <div class="container">
        <div class="bar"></div>
      </div>
    </div>
  `,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class ProgressBarComponent {
  @Input() columnGroupWidths: any;
}
