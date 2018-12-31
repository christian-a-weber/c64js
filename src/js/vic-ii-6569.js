// TODO: side border timing, idle accesses 3fff/39ff

var vic2 = vic2 || {};

vic2.screenCanvas = null;
vic2.screenCanvasContext = null;
vic2.screenCanvasImageData = null;

vic2.sprites = [
	{ id: 0, x: 0, y: 0, enabled: false, doubleHeight: false, doubleWidth: false, isBehindContents: false, multicolor: false, color: 0, collisionSprite: false,  collisionBackground: false },
	{ id: 1, x: 0, y: 0, enabled: false, doubleHeight: false, doubleWidth: false, isBehindContents: false, multicolor: false, color: 0, collisionSprite: false,  collisionBackground: false },
	{ id: 2, x: 0, y: 0, enabled: false, doubleHeight: false, doubleWidth: false, isBehindContents: false, multicolor: false, color: 0, collisionSprite: false,  collisionBackground: false },
	{ id: 3, x: 0, y: 0, enabled: false, doubleHeight: false, doubleWidth: false, isBehindContents: false, multicolor: false, color: 0, collisionSprite: false,  collisionBackground: false },
	{ id: 4, x: 0, y: 0, enabled: false, doubleHeight: false, doubleWidth: false, isBehindContents: false, multicolor: false, color: 0, collisionSprite: false,  collisionBackground: false },
	{ id: 5, x: 0, y: 0, enabled: false, doubleHeight: false, doubleWidth: false, isBehindContents: false, multicolor: false, color: 0, collisionSprite: false,  collisionBackground: false },
	{ id: 6, x: 0, y: 0, enabled: false, doubleHeight: false, doubleWidth: false, isBehindContents: false, multicolor: false, color: 0, collisionSprite: false,  collisionBackground: false },
	{ id: 7, x: 0, y: 0, enabled: false, doubleHeight: false, doubleWidth: false, isBehindContents: false, multicolor: false, color: 0, collisionSprite: false,  collisionBackground: false },
];

vic2.screenControlRegister = {
	yScroll: 0x03,				// vertical scroll (0-7)
	screenHeight: true,			// false = 24 rows, 						true = 25 rows
	screenOn: true,				// false = screen is covered by border, 	true = Screen on, normal screen contents are visible
	renderMode: false,			// false = Text mode, 						true = Bitmap mode
	extendedBackground: false,	// false = Extended background mode off, 	true = Extended background mode on
	currentRasterLine: 0,
	interruptRasterLine: 0,
	xScroll : 0,				// horizontal scroll (0-7)
	screenWidth: true,			// false = 38 columns						true = 40 columns
	multiColor: false,

	// internal flipflops
	mainBorder: false,			// main border flag: if set, border color is shown
	vBorder: false,				// vertical border flag: if set, mainBorder can't be reset
};

vic2.memorySetupRegister = {
	pointerToCharMemory: 0x0000,
	pointerToBitmapMemory: 0x0000,
	pointerToScreenMemory: 0x0000,
};

vic2.interruptRegister = {
	// Skipping lightpen for interrupts
	events: {
		rasterLineOccurred: false,
		spriteBackgroundCollisionOccurred: false,
		spriteSpriteCollisionOccurred: false
	},

	mask: {
		rasterLineEnabled: false,
		spriteBackgroundCollisionEnabled: false,
		spriteSpriteCollisionEnabled: false,
	}
};

vic2.borderColor = 0x00;
vic2.backgroundColor = 0x00;
vic2.extraBackgroundColor1 = 0x00;
vic2.extraBackgroundColor2 = 0x00;
vic2.extraBackgroundColor3 = 0x00;
vic2.extraSpriteColor1 = 0x00;
vic2.extraSpriteColor2 = 0x00;

vic2.memory = null;


vic2.init = function(memoryManager) {
	this.memory = memoryManager;
}

vic2.setScreenCanvas = function(canvasObject) {
	this.screenCanvas = canvasObject;
	this.screenCanvasContext = this.screenCanvas.getContext('2d');
	this.screenCanvasImageData = this.screenCanvasContext.createImageData(this.screenCanvas.width, this.screenCanvas.height);
};

