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
    lineColor: colors.querySelector<HTMLInputElement>('input:checked')!.value,
    lineWidth: +lineRange.value,
    colors: [],
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
    const history = applicationState.doneHistory;
    for (let i = 0; i < history.length; i++) {
      context.strokeStyle = applicationState.colors[i];

      context.beginPath();

      context.moveTo(history[i][0], history[i][1]);

      for (let j = 2; j < history[i].length; j += 2) {
        context.lineTo(history[i][j], history[i][j + 1]);
        context.stroke();
      }
    }
  };

  const init = () => {
    detectDevice();

    canvas.addEventListener(
      eventsByDeviceType[applicationState.deviceType].start,
      (e) => {
        let x = 0;
        let y = 0;

        applicationState.isHoldingMouseButton = true;

        context.lineWidth = applicationState.lineWidth;
        context.strokeStyle = applicationState.lineColor ?? context.strokeStyle;

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

        applicationState.doneHistory.push([x, y]);

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
        ].push(x, y);

        context.lineTo(x, y);
        context.stroke();
      }
    );

    canvas.addEventListener(
      eventsByDeviceType[applicationState.deviceType].up,
      () => {
        applicationState.isHoldingMouseButton = false;

        applicationState.colors.push(context.strokeStyle as string);
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
        applicationState.lineWidth = +e.target.value;
      }
    });

    colors.addEventListener('click', (e) => {
      if (e.target instanceof HTMLInputElement) {
        applicationState.lineColor = e.target.value;
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
      context.clearRect(0, 0, canvas.width, canvas.height);
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

      context.clearRect(0, 0, canvas.width, canvas.height);

      applicationState.undoneHistory.push(applicationState.doneHistory.pop()!);

      redrawCanvas();
    });

    redo.addEventListener('click', () => {
      if (!applicationState.undoneHistory.length) return;

      context.clearRect(0, 0, canvas.width, canvas.height);

      applicationState.doneHistory.push(applicationState.undoneHistory.pop()!);

      redrawCanvas();
    });
  };

  init();
};
