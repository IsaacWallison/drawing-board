import './style.css';
import { ApplicationState } from './types/ApplicationState';
import { calculateXAndYFromTouchDevice } from './utils';

window.onload = () => {
  const canvas: HTMLCanvasElement = document.querySelector('#canvas')!;

  const undo: HTMLButtonElement = document.querySelector(
    "button[data-event='undo']"
  )!;
  const redo: HTMLButtonElement = document.querySelector(
    "button[data-event='redo']"
  )!;
  const save: HTMLButtonElement = document.querySelector(
    "button[data-event='save']"
  )!;
  const drawMode: HTMLButtonElement = document.querySelector(
    "button[data-event='draw-tool']"
  )!;
  const eraseMode: HTMLButtonElement = document.querySelector(
    "button[data-event='erase-tool']"
  )!;
  const clearBoard: HTMLButtonElement = document.querySelector(
    "button[data-event='clear']"
  )!;

  const lineRange: HTMLInputElement = document.querySelector('#line-range')!;

  const colors: HTMLDivElement = document.querySelector('.colors')!;

  const context: CanvasRenderingContext2D = canvas.getContext('2d')!;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  context.lineCap = 'round';
  context.lineJoin = 'round';

  const applicationState: ApplicationState = {
    deviceType: 'mouse',
    toolSelected: 'draw',
    isHoldingMouseButton: false,
    doneHistory: [],
    undoneHistory: [],
  };

  const eventsByDeviceType = {
    mouse: {
      start: 'mousedown',
      up: 'mouseup',
      move: 'mousemove',
      leave: 'mouseleave',
    },
    touch: {
      start: 'touchstart',
      up: 'touchend',
      move: 'touchmove',
      leave: 'touchleave',
    },
  };

  const detectDevice = () => {
    try {
      document.createEvent('TouchEvent');
      applicationState.deviceType = 'touch';
    } catch (error) {
      applicationState.deviceType = 'mouse';
    }
  };

  const erase = (x: number, y: number) => {
    context.clearRect(
      x,
      y,
      Math.pow(context.lineWidth, 2),
      Math.pow(context.lineWidth, 2)
    );
  };

  const redrawCanvas = () => {
    applicationState.doneHistory.forEach(
      ({ lineColor, lineWidth, starterCoordinates, coordinates }) => {
        context.strokeStyle = lineColor;
        context.lineWidth = lineWidth;

        context.beginPath();
        context.moveTo(starterCoordinates.x, starterCoordinates.y);

        coordinates.forEach(({ x, y }) => {
          context.lineTo(x, y);
          context.stroke();
        });
      }
    );
  };

  const clearCanvas = () =>
    context.clearRect(0, 0, canvas.width, canvas.height);

  const init = () => {
    detectDevice();

    canvas.addEventListener(
      eventsByDeviceType[applicationState.deviceType].start,
      (e) => {
        let x = 0;
        let y = 0;

        applicationState.isHoldingMouseButton = true;

        context.lineWidth = +lineRange.value;
        context.strokeStyle =
          colors.querySelector<HTMLInputElement>('input:checked')!.value;

        context.beginPath();

        if (e instanceof MouseEvent) {
          [x, y] = [e.clientX, e.clientY];
        }

        if (e instanceof TouchEvent) {
          const [touchX, touchY] = calculateXAndYFromTouchDevice(e, canvas);
          [x, y] = [touchX, touchY];
        }

        if (applicationState.toolSelected === 'erase') {
          erase(x, y);
          return;
        }

        applicationState.doneHistory.push({
          lineColor: context.strokeStyle,
          lineWidth: context.lineWidth,
          starterCoordinates: { x, y },
          coordinates: [],
        });

        context.moveTo(x, y);
      }
    );

    canvas.addEventListener(
      eventsByDeviceType[applicationState.deviceType].move,
      (e) => {
        if (!applicationState.isHoldingMouseButton) return;

        let x = 0;
        let y = 0;

        if (e instanceof MouseEvent) {
          [x, y] = [e.clientX, e.clientY];
        }

        if (e instanceof TouchEvent) {
          const [touchX, touchY] = calculateXAndYFromTouchDevice(e, canvas);
          [x, y] = [touchX, touchY];
        }

        if (applicationState.toolSelected === 'erase') {
          erase(x, y);
          return;
        }

        applicationState.doneHistory[
          applicationState.doneHistory.length - 1
        ].coordinates.push({ x, y });

        context.lineTo(x, y);
        context.stroke();
      }
    );

    canvas.addEventListener(
      eventsByDeviceType[applicationState.deviceType].up,
      () => {
        applicationState.isHoldingMouseButton = false;
      }
    );

    canvas.addEventListener(
      eventsByDeviceType[applicationState.deviceType].leave,
      () => {
        applicationState.isHoldingMouseButton = false;
      }
    );

    lineRange.addEventListener('change', (e) => {
      if (e.target instanceof HTMLInputElement) {
        const line = document.querySelector<HTMLDivElement>('.line')!;
        line.style.setProperty('--line-width', `${e.target.value}px`);
      }
    });

    drawMode.addEventListener('click', () => {
      if (eraseMode.classList.contains('selected'))
        eraseMode.classList.remove('selected');

      drawMode.classList.add('selected');
      applicationState.toolSelected = 'draw';
    });

    eraseMode.addEventListener('click', () => {
      if (drawMode.classList.contains('selected'))
        drawMode.classList.remove('selected');

      eraseMode.classList.add('selected');
      applicationState.toolSelected = 'erase';
    });

    clearBoard.addEventListener('click', () => {
      clearCanvas();
      applicationState.undoneHistory = [];
      applicationState.doneHistory = [];
    });

    save.addEventListener('click', () => {
      const canvasImage = canvas.toDataURL();
      const anchor = document.createElement('a');
      anchor.href = canvasImage;
      anchor.download = `draw-${Date.now()}.png`;

      anchor.click();
    });

    undo.addEventListener('click', () => {
      if (!applicationState.doneHistory.length) return;

      applicationState.undoneHistory.push(applicationState.doneHistory.pop()!);

      clearCanvas();

      redrawCanvas();
    });

    redo.addEventListener('click', () => {
      if (!applicationState.undoneHistory.length) return;

      applicationState.doneHistory.push(applicationState.undoneHistory.pop()!);

      clearCanvas();

      redrawCanvas();
    });
  };

  init();
};