vic2.putPixel = function(x, y, c) {
	if (x >= 0 && x < 384 && y >= 0 && y < 272) {
		var position = (y * 384 + x) * 4;
		var colorPalette = [ 0x000000, 0xffffff, 0x68372b, 0x70a4b2, 0x6f3d86, 0x588d43, 0x352879, 0xb8c76f,
		                     0x6f4f25, 0x433900, 0x9a6759, 0x444444, 0x6c6c6c, 0x9ad284, 0x6c5eB5, 0x959595 ];
		var color = colorPalette[c & 0x0f];

		this.screenCanvasImageData.data[position + 0] = (color & 0xff0000) >> 16;	// red
		this.screenCanvasImageData.data[position + 1] = (color & 0x00ff00) >> 8;	// green
		this.screenCanvasImageData.data[position + 2] = (color & 0x0000ff);			// blue
		this.screenCanvasImageData.data[position + 3] = 0xff;						// alpha
	}
}

vic2.onWriteByte = function(address, data) {
	switch (address & 0x3f) {		// vic2 memory map is repeated every 64 bytes

		case 0x00:		// $d000: sprite0 x
			vic2.sprites[0].x = (vic2.sprites[0].x & 0x100) | data;
			break;

		case 0x01:		// $d001: sprite0 y
			vic2.sprites[0].y = data;
			break;

		case 0x02:		// $d002: sprite1 x
			vic2.sprites[1].x = (vic2.sprites[1].x & 0x100) | data;
			break;

		case 0x03:		// $d003: sprite1 y
			vic2.sprites[1].y = data;
			break;

		case 0x04:		// $d004: sprite2 x
			vic2.sprites[2].x = (vic2.sprites[2].x & 0x100) | data;
			break;

		case 0x05:		// $d005: sprite2 y
			vic2.sprites[2].y = data;
			break;

		case 0x06:		// $d006: sprite3 x
			vic2.sprites[3].x = (vic2.sprites[3].x & 0x100) | data;
			break;

		case 0x07:		// $d007: sprite3 y
			vic2.sprites[3].y = data;
			break;

		case 0x08:		// $d008: sprite4 x
			vic2.sprites[4].x = (vic2.sprites[4].x & 0x100) | data;
			break;

		case 0x09:		// $d009: sprite4 y
			vic2.sprites[4].y = data;
			break;

		case 0x0a:		// $d00a: sprite5 x
			vic2.sprites[5].x = (vic2.sprites[5].x & 0x100) | data;
			break;

		case 0x0b:		// $d00b: sprite5 y
			vic2.sprites[5].y = data;
			break;

		case 0x0c:		// $d00c: sprite6 x
			vic2.sprites[6].x = (vic2.sprites[6].x & 0x100) | data;
			break;

		case 0x0d:		// $d00d: sprite6 y
			vic2.sprites[6].y = data;
			break;

		case 0x0e:		// $d00e: sprite7 x
			vic2.sprites[7].x = (vic2.sprites[7].x & 0x100) | data;
			break;

		case 0x0f:		// $d000: sprite7 y
			vic2.sprites[7].y = data;
			break;

		case 0x10:		// $d010: sprite 0-7 x msb
			vic2.sprites[0].x = (data & 0x01) << 8 | vic2.sprites[0].x & 0xff;
			vic2.sprites[1].x = (data & 0x02) << 7 | vic2.sprites[1].x & 0xff;
			vic2.sprites[2].x = (data & 0x04) << 6 | vic2.sprites[2].x & 0xff;
			vic2.sprites[3].x = (data & 0x08) << 5 | vic2.sprites[3].x & 0xff;
			vic2.sprites[4].x = (data & 0x10) << 4 | vic2.sprites[4].x & 0xff;
			vic2.sprites[5].x = (data & 0x20) << 3 | vic2.sprites[5].x & 0xff;
			vic2.sprites[6].x = (data & 0x40) << 2 | vic2.sprites[6].x & 0xff;
			vic2.sprites[7].x = (data & 0x80) << 1 | vic2.sprites[7].x & 0xff;
			break;

		case 0x11:		// $d011: control register 1
			vic2.screenControlRegister.yScroll = data & 0x07;
			vic2.screenControlRegister.screenHeight = (data & 0x08) > 0;
			vic2.screenControlRegister.screenOn = (data & 0x10) > 0;
			vic2.screenControlRegister.renderMode = (data & 0x20) > 0;
			vic2.screenControlRegister.extendedBackground = (data & 0x40) > 0;
			vic2.screenControlRegister.interruptRasterLine = (data & 0x80) << 1 | vic2.screenControlRegister.interruptRasterLine & 0xff;
			break;

		case 0x12:		// $d012: raster counter
		    vic2.screenControlRegister.interruptRasterLine = vic2.screenControlRegister.interruptRasterLine & 0x100 | data & 0xff;
			break;

		case 0x13:		// $d013: lightpen x (not implemented)
			break;

		case 0x14:		// $d014: lightpen y (not implemented)
			break;

		case 0x15:		// $d015: sprite enable
			vic2.sprites[0].enabled = (data & 0x01) > 0;
			vic2.sprites[1].enabled = (data & 0x02) > 0;
			vic2.sprites[2].enabled = (data & 0x04) > 0;
			vic2.sprites[3].enabled = (data & 0x08) > 0;
			vic2.sprites[4].enabled = (data & 0x10) > 0;
			vic2.sprites[5].enabled = (data & 0x20) > 0;
			vic2.sprites[6].enabled = (data & 0x40) > 0;
			vic2.sprites[7].enabled = (data & 0x80) > 0;
			break;

		case 0x16:		// $d016: control register 2
			vic2.screenControlRegister.xScroll = data & 0x07;
			vic2.screenControlRegister.screenWidth = (data & 0x08) > 0;
			vic2.screenControlRegister.multiColor = (data & 0x10) > 0;
			break;

		case 0x17:		// $d017: sprite double height
			vic2.sprites[0].doubleHeight = (data & 0x01) > 0;
			vic2.sprites[1].doubleHeight = (data & 0x02) > 0;
			vic2.sprites[2].doubleHeight = (data & 0x04) > 0;
			vic2.sprites[3].doubleHeight = (data & 0x08) > 0;
			vic2.sprites[4].doubleHeight = (data & 0x10) > 0;
			vic2.sprites[5].doubleHeight = (data & 0x20) > 0;
			vic2.sprites[6].doubleHeight = (data & 0x40) > 0;
			vic2.sprites[7].doubleHeight = (data & 0x80) > 0;
			break;

		case 0x18:		// $d018: memory setup register
			vic2.memorySetupRegister.pointerToBitmapMemory = (data & 0x08) << 10;
			vic2.memorySetupRegister.pointerToCharMemory   = (data & 0x0e) << 10;
			vic2.memorySetupRegister.pointerToScreenMemory = (data & 0xf0) << 6;
			break;

		case 0x19:		// $d019: acknowledge interrupts (write 1 to clear an interrupt bit)
			if (data & 0x01) vic2.interruptRegister.events.rasterLineOccurred = false;
			if (data & 0x02) vic2.interruptRegister.events.spriteBackgroundCollisionOccurred = false;
			if (data & 0x04) vic2.interruptRegister.events.spriteSpriteCollisionOccurred = false;
			break;

		case 0x1a:		// $d01a: interrupt enabled
			vic2.interruptRegister.mask.rasterLineEnabled = (data & 0x01) > 0;
			vic2.interruptRegister.mask.spriteBackgroundCollisionEnabled = (data & 0x02) > 0;
			vic2.interruptRegister.mask.spriteSpriteCollisionEnabled = (data & 0x04) > 0;
			break;

		case 0x1b:		// $d01b: sprite priority
			vic2.sprites[0].isBehindContents = (data & 0x01) > 0;
			vic2.sprites[1].isBehindContents = (data & 0x02) > 0;
			vic2.sprites[2].isBehindContents = (data & 0x04) > 0;
			vic2.sprites[3].isBehindContents = (data & 0x08) > 0;
			vic2.sprites[4].isBehindContents = (data & 0x10) > 0;
			vic2.sprites[5].isBehindContents = (data & 0x20) > 0;
			vic2.sprites[6].isBehindContents = (data & 0x40) > 0;
			vic2.sprites[7].isBehindContents = (data & 0x80) > 0;
			break;

		case 0x1c:		// $d01c: sprite multicolor
			vic2.sprites[0].multicolor = (data & 0x01) > 0;
			vic2.sprites[1].multicolor = (data & 0x02) > 0;
			vic2.sprites[2].multicolor = (data & 0x04) > 0;
			vic2.sprites[3].multicolor = (data & 0x08) > 0;
			vic2.sprites[4].multicolor = (data & 0x10) > 0;
			vic2.sprites[5].multicolor = (data & 0x20) > 0;
			vic2.sprites[6].multicolor = (data & 0x40) > 0;
			vic2.sprites[7].multicolor = (data & 0x80) > 0;
			break;

		case 0x1d:		// $d01d: sprite double width
			vic2.sprites[0].doubleWidth = (data & 0x01) > 0;
			vic2.sprites[1].doubleWidth = (data & 0x02) > 0;
			vic2.sprites[2].doubleWidth = (data & 0x04) > 0;
			vic2.sprites[3].doubleWidth = (data & 0x08) > 0;
			vic2.sprites[4].doubleWidth = (data & 0x10) > 0;
			vic2.sprites[5].doubleWidth = (data & 0x20) > 0;
			vic2.sprites[6].doubleWidth = (data & 0x40) > 0;
			vic2.sprites[7].doubleWidth = (data & 0x80) > 0;
			break;

		case 0x1e:		// $d01e: sprite-sprite collision (read-only register)
			break;

		case 0x1f:		// $d01f: sprite-background collisions (read-only register)
			break;

		case 0x20:		// $d020: border color
			this.borderColor = data;
			break;

		case 0x21:		// $d021: background color #0
			this.backgroundColor = data;
			break;

		case 0x22:		// $d022: background color #1
			this.extraBackgroundColor1 = data;
			break;

		case 0x23:		// $d023: background color #2
			this.extraBackgroundColor2 = data;
			break;

		case 0x24:		// $d024: background color #3
			this.extraBackgroundColor3 = data;
			break;

		case 0x25:		// $d025: sprite multicolor #1
			this.extraSpriteColor1 = data;
			break;

		case 0x26:		// $d026: sprite multicolor #2
			this.extraSpriteColor2 = data;
			break;

		case 0x27:		// $d027: sprite0 color
			this.sprites[0].color = data & 0x0f;
			break;

		case 0x28:		// $d028: sprite1 color
			this.sprites[1].color = data & 0x0f;
			break;

		case 0x29:		// $d029: sprite2 color
			this.sprites[2].color = data & 0x0f;
			break;

		case 0x2a:		// $d02a: sprite3 color
			this.sprites[3].color = data & 0x0f;
			break;

		case 0x2b:		// $d02b: sprite4 color
			this.sprites[4].color = data & 0x0f;
			break;

		case 0x2c:		// $d02c: sprite5 color
			this.sprites[5].color = data & 0x0f;
			break;

		case 0x2d:		// $d02d: sprite6 color
			this.sprites[6].color = data & 0x0f;
			break;

		case 0x2e:		// $d02e: sprite7 color
			this.sprites[7].color = data & 0x0f;
			break;
	}
}

