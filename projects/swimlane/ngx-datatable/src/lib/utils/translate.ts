export function translateXY(styles: any, x: number, y: number) {
  styles['transform'] = `translate3d(${x}px, ${y}px, 0)`;
  styles['backface-visibility'] = 'hidden';
}
