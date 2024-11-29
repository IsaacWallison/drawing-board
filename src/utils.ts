export const calculateXAndYFromTouchDevice = (
  e: TouchEvent,
  canvas: HTMLCanvasElement
) => {
  const { touches, changedTouches } = e;
  const touch = touches[0] ?? changedTouches[0];
  const x = Math.floor(touch.clientX - canvas.getBoundingClientRect().x);
  const y = Math.floor(touch.clientY - canvas.getBoundingClientRect().y);

  return [x, y];
};