vic2.onReadByte = function(address) {
	switch (address & 0x3f) {		// vic2 memory map is repeated every 64 bytes

		case 0x00:		// $d000: sprite0 x
			return vic2.sprites[0].x & 0xff;

		case 0x01:		// $d001: sprite0 y
			return vic2.sprites[0].y;

		case 0x02:		// $d002: sprite1 x
			return vic2.sprites[1].x & 0xff;

		case 0x03:		// $d003: sprite1 y
			return vic2.sprites[1].y;

		case 0x04:		// $d004: sprite2 x
			return vic2.sprites[2].x & 0xff;

		case 0x05:		// $d005: sprite2 y
			return vic2.sprites[2].y;

		case 0x06:		// $d006: sprite3 x
			return vic2.sprites[3].x & 0xff;

		case 0x07:		// $d007: sprite3 y
			return vic2.sprites[3].y;

		case 0x08:		// $d008: sprite4 x
			return vic2.sprites[4].x & 0xff;

		case 0x09:		// $d009: sprite4 y
			return vic2.sprites[4].y;

		case 0x0a:		// $d00a: sprite5 x
			return vic2.sprites[5].x & 0xff;

		case 0x0b:		// $d00b: sprite5 y
			return vic2.sprites[5].y;

		case 0x0c:		// $d00c: sprite6 x
			return vic2.sprites[6].x & 0xff;

		case 0x0d:		// $d00d: sprite6 y
			return vic2.sprites[6].y;

		case 0x0e:		// $d00e: sprite7 x
			return vic2.sprites[7].x & 0xff;

		case 0x0f:		// $d000: sprite7 y
			return vic2.sprites[7].y;

		case 0x10:		// $d010: sprite 0-7 x msb
			return (vic2.sprites[0].x & 0x100) >> 8 | (vic2.sprites[1].x & 0x100) >> 7
			     | (vic2.sprites[2].x & 0x100) >> 6 | (vic2.sprites[3].x & 0x100) >> 5
			     | (vic2.sprites[4].x & 0x100) >> 4 | (vic2.sprites[5].x & 0x100) >> 3
			     | (vic2.sprites[6].x & 0x100) >> 2 | (vic2.sprites[7].x & 0x100) >> 1;

		case 0x11:		// $d011: control register 1
			return (vic2.screenControlRegister.yScroll & 0x07) | (vic2.screenControlRegister.screenHeight ? 0x08 : 0x00)
			     | (vic2.screenControlRegister.screenOn ? 0x10 : 0x00) | (vic2.screenControlRegister.renderMode ? 0x20 : 0x00)
			     | (vic2.screenControlRegister.extendedBackground ? 0x40 : 0x00) | (vic2.screenControlRegister.currentRasterLine & 0x100) >> 1;

		case 0x12:		// $d012: raster counter low bits
			return vic2.screenControlRegister.currentRasterLine & 0xff;

		case 0x13:		// $d013: lightpen x (not implemented)
			return 0;

		case 0x14:		// $d014: lightpen y (not implemented)
			return 0;

		case 0x15:		// $d015: sprite enable
			return vic2.sprites[0].enabled << 0 | vic2.sprites[1].enabled << 1
			     | vic2.sprites[2].enabled << 2 | vic2.sprites[3].enabled << 3
			     | vic2.sprites[4].enabled << 4 | vic2.sprites[5].enabled << 5
			     | vic2.sprites[6].enabled << 6 | vic2.sprites[7].enabled << 7;

		case 0x16:		// $d016: control register 2
			return (vic2.screenControlRegister.xScroll & 0x07)
			     | (vic2.screenControlRegister.screenWidth ? 0x08 : 0x00)
			     | (vic2.screenControlRegister.multiColor  ? 0x10 : 0x00);

		case 0x17:		// $d017: sprite double height
			return vic2.sprites[0].doubleHeight << 0 | vic2.sprites[1].doubleHeight << 1
			     | vic2.sprites[2].doubleHeight << 2 | vic2.sprites[3].doubleHeight << 3
			     | vic2.sprites[4].doubleHeight << 4 | vic2.sprites[5].doubleHeight << 5
			     | vic2.sprites[6].doubleHeight << 6 | vic2.sprites[7].doubleHeight << 7;

		case 0x18:		// $d018: memory setup register
			return vic2.memorySetupRegister.pointerToBitmapMemory >> 10
			     | vic2.memorySetupRegister.pointerToScreenMemory >> 6
			     | 1;	// unused bits read back as 1

		case 0x19:		// $d019: interrupt register
			return (   (vic2.interruptRegister.events.rasterLineOccurred && vic2.interruptRegister.mask.rasterLineEnabled)
			        || (vic2.interruptRegister.events.spriteBackgroundCollisionOccurred && vic2.interruptRegister.mask.spriteBackgroundCollisionEnabled)
			        || (vic2.interruptRegister.events.spriteSpriteCollisionOccurred && vic2.interruptRegister.mask.spriteSpriteCollisionEnabled)) ? 0x80 : 0x00
			     | vic2.interruptRegister.events.spriteSpriteCollisionOccurred << 2
			     | vic2.interruptRegister.events.spriteBackgroundCollisionOccurred << 1
			     | vic2.interruptRegister.events.rasterLineOccurred << 0;

		case 0x1a:		// $d01a: interrupt enabled
			return (vic2.interruptRegister.mask.rasterLineEnabled << 0)
			     | (vic2.interruptRegister.mask.spriteBackgroundCollisionEnabled << 1)
			     | (vic2.interruptRegister.mask.spriteSpriteCollisionEnabled << 2);

		case 0x1b:		// $d01b: sprite priority
			return vic2.sprites[0].isBehindContents << 0 | vic2.sprites[1].isBehindContents << 1
			     | vic2.sprites[2].isBehindContents << 2 | vic2.sprites[3].isBehindContents << 3
			     | vic2.sprites[4].isBehindContents << 4 | vic2.sprites[5].isBehindContents << 5
			     | vic2.sprites[6].isBehindContents << 6 | vic2.sprites[7].isBehindContents << 7;

		case 0x1c:		// $d01c: sprite multicolor
			return vic2.sprites[0].multicolor << 0 | vic2.sprites[1].multicolor << 1
			     | vic2.sprites[2].multicolor << 2 | vic2.sprites[3].multicolor << 3
			     | vic2.sprites[4].multicolor << 4 | vic2.sprites[5].multicolor << 5
			     | vic2.sprites[6].multicolor << 6 | vic2.sprites[7].multicolor << 7;

		case 0x1d:		// $d01d: sprite double width
			return vic2.sprites[0].doubleWidth << 0 | vic2.sprites[1].doubleWidth << 1
			     | vic2.sprites[2].doubleWidth << 2 | vic2.sprites[3].doubleWidth << 3
			     | vic2.sprites[4].doubleWidth << 4 | vic2.sprites[5].doubleWidth << 5
			     | vic2.sprites[6].doubleWidth << 6 | vic2.sprites[7].doubleWidth << 7;

		case 0x1e:		// $d01e: get and clear sprite-sprite collisions
			var result = 0;
			for (var i = 0; i < 8; i++) {
				if (vic2.sprites[i].collisionSprite) {
					result |= 1 << i;
					vic2.sprites[i].collisionSprite = false;
				}
			}
			return result;

		case 0x1f:		// $d01f: get and clear sprite-background collisions
			var result = 0;
			for (var i = 0; i < 8; i++) {
				if (vic2.sprites[i].collisionBackground) {
					result |= 1 << i;
					vic2.sprites[i].collisionBackground = false;
				}
			}
			return result;

		case 0x20:		// $d020: border color
			return this.borderColor;

		case 0x21:		// $d021: background color #0
			return this.backgroundColor;

		case 0x22:		// $d022: background color #1
			return this.extraBackgroundColor1;

		case 0x23:		// $d023: background color #2
			return this.extraBackgroundColor2;

		case 0x24:		// $d024: background color #3
			return this.extraBackgroundColor3;

		case 0x25:		// $d025: sprite multicolor #1
			return this.extraSpriteColor1;

		case 0x26:		// $d026: sprite multicolor #2
			return this.extraSpriteColor2;

		case 0x27:		// $d027: sprite0 color
			return this.sprites[0].color;

		case 0x28:		// $d028: sprite1 color
			return this.sprites[1].color;

		case 0x29:		// $d029: sprite2 color
			return this.sprites[2].color;

		case 0x2a:		// $d02a: sprite3 color
			return this.sprites[3].color;

		case 0x2b:		// $d02b: sprite4 color
			return this.sprites[4].color;

		case 0x2c:		// $d02c: sprite5 color
			return this.sprites[5].color;

		case 0x2d:		// $d02d: sprite6 color
			return this.sprites[6].color;

		case 0x2e:		// $d02e: sprite7 color
			return this.sprites[7].color;
	}
}

