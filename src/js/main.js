/*
c64js - A commodore 64 emulator
(c) Mikael Borgbrant, 2015 - 2016, Some rights reserved
Email: mikael [dot] borgbrant [at] gmail [dot] com
*/

var main = main || {
	canvasContext:	null,	// canvas context for rendering
	imageData:	null,	// raw pixel buffer r/g/b/a
	stop:		false,	// cpu running?
};

window.requestAnimFrame = (function () {
	return window.requestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		window.oRequestAnimationFrame ||
		window.msRequestAnimationFrame ||
		function (callback, element) {
			//window.setTimeout(callback, 1000 / 60);
			window.setTimeout(callback, 1000 / 50.125);
		};
})();

main.toggle_audio = function (menuItemElement) {
	if ('audioCtx' in window) {
		if (window.audioCtx.state == 'suspended') {
			window.audioCtx.resume();
			menuItemElement.className = menuItemElement.className.replace(/fa-volume-off/, 'fa-volume-up');
		} else {
			window.audioCtx.suspend();
			menuItemElement.className = menuItemElement.className.replace(/fa-volume-up/, 'fa-volume-off');
		}
	}
}

main.zoom = function (menuItemElement) {
	var emulatorContainer = document.getElementById('emulatorSize');
	var controlPanel = document.getElementById('controlPanel');
	if (emulatorContainer.className == 'zoom') {
		emulatorContainer.className = '';
		controlPanel.className = '';
		menuItemElement.className += menuItemElement.className.substr(0, menuItemElement.className.indexOf(' active'));
	} else {
		emulatorContainer.className = 'zoom';
		controlPanel.className = 'zoom';
		menuItemElement.className += ' active';
	}
}

main.fullscreen = function () {
	var isFullScreen = document.mozFullScreen || document.webkitIsFullScreen || document.msFullscreenElement || document.fullscreenElement;
	var elem = document.getElementById('screenCanvasFs');

	if (!isFullScreen) {
		if (elem.requestFullScreen) {
			elem.requestFullScreen();
		} else if (elem.msRequestFullscreen) {
			elem.msRequestFullscreen();
		} else if (elem.mozRequestFullScreen) {
			elem.mozRequestFullScreen();
		} else if (elem.webkitRequestFullScreen) {
			elem.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
		} else {
			alert('Fullscreen not supported. Try Firefox or Chrome.');
		}
	}
}

main.exitFullscreen = function () {
	var isFullScreen = document.mozFullScreen || document.webkitIsFullScreen || document.msFullscreenElement || document.fullscreenElement;
	if (isFullScreen) {
		if (document.cancelFullScreen) {
			document.cancelFullScreen();
		} else if (document.msExitFullscreen) {
			document.msExitFullscreen();
		} else if (document.exitFullscreen) {
			document.exitFullscreen();
		} else if (document.mozCancelFullScreen) {
			document.mozCancelFullScreen();
		} else if (document.webkitCancelFullScreen) {
			document.webkitCancelFullScreen();
		}
	}
}

main.start = function (canvas) {

	this.canvasContext = canvas.getContext('2d');
	this.imageData = this.canvasContext.createImageData(384, 272);

	memoryManager.kernel = new Rom(0xe000, romDump.kernel);
	memoryManager.basic = new Rom(0xa000, romDump.basic);
	memoryManager.character = new Rom(0x0000, romDump.character);

	cpuMemoryManager.init();
	mos6510.init(cpuMemoryManager);
	vic2.init(vicMemoryManager, this.imageData.data);
	sid.init();

	var cpuCycles = 0;
	var cycles = 19656;

	var doCycles = function () {

		if (!main.stop) {
			window.requestAnimFrame(doCycles);
		}

		for (var line = 0; line < 312; ++ line) {
			for (cycle = 1; cycle <= 63; ++cycle) {	// cycle within raster line start at 1 to match most documentation

				// Low phase: VIC
				vic2.process(line, cycle);

				// High phase: CPU
				if (vic2.cycleTypeCPU == 'x' || (vic2.cycleTypeCPU == 'X' && cpuCycles > 0)) {
					if (cpuCycles <= 0) {
						cpuCycles = mos6510.process();
						if (cpuCycles == 0) {
							console.log('pc: ' + mos6510.register.pc.toString(16));
							main.stop = true;
						}
					}

					cpuCycles--;		// FIXME implement stun-on-read during an instruction
				}
			}

			if (main.stop) {
				break;
			}
		}

		// TODO: This should be in the clock loop, but it didn't work for now
		memoryManager.cia1.process(cycles);
		memoryManager.cia2.process(cycles);

		main.canvasContext.putImageData(main.imageData, 0, 0);
	}

	doCycles();
}