vic2.renderStandardCharacterMode = function(x, y) {
	var col = x >> 3;
	var rowPos = (y >> 3) * 40;
	var content = vic2.memory.readByte(vic2.memorySetupRegister.pointerToScreenMemory + rowPos + col);
	var charMemPos = vic2.memorySetupRegister.pointerToCharMemory + (content * 8);
	var color = vic2.memory.readByte(0xd800 + rowPos + col);
	if (vic2.memory.readByte(charMemPos + y % 8) & (0x80 >> x % 8)) {
		return { rendered: true, color: color, renderedBackgroundColor: color == vic2.backgroundColor };
	}
	return { rendered: false, renderedBackgroundColor: false };
};

vic2.renderMultiColorCharacterMode = function(x, y) {
	var col = x >> 3;
	var rowPos = (y >> 3) * 40;
	var color = vic2.memory.readByte(0xd800 + (rowPos + col));
	if (color & 0x08) {
		var textMemPos = vic2.memorySetupRegister.pointerToScreenMemory + (rowPos + col);
		var charMemPos = vic2.memorySetupRegister.pointerToCharMemory + (vic2.memory.readByte(textMemPos) * 8);
		var xOffset = x % 8;
		xOffset -= xOffset % 2;
		var colorBits = (vic2.memory.readByte(charMemPos + y % 8) & (0xc0 >> xOffset)) >> 6 - xOffset;
		color = [vic2.backgroundColor, vic2.extraBackgroundColor1, vic2.extraBackgroundColor2, color & 0x07][colorBits];
		return { rendered: true, color: color, renderedBackgroundColor: colorBits < 2 };
	}

	// if bit 3 of the color is low, this char should be rendered in standard mode
	return vic2.renderStandardCharacterMode(x, y);
}

vic2.renderStandardBitmapMode = function(x, y) {
	var col = x >> 3, rowPos = (y >> 3) * 40;
	if ((vic2.memory.readByte(vic2.memorySetupRegister.pointerToBitmapMemory + (rowPos + col) * 8 + y % 8) & (0x80 >> x % 8)) > 0) {
		var color = vic2.memory.readByte(vic2.memorySetupRegister.pointerToScreenMemory + rowPos + col) >> 4;
		return { rendered: true, color: color, renderedBackgroundColor: color == vic2.backgroundColor };
	}
	return { rendered: false, renderedBackgroundColor: false };
};

vic2.renderMultiColorBitmapMode = function(x, y) {
	var col = x >> 3, rowPos = (y >> 3) * 40, color;
	switch ((vic2.memory.readByte(vic2.memorySetupRegister.pointerToBitmapMemory + (rowPos + col) * 8 + y % 8) >> (7 - x & 6)) & 3) {
		case 0:
			return { rendered: false, renderedBackgroundColor: false };
		case 1:
			color = vic2.memory.readByte(vic2.memorySetupRegister.pointerToScreenMemory + rowPos + col) >> 4;
			break;
		case 2:
			color = vic2.memory.readByte(vic2.memorySetupRegister.pointerToScreenMemory + rowPos + col) & 15;
			break;
		case 3:
			color = vic2.memory.readByte(0xd800 + rowPos + col);
			break;
	}
	return { rendered: true, color: color, renderedBackgroundColor: color == vic2.backgroundColor };
}

vic2.renderSprites = function(rx, ry, renderedBackgroundColorUnder) {

	var baseAddressSpriteVectors = vic2.memorySetupRegister.pointerToScreenMemory + 0x3f8;
	var firstCollider = null;

	for (var z = 7; z >= 0; z--) {
		var sprite = this.sprites[z];
		if (sprite.enabled) {

			var width  = sprite.doubleWidth  ? 48 : 24;
			var height = sprite.doubleHeight ? 42 : 21;

			var dx = rx - (sprite.x + 8);	// pixel coordinates relative to sprite start
			var dy = ry - (sprite.y - 13);

			if (dx >= 0 && dx < width && dy >= 0 && dy < height && (!sprite.isBehindContents || renderedBackgroundColorUnder)) {

				dx = sprite.doubleWidth ? dx >> 1 : dx;
				dy = sprite.doubleHeight ? dy >> 1 : dy;

				var addressSpriteDataAddress = this.memory.readByte(baseAddressSpriteVectors + z) * 64;
				var spriteDataByte = this.memory.readByte(addressSpriteDataAddress + dy * 3 + (dx >> 3));
				var color, colorBits = 0;

				if (sprite.multicolor) {
					colorBits = (spriteDataByte >> (7 - dx & 6)) & 3;
					color = [0x00, vic2.extraSpriteColor1, sprite.color, vic2.extraSpriteColor2][colorBits];
				} else if (colorBits = (spriteDataByte >> (7 - dx & 7)) & 1) {
					color = sprite.color;
				}

				if (colorBits) {
					this.putPixel(rx, ry, color);

					// sprite to sprite collision
					if (firstCollider) {
						firstCollider.collisionSprite = true;
						sprite.collisionSprite = true;
						if (this.interruptRegister.mask.spriteSpriteCollisionEnabled) {
							if (!this.interruptRegister.events.spriteSpriteCollisionOccurred)
								console.log("Sprite " + sprite.id + " collided with sprite " + firstCollider.id);
							this.interruptRegister.events.spriteSpriteCollisionOccurred = true;
							mos6510.irq = true;
						}
					} else {
						firstCollider = sprite;
					}

					// sprite to background collision detection
					if (!renderedBackgroundColorUnder) {
						sprite.collisionBackground = true;
						if (this.interruptRegister.mask.spriteBackgroundCollisionEnabled) {
							if (!this.interruptRegister.events.spriteBackgroundCollisionOccurred)
								console.log("Sprite " + sprite.id + " collided with background");
							this.interruptRegister.events.spriteBackgroundCollisionOccurred = true;
							mos6510.irq = true;
						}
					}
				}
			}
		}
	}
}

// frameCycle = current clock cycle 0..19655: 312 lines of 63 cycles
vic2.process = function(frameCycle, frameInterlaceToggle) {

	var cycle = frameCycle % 63;				// cycle within raster line: 0..62
	var line = Math.floor(frameCycle / 63);		// raster line 0..311

	var badLine = (line >= 48 && line < 248 && ((line & 7) == this.screenControlRegister.yScroll));

	this.screenControlRegister.currentRasterLine = line;

	// at start of each raster line: turn vBorder flag on/off depending on line and screenHeight
	if (cycle == 0) {
		if (line == (this.screenControlRegister.screenHeight ? 51 : 55) && this.screenControlRegister.screenOn)	// top (3)
			this.screenControlRegister.vBorder = false;
		else if (line == (this.screenControlRegister.screenHeight ? 251 : 247))	// bottom (2)
			this.screenControlRegister.vBorder = true;
	}

	// canvas size is 384 x 272 pixels: line = [14..285] and x = [112..495]
	if (cycle >= 15 && cycle < 63 && line >= 14 && line < 286) {	// inside canvas? (rest is blanking)
		for (var x = cycle * 8; x < cycle * 8 + 8; ++x) {			// 1 cycle = 8 pixels

			var fromBorderX = x - 120;			// coordinates relative to border start (=sprite coordinates)
			var fromBorderY = line - 14;


			// at left/right border boundaries: calculate vBorder and mainBorder flags
			if (fromBorderX == (this.screenControlRegister.screenWidth ? 24 + 8 : 31 + 8)) {	// left
					if (line == (this.screenControlRegister.screenHeight ? 51 : 55) && this.screenControlRegister.screenOn)	// top
						this.screenControlRegister.vBorder = false;
					else if (line == (this.screenControlRegister.screenHeight ? 251 : 247))		// bottom
						this.screenControlRegister.vBorder = true;
					if (!this.screenControlRegister.vBorder)			// reset mainBorder if vBorder is not set
						this.screenControlRegister.mainBorder = false;
			} else if (fromBorderX == (this.screenControlRegister.screenWidth ? 344 + 8 : 335 + 8))	// right
					this.screenControlRegister.mainBorder = true;

			if (!this.screenControlRegister.mainBorder) {	// is the border off?

				var fromScreenX = fromBorderX - 32 - this.screenControlRegister.xScroll;			// visible screen area
				var fromScreenY = line - 48 - this.screenControlRegister.yScroll;
				var rendered = { rendered:true, color:0, renderedBackgroundColor:false };			// default: black (TODO: should be contents of $3fff / $39ff)

				if (fromScreenX >= 0 && fromScreenX < 320 && fromScreenY >= 0 && fromScreenY < 200) {
					if (this.screenControlRegister.renderMode) {
						if (this.screenControlRegister.multiColor) {
							rendered = this.renderMultiColorBitmapMode(fromScreenX, fromScreenY);
						} else {
							rendered = this.renderStandardBitmapMode(fromScreenX, fromScreenY);
						}
					} else {
						if (this.screenControlRegister.multiColor) {
							rendered = this.renderMultiColorCharacterMode(fromScreenX, fromScreenY);
						} else {
							rendered = this.renderStandardCharacterMode(fromScreenX, fromScreenY);
						}
					}
				}

				if (rendered.rendered) {
					this.putPixel(fromBorderX, fromBorderY, rendered.color);
				} else {
					this.putPixel(fromBorderX, fromBorderY, this.backgroundColor);
					rendered.renderedBackgroundColor = true;
				}

				// render sprites
				this.renderSprites(fromBorderX, fromBorderY, rendered.renderedBackgroundColor);

			} else {	// render border
				this.putPixel(fromBorderX, fromBorderY, this.borderColor /* + badLine + 2 * !this.screenControlRegister.screenWidth */);	// remove comment to see bad lines and screen width register
			}
		}
	}

	if (cycle == 0) {
		if (vic2.interruptRegister.mask.rasterLineEnabled && line == this.screenControlRegister.interruptRasterLine) {
			this.interruptRegister.events.rasterLineOccurred = true;
			mos6510.irq = true;
		}
	}

	if (line == 311 && cycle == 62) {	// end of frame
		this.screenCanvasContext.putImageData(this.screenCanvasImageData, 0, 0);
	}

	return badLine;
};
