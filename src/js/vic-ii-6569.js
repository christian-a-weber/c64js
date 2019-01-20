// TODO: proper cycle timing to make side border sprites work

var vic2 = vic2 || {};

vic2.imageData = null;			// byte array r/g/b/a of vic screen

vic2.lineTimings = [
	// line timing table, used to calculate vic2.cycleTypeVIC and vic2.cycleTypeCPU
	"3xix4xix5xix6xix7xixrxrxrxrxrxgxgxgxgxgxgxgxgxgxgxgxgxgxgxgxgxgxgxgxgxgxgxgxgxgxgxgxgxgxgxgxgxgxgxgxgxgxgxgxgxixix0xix1xix2xix",	// good line, no sprites
	"3xix4xix5xix6xix7xixrxrXrXrXrcgcgcgcgcgcgcgcgcgcgcgcgcgcgcgcgcgcgcgcgcgcgcgcgcgcgcgcgcgcgcgcgcgcgcgcgcgcgcgcgxixix0xix1xix2xix",	// bad line, no sprites
];

vic2.colorPalette = [0x000000, 0xffffff, 0x68372b, 0x70a4b2, 0x6f3d86, 0x588d43, 0x352879, 0xb8c76f, 0x6f4f25, 0x433900, 0x9a6759, 0x444444, 0x6c6c6c, 0x9ad284, 0x6c5eB5, 0x959595];

vic2.sprites = [
	// dma: dma on/off. mcbase: mob data counter. base: 6 bit counter with reset. mc: 6 bit mob counter, can be loaded from mcbase. yex: y-expsansion flip flop.
	{ id: 0, x: 0, y: 0, enabled: false, doubleHeight: false, doubleWidth: false, isBehindContents: false, multicolor: false, color: 0, collisionSprite: false, collisionBackground: false, pointer: 0, dma: false, mcbase: 0, mc: 0, yex: false, data: [0, 0, 0] },
	{ id: 1, x: 0, y: 0, enabled: false, doubleHeight: false, doubleWidth: false, isBehindContents: false, multicolor: false, color: 0, collisionSprite: false, collisionBackground: false, pointer: 0, dma: false, mcbase: 0, mc: 0, yex: false, data: [0, 0, 0] },
	{ id: 2, x: 0, y: 0, enabled: false, doubleHeight: false, doubleWidth: false, isBehindContents: false, multicolor: false, color: 0, collisionSprite: false, collisionBackground: false, pointer: 0, dma: false, mcbase: 0, mc: 0, yex: false, data: [0, 0, 0] },
	{ id: 3, x: 0, y: 0, enabled: false, doubleHeight: false, doubleWidth: false, isBehindContents: false, multicolor: false, color: 0, collisionSprite: false, collisionBackground: false, pointer: 0, dma: false, mcbase: 0, mc: 0, yex: false, data: [0, 0, 0] },
	{ id: 4, x: 0, y: 0, enabled: false, doubleHeight: false, doubleWidth: false, isBehindContents: false, multicolor: false, color: 0, collisionSprite: false, collisionBackground: false, pointer: 0, dma: false, mcbase: 0, mc: 0, yex: false, data: [0, 0, 0] },
	{ id: 5, x: 0, y: 0, enabled: false, doubleHeight: false, doubleWidth: false, isBehindContents: false, multicolor: false, color: 0, collisionSprite: false, collisionBackground: false, pointer: 0, dma: false, mcbase: 0, mc: 0, yex: false, data: [0, 0, 0] },
	{ id: 6, x: 0, y: 0, enabled: false, doubleHeight: false, doubleWidth: false, isBehindContents: false, multicolor: false, color: 0, collisionSprite: false, collisionBackground: false, pointer: 0, dma: false, mcbase: 0, mc: 0, yex: false, data: [0, 0, 0] },
	{ id: 7, x: 0, y: 0, enabled: false, doubleHeight: false, doubleWidth: false, isBehindContents: false, multicolor: false, color: 0, collisionSprite: false, collisionBackground: false, pointer: 0, dma: false, mcbase: 0, mc: 0, yex: false, data: [0, 0, 0] },
];

vic2.screenControlRegister = {
	xScroll: 0,					// horizontal scroll (0-7)
	yScroll: 0,					// vertical scroll (0-7)
	screenOn: true,				// false = screen is covered by border	 	true = Screen on, normal screen contents are visible
	screenWidth: true,			// false = 38 columns						true = 40 columns
	screenHeight: true,			// false = 24 rows	 						true = 25 rows
	bitmapMode: false,			// false = Text mode 						true = Bitmap mode (BMM)
	multiColor: false,			// false = multi color mode off				true = multi color mode (MCM) on
	extendedBackground: false,	// false = Extended background mode off 	true = Extended background mode (ECM) on
	currentRasterLine: 0,
	interruptRasterLine: 0,
};

vic2.memorySetupRegister = {
	pointerToCharMemory: 0x0000,
	pointerToBitmapMemory: 0x0000,
	pointerToScreenMemory: 0x0000,
};

vic2.interruptRegister = {
	// TODO lightpen interrupts
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

// internal vic state
vic2.mainBorder = false;		// main border flag: if set, border color is shown
vic2.vBorder = false;			// vertical border flag: if set, mainBorder can't be reset
vic2.sideBorderHack = 0;		// we're still not 100% cycle exact, so we cheat :)
vic2.displayState = false;		// true: display state (c and g data are fetched), false: idle (g=3fff/39ff fetched, c=0)
vic2.pointerToIdleMemory = 0;	// address for idle bitmap accesses (used for top / bottom border effects)
vic2.cycleTypeVIC = 'i';		// i=Idle, c=cData, g=gData, 0-9=sprite pointers, s=sprite data, r=refresh cycle
vic2.cycleTypeCPU = 'x';		// p=processor running, P=processor read only, c=stunned by cData, s=stunnd by sprite data
vic2.badLine = false;			// true if the cpu will be stunned because of c data accesses in this line
vic2.xPos = 0;					// current x position in pixels relative to canvas (same as sprite coordinates)
vic2.yPos = 0;					// current y position in pixels relative to canvas (same as sprite coordinates)
vic2.vcBase = 0;				// video counter base (10 bit register)
vic2.vc = 0;					// video counter (10 bit counter)
vic2.vmli = 0;					// index into videoMatrixLine / colorMatrixLine (6 bit counter, counts 0..39)
vic2.rc = 0;					// row counter (3 bit), counts row since last bad line
vic2.videoMatrixLine = [];		// 40 bytes, read by cData dma during bad lines
vic2.colorMatrixLine = [];		// 40 bytes, read by cData dma during bad lines
vic2.cData = 0;					// current c data byte (video matrix)
vic2.gData = 0;					// current g data byte (bitmap or char)
vic2.colorData = 0;				// current color ram data nybble
vic2.pixelBit = 0;				// bit position of current pixel [7..0]
vic2.pixelColor = 0;			// color of current pixel [0..15]
vic2.pixelIsBG = false;			// true if the current pixel is a background pixel (0 in hires or 00/01 in multicolor mode)

vic2.init = function(imageData) {
	this.imageData = imageData;
}

vic2.onWriteByte = function(address, data) {
	switch (address & 0x3f) {		// vic2 register map is repeated every 64 bytes

		case 0x00:		// $d000: sprite0 x
			this.sprites[0].x = (this.sprites[0].x & 0x100) | data;
			break;

		case 0x01:		// $d001: sprite0 y
			this.sprites[0].y = data;
			break;

		case 0x02:		// $d002: sprite1 x
			this.sprites[1].x = (this.sprites[1].x & 0x100) | data;
			break;

		case 0x03:		// $d003: sprite1 y
			this.sprites[1].y = data;
			break;

		case 0x04:		// $d004: sprite2 x
			this.sprites[2].x = (this.sprites[2].x & 0x100) | data;
			break;

		case 0x05:		// $d005: sprite2 y
			this.sprites[2].y = data;
			break;

		case 0x06:		// $d006: sprite3 x
			this.sprites[3].x = (this.sprites[3].x & 0x100) | data;
			break;

		case 0x07:		// $d007: sprite3 y
			this.sprites[3].y = data;
			break;

		case 0x08:		// $d008: sprite4 x
			this.sprites[4].x = (this.sprites[4].x & 0x100) | data;
			break;

		case 0x09:		// $d009: sprite4 y
			this.sprites[4].y = data;
			break;

		case 0x0a:		// $d00a: sprite5 x
			this.sprites[5].x = (this.sprites[5].x & 0x100) | data;
			break;

		case 0x0b:		// $d00b: sprite5 y
			this.sprites[5].y = data;
			break;

		case 0x0c:		// $d00c: sprite6 x
			this.sprites[6].x = (this.sprites[6].x & 0x100) | data;
			break;

		case 0x0d:		// $d00d: sprite6 y
			this.sprites[6].y = data;
			break;

		case 0x0e:		// $d00e: sprite7 x
			this.sprites[7].x = (this.sprites[7].x & 0x100) | data;
			break;

		case 0x0f:		// $d000: sprite7 y
			this.sprites[7].y = data;
			break;

		case 0x10:		// $d010: sprite 0-7 x msb
			this.sprites[0].x = (data & 0x01) << 8 | this.sprites[0].x & 0xff;
			this.sprites[1].x = (data & 0x02) << 7 | this.sprites[1].x & 0xff;
			this.sprites[2].x = (data & 0x04) << 6 | this.sprites[2].x & 0xff;
			this.sprites[3].x = (data & 0x08) << 5 | this.sprites[3].x & 0xff;
			this.sprites[4].x = (data & 0x10) << 4 | this.sprites[4].x & 0xff;
			this.sprites[5].x = (data & 0x20) << 3 | this.sprites[5].x & 0xff;
			this.sprites[6].x = (data & 0x40) << 2 | this.sprites[6].x & 0xff;
			this.sprites[7].x = (data & 0x80) << 1 | this.sprites[7].x & 0xff;
			break;

		case 0x11:		// $d011: control register 1
			this.screenControlRegister.yScroll = data & 0x07;
			this.screenControlRegister.screenHeight = (data & 0x08) > 0;
			this.screenControlRegister.screenOn = (data & 0x10) > 0;
			this.screenControlRegister.bitmapMode = (data & 0x20) > 0;
			this.screenControlRegister.extendedBackground = (data & 0x40) > 0;
			this.screenControlRegister.interruptRasterLine = (data & 0x80) << 1 | this.screenControlRegister.interruptRasterLine & 0xff;
			this.pointerToIdleMemory = this.screenControlRegister.extendedBackground ? 0x39ff : 0x3fff;
			this.setPixelRenderer();
			break;

		case 0x12:		// $d012: interrupt raster line low bits
			this.screenControlRegister.interruptRasterLine = this.screenControlRegister.interruptRasterLine & 0x100 | data & 0xff;
			break;

		case 0x13:		// $d013: lightpen x (not implemented)
			break;

		case 0x14:		// $d014: lightpen y (not implemented)
			break;

		case 0x15:		// $d015: sprite enable
			this.sprites[0].enabled = (data & 0x01) > 0;
			this.sprites[1].enabled = (data & 0x02) > 0;
			this.sprites[2].enabled = (data & 0x04) > 0;
			this.sprites[3].enabled = (data & 0x08) > 0;
			this.sprites[4].enabled = (data & 0x10) > 0;
			this.sprites[5].enabled = (data & 0x20) > 0;
			this.sprites[6].enabled = (data & 0x40) > 0;
			this.sprites[7].enabled = (data & 0x80) > 0;
			break;

		case 0x16:		// $d016: control register 2
			this.screenControlRegister.xScroll = data & 0x07;
			this.screenControlRegister.screenWidth = (data & 0x08) > 0;
			this.screenControlRegister.multiColor = (data & 0x10) > 0;
			this.setPixelRenderer();
			if (this.screenControlRegister.currentRasterLine >= 250)
				this.sideBorderHack++;
			break;

		case 0x17:		// $d017: sprite double height
			this.sprites[0].doubleHeight = (data & 0x01) > 0;
			this.sprites[1].doubleHeight = (data & 0x02) > 0;
			this.sprites[2].doubleHeight = (data & 0x04) > 0;
			this.sprites[3].doubleHeight = (data & 0x08) > 0;
			this.sprites[4].doubleHeight = (data & 0x10) > 0;
			this.sprites[5].doubleHeight = (data & 0x20) > 0;
			this.sprites[6].doubleHeight = (data & 0x40) > 0;
			this.sprites[7].doubleHeight = (data & 0x80) > 0;
			break;

		case 0x18:		// $d018: memory setup register
			this.memorySetupRegister.pointerToBitmapMemory = (data & 0x08) << 10;
			this.memorySetupRegister.pointerToCharMemory   = (data & 0x0e) << 10;
			this.memorySetupRegister.pointerToScreenMemory = (data & 0xf0) << 6;
			break;

		case 0x19:		// $d019: acknowledge interrupts (write 1 to clear an interrupt bit)
			if (data & 0x01) this.interruptRegister.events.rasterLineOccurred = false;
			if (data & 0x02) this.interruptRegister.events.spriteBackgroundCollisionOccurred = false;
			if (data & 0x04) this.interruptRegister.events.spriteSpriteCollisionOccurred = false;
			break;

		case 0x1a:		// $d01a: interrupt enabled
			this.interruptRegister.mask.rasterLineEnabled = (data & 0x01) > 0;
			this.interruptRegister.mask.spriteBackgroundCollisionEnabled = (data & 0x02) > 0;
			this.interruptRegister.mask.spriteSpriteCollisionEnabled = (data & 0x04) > 0;
			break;

		case 0x1b:		// $d01b: sprite priority
			this.sprites[0].isBehindContents = (data & 0x01) > 0;
			this.sprites[1].isBehindContents = (data & 0x02) > 0;
			this.sprites[2].isBehindContents = (data & 0x04) > 0;
			this.sprites[3].isBehindContents = (data & 0x08) > 0;
			this.sprites[4].isBehindContents = (data & 0x10) > 0;
			this.sprites[5].isBehindContents = (data & 0x20) > 0;
			this.sprites[6].isBehindContents = (data & 0x40) > 0;
			this.sprites[7].isBehindContents = (data & 0x80) > 0;
			break;

		case 0x1c:		// $d01c: sprite multicolor
			this.sprites[0].multicolor = (data & 0x01) > 0;
			this.sprites[1].multicolor = (data & 0x02) > 0;
			this.sprites[2].multicolor = (data & 0x04) > 0;
			this.sprites[3].multicolor = (data & 0x08) > 0;
			this.sprites[4].multicolor = (data & 0x10) > 0;
			this.sprites[5].multicolor = (data & 0x20) > 0;
			this.sprites[6].multicolor = (data & 0x40) > 0;
			this.sprites[7].multicolor = (data & 0x80) > 0;
			break;

		case 0x1d:		// $d01d: sprite double width
			this.sprites[0].doubleWidth = (data & 0x01) > 0;
			this.sprites[1].doubleWidth = (data & 0x02) > 0;
			this.sprites[2].doubleWidth = (data & 0x04) > 0;
			this.sprites[3].doubleWidth = (data & 0x08) > 0;
			this.sprites[4].doubleWidth = (data & 0x10) > 0;
			this.sprites[5].doubleWidth = (data & 0x20) > 0;
			this.sprites[6].doubleWidth = (data & 0x40) > 0;
			this.sprites[7].doubleWidth = (data & 0x80) > 0;
			break;

		case 0x1e:		// $d01e: sprite-sprite collision (read-only register)
			break;

		case 0x1f:		// $d01f: sprite-background collisions (read-only register)
			break;

		case 0x20:		// $d020: border color
			this.borderColor = data & 0x0f;
			break;

		case 0x21:		// $d021: background color #0
			this.backgroundColor = data & 0x0f;
			break;

		case 0x22:		// $d022: background color #1
			this.extraBackgroundColor1 = data & 0x0f;
			break;

		case 0x23:		// $d023: background color #2
			this.extraBackgroundColor2 = data & 0x0f;
			break;

		case 0x24:		// $d024: background color #3
			this.extraBackgroundColor3 = data & 0x0f;
			break;

		case 0x25:		// $d025: sprite multicolor #1
			this.extraSpriteColor1 = data & 0x0f;
			break;

		case 0x26:		// $d026: sprite multicolor #2
			this.extraSpriteColor2 = data & 0x0f;
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
	switch (address & 0x3f) {		// vic2 register map is repeated every 64 bytes

		case 0x00:		// $d000: sprite0 x
			return this.sprites[0].x & 0xff;

		case 0x01:		// $d001: sprite0 y
			return this.sprites[0].y;

		case 0x02:		// $d002: sprite1 x
			return this.sprites[1].x & 0xff;

		case 0x03:		// $d003: sprite1 y
			return this.sprites[1].y;

		case 0x04:		// $d004: sprite2 x
			return this.sprites[2].x & 0xff;

		case 0x05:		// $d005: sprite2 y
			return this.sprites[2].y;

		case 0x06:		// $d006: sprite3 x
			return this.sprites[3].x & 0xff;

		case 0x07:		// $d007: sprite3 y
			return this.sprites[3].y;

		case 0x08:		// $d008: sprite4 x
			return this.sprites[4].x & 0xff;

		case 0x09:		// $d009: sprite4 y
			return this.sprites[4].y;

		case 0x0a:		// $d00a: sprite5 x
			return this.sprites[5].x & 0xff;

		case 0x0b:		// $d00b: sprite5 y
			return this.sprites[5].y;

		case 0x0c:		// $d00c: sprite6 x
			return this.sprites[6].x & 0xff;

		case 0x0d:		// $d00d: sprite6 y
			return this.sprites[6].y;

		case 0x0e:		// $d00e: sprite7 x
			return this.sprites[7].x & 0xff;

		case 0x0f:		// $d000: sprite7 y
			return this.sprites[7].y;

		case 0x10:		// $d010: sprite 0-7 x msb
			return (this.sprites[0].x & 0x100) >> 8 | (this.sprites[1].x & 0x100) >> 7
			     | (this.sprites[2].x & 0x100) >> 6 | (this.sprites[3].x & 0x100) >> 5
			     | (this.sprites[4].x & 0x100) >> 4 | (this.sprites[5].x & 0x100) >> 3
			     | (this.sprites[6].x & 0x100) >> 2 | (this.sprites[7].x & 0x100) >> 1;

		case 0x11:		// $d011: control register 1
			return (this.screenControlRegister.yScroll & 0x07) | (this.screenControlRegister.screenHeight ? 0x08 : 0x00)
			     | (this.screenControlRegister.screenOn ? 0x10 : 0x00) | (this.screenControlRegister.bitmapMode ? 0x20 : 0x00)
			     | (this.screenControlRegister.extendedBackground ? 0x40 : 0x00) | (this.screenControlRegister.currentRasterLine & 0x100) >> 1;

		case 0x12:		// $d012: raster counter low bits
			return this.screenControlRegister.currentRasterLine & 0xff;

		case 0x13:		// $d013: lightpen x (not implemented)
			return 0;

		case 0x14:		// $d014: lightpen y (not implemented)
			return 0;

		case 0x15:		// $d015: sprite enable
			return this.sprites[0].enabled << 0 | this.sprites[1].enabled << 1
			     | this.sprites[2].enabled << 2 | this.sprites[3].enabled << 3
			     | this.sprites[4].enabled << 4 | this.sprites[5].enabled << 5
			     | this.sprites[6].enabled << 6 | this.sprites[7].enabled << 7;

		case 0x16:		// $d016: control register 2
			return (this.screenControlRegister.xScroll & 0x07)
			     | (this.screenControlRegister.screenWidth ? 0x08 : 0x00)
			     | (this.screenControlRegister.multiColor  ? 0x10 : 0x00);

		case 0x17:		// $d017: sprite double height
			return this.sprites[0].doubleHeight << 0 | this.sprites[1].doubleHeight << 1
			     | this.sprites[2].doubleHeight << 2 | this.sprites[3].doubleHeight << 3
			     | this.sprites[4].doubleHeight << 4 | this.sprites[5].doubleHeight << 5
			     | this.sprites[6].doubleHeight << 6 | this.sprites[7].doubleHeight << 7;

		case 0x18:		// $d018: memory setup register
			return this.memorySetupRegister.pointerToCharMemory >> 10
			     | this.memorySetupRegister.pointerToScreenMemory >> 6
			     | 1;	// unused bits read back as 1

		case 0x19:		// $d019: interrupt register
			return (   (this.interruptRegister.events.rasterLineOccurred && this.interruptRegister.mask.rasterLineEnabled)
			        || (this.interruptRegister.events.spriteBackgroundCollisionOccurred && this.interruptRegister.mask.spriteBackgroundCollisionEnabled)
			        || (this.interruptRegister.events.spriteSpriteCollisionOccurred && this.interruptRegister.mask.spriteSpriteCollisionEnabled)) ? 0x80 : 0x00
			     | this.interruptRegister.events.spriteSpriteCollisionOccurred << 2
			     | this.interruptRegister.events.spriteBackgroundCollisionOccurred << 1
			     | this.interruptRegister.events.rasterLineOccurred << 0;

		case 0x1a:		// $d01a: interrupt enabled
			return (this.interruptRegister.mask.rasterLineEnabled << 0)
			     | (this.interruptRegister.mask.spriteBackgroundCollisionEnabled << 1)
			     | (this.interruptRegister.mask.spriteSpriteCollisionEnabled << 2);

		case 0x1b:		// $d01b: sprite priority
			return this.sprites[0].isBehindContents << 0 | this.sprites[1].isBehindContents << 1
			     | this.sprites[2].isBehindContents << 2 | this.sprites[3].isBehindContents << 3
			     | this.sprites[4].isBehindContents << 4 | this.sprites[5].isBehindContents << 5
			     | this.sprites[6].isBehindContents << 6 | this.sprites[7].isBehindContents << 7;

		case 0x1c:		// $d01c: sprite multicolor
			return this.sprites[0].multicolor << 0 | this.sprites[1].multicolor << 1
			     | this.sprites[2].multicolor << 2 | this.sprites[3].multicolor << 3
			     | this.sprites[4].multicolor << 4 | this.sprites[5].multicolor << 5
			     | this.sprites[6].multicolor << 6 | this.sprites[7].multicolor << 7;

		case 0x1d:		// $d01d: sprite double width
			return this.sprites[0].doubleWidth << 0 | this.sprites[1].doubleWidth << 1
			     | this.sprites[2].doubleWidth << 2 | this.sprites[3].doubleWidth << 3
			     | this.sprites[4].doubleWidth << 4 | this.sprites[5].doubleWidth << 5
			     | this.sprites[6].doubleWidth << 6 | this.sprites[7].doubleWidth << 7;

		case 0x1e:		// $d01e: get and clear sprite-sprite collisions
			var result = 0;
			for (var i = 0; i < 8; i++) {
				if (this.sprites[i].collisionSprite) {
					result |= 1 << i;
					this.sprites[i].collisionSprite = false;
				}
			}
			return result;

		case 0x1f:		// $d01f: get and clear sprite-background collisions
			var result = 0;
			for (var i = 0; i < 8; i++) {
				if (this.sprites[i].collisionBackground) {
					result |= 1 << i;
					this.sprites[i].collisionBackground = false;
				}
			}
			return result;

		case 0x20:		// $d020: border color
			return this.borderColor | 0xf0;

		case 0x21:		// $d021: background color #0
			return this.backgroundColor | 0xf0;

		case 0x22:		// $d022: background color #1
			return this.extraBackgroundColor1 | 0xf0;

		case 0x23:		// $d023: background color #2
			return this.extraBackgroundColor2 | 0xf0;

		case 0x24:		// $d024: background color #3
			return this.extraBackgroundColor3 | 0xf0;

		case 0x25:		// $d025: sprite multicolor #1
			return this.extraSpriteColor1 | 0xf0;

		case 0x26:		// $d026: sprite multicolor #2
			return this.extraSpriteColor2 | 0xf0;

		case 0x27:		// $d027: sprite0 color
			return this.sprites[0].color | 0xf0;

		case 0x28:		// $d028: sprite1 color
			return this.sprites[1].color | 0xf0;

		case 0x29:		// $d029: sprite2 color
			return this.sprites[2].color | 0xf0;

		case 0x2a:		// $d02a: sprite3 color
			return this.sprites[3].color | 0xf0;

		case 0x2b:		// $d02b: sprite4 color
			return this.sprites[4].color | 0xf0;

		case 0x2c:		// $d02c: sprite5 color
			return this.sprites[5].color | 0xf0;

		case 0x2d:		// $d02d: sprite6 color
			return this.sprites[6].color | 0xf0;

		case 0x2e:		// $d02e: sprite7 color
			return this.sprites[7].color | 0xf0;
	}
}


vic2.renderPixel = null;

vic2.setPixelRenderer = function() {
	var renderers = [
		this.renderStandardCharacterMode,		// ECM=0 BMM=0 MCM=0
		this.renderMultiColorCharacterMode,		// EMC=0 BMM=0 MCM=1
		this.renderStandardBitmapMode,			// EMC=0 BMM=1 MCM=0
		this.renderMultiColorBitmapMode,		// EMC=0 BMM=1 MCM=1
		this.renderExtendedColorCharacterMode,	// ECM=1 BMM=0 MCM=0
		this.renderInvalidTextMode,				// ECM=1 BMM=0 MCM=1
		this.renderInvalidBitmapMode,			// ECM=1 BMM=1 MCM=0
		this.renderInvalidMulticolorBitmapMode	// ECM=1 BMM=1 MCM=1
	];
	this.renderPixel = renderers[this.screenControlRegister.extendedBackground << 2 | this.screenControlRegister.bitmapMode << 1 | this.screenControlRegister.multiColor];
}

vic2.renderStandardCharacterMode = function() {
	if (this.gData & 1 << this.pixelBit) {
		this.pixelColor = this.colorData;
		this.pixelIsBG = false;
	} else {
		this.pixelColor = this.backgroundColor;
		this.pixelIsBG = true;
	}
}

vic2.renderMultiColorCharacterMode = function() {
	if (this.colorData & 0x08) {							// extended background color flag
		switch (this.gData >> (this.pixelBit & 6) & 3) {	// two bits every two pixels
			case 0: this.pixelColor = this.backgroundColor;       this.pixelIsBG = true;  break;
			case 1: this.pixelColor = this.extraBackgroundColor1; this.pixelIsBG = true;  break;	// 01 considered background for collisions
			case 2: this.pixelColor = this.extraBackgroundColor2; this.pixelIsBG = false; break;
			case 3: this.pixelColor = this.colorData & 0x07;      this.pixelIsBG = false; break;
		}
	} else if (this.gData & 1 << this.pixelBit) {			// same as standard character mode
		this.pixelColor = this.colorData & 0x07;
		this.pixelIsBG = false;
	} else {
		this.pixelColor = this.backgroundColor;
		this.pixelIsBG = true;
	}
}

vic2.renderStandardBitmapMode = function() {
	if (this.gData & 1 << this.pixelBit) {
		this.pixelColor = this.cData >> 4;
		this.pixelIsBG = false;
	} else {
		this.pixelColor = this.cData & 0x0f;
		this.pixelIsBG = true;
	}
}

vic2.renderMultiColorBitmapMode = function() {
	switch (this.gData >> (this.pixelBit & 6) & 3) {	// two bits every two pixels
		case 0: this.pixelColor = this.backgroundColor; this.pixelIsBG = true;  break;
		case 1: this.pixelColor = this.cData >> 4;      this.pixelIsBG = true;  break;		// 01 considered background for collisions
		case 2: this.pixelColor = this.cData & 0x0f;    this.pixelIsBG = false; break;
		case 3: this.pixelColor = this.colorData;       this.pixelIsBG = false; break;
	}
}

vic2.renderExtendedColorCharacterMode = function() {
	if (this.gData & 1 << this.pixelBit) {
		this.pixelColor = this.colorData;
		this.pixelIsBG = false;
	} else {
		this.pixelColor = [this.backgroundColor, this.extraBackgroundColor1, this.extraBackgroundColor2, this.extraBackgroundColor3][this.cData >> 6];
		this.pixelIsBG = true;
	}
}

vic2.renderInvalidTextMode = function() {
	this.pixelColor = 0;	// always black
	this.pixelIsBG = true;	// FIXME even if invisible, this can generate spite collisions!
}

vic2.renderInvalidBitmapMode = function() {
	this.pixelColor = 0;	// always black
	this.pixelIsBG = true;	// FIXME even if invisible, this can generate spite collisions!
}

vic2.renderInvalidMulticolorBitmapMode = function() {
	this.pixelColor = 0;	// always black
	this.pixelIsBG = true;	// FIXME even if invisible, this can generate spite collisions!
}


vic2.renderSprites = function() {
	var firstCollider = null;

	for (var z = 7; z >= 0; z--) {
		var sprite = this.sprites[z];

		if (sprite.dma) {
			var dx = this.xPos - sprite.x >> sprite.doubleWidth;

			if (dx >= 0 && dx < 24) {
				var colorBits, color;

				if (sprite.multicolor) {
					if (colorBits = (sprite.data[dx >> 3] >> (7 - dx & 6)) & 3)
						color = [-1, this.extraSpriteColor1, sprite.color, this.extraSpriteColor2][colorBits];
				} else if (colorBits = (sprite.data[dx >> 3] >> (7 - dx & 7)) & 1) {
					color = sprite.color;
				}

				if (colorBits) {
					if (!sprite.isBehindContents || this.pixelIsBG)	// is this sprite pixel visible?
						this.pixelColor = color;

					// sprite to sprite collision
					if (firstCollider) {
						firstCollider.collisionSprite = true;
						if (!sprite.collisionSprite) {
							sprite.collisionSprite = true;
							this.interruptRegister.events.spriteSpriteCollisionOccurred = true;
							if (this.interruptRegister.mask.spriteSpriteCollisionEnabled)
								mos6510.irq = true;
						}
					} else {
						firstCollider = sprite;
					}

					// sprite to background collision detection
					if (!this.pixelIsBG) {
						if (!sprite.collisionBackground) {
							sprite.collisionBackground = true;
							this.interruptRegister.events.spriteBackgroundCollisionOccurred = true;
							if (this.interruptRegister.mask.spriteBackgroundCollisionEnabled)
								mos6510.irq = true;
						}
					}
				}
			}
		}
	}
}


// process one vic clock cycle. line: 0..311, cycle: 1..63
vic2.process = function(line, cycle) {

	var activeSprite = null;

	// calculate coordinates relative to border start (= sprite coordinates)
	this.yPos = line - 14;
	this.xPos = ((cycle - 13) * 8) + (cycle < 13 ? 504 : 0);

	this.badLine = (line >= 48 && line < 248 && ((line & 7) == this.screenControlRegister.yScroll));

	this.cycleTypeVIC = this.lineTimings[this.badLine|0].charAt((cycle - 1) * 2);
	this.cycleTypeCPU = this.lineTimings[this.badLine|0].charAt((cycle - 1) * 2 + 1);

	if (cycle >= 55 || cycle < 8) {		// ckeck for X cycles (CPU stunned on read), they occur 3 cycles before a sprite's DMA turns on
		for (var i = 0; i < 3; ++ i) {	// note: up to two sprites can influence a single cycle (example: cycle 61 sprite 2 and 3)
			var spriteNo = parseInt(this.lineTimings[0].charAt((cycle + i) * 2));
			if (!isNaN(spriteNo) && this.sprites[spriteNo].dma)
				this.cycleTypeCPU = 'X';
		}
	}

	if (cycle >= 58 || cycle < 11) {	// ckeck for s cycles (CPU always stunned), they occur twice during each sprite's DMA
		var sprite_cycle = cycle >= 58 ? cycle - 58 : cycle + 5;
		var sprite = this.sprites[sprite_cycle >> 1];
		if (sprite && sprite.dma) {
			activeSprite = sprite;
			this.cycleTypeVIC = sprite_cycle &  1 ? 's' : sprite.id;	// 0L:pointer 1L:data
			this.cycleTypeCPU = 's';									// 0H:data    1H:data
		} else {
			this.cycleTypeVIC = sprite_cycle &  1 ? 'i' : sprite.id;	// 0L:pointer 1L:idle
		}
	}


	// a new frame has started
	if (!line && (cycle == 1)) {
		this.vcBase = 0;
		this.displayState = false;
		this.sideBorderHack = 0;
	}

	// at the beginning of each raster line:
	if (cycle == 1) {
		this.screenControlRegister.currentRasterLine = line;
	} else if (cycle == 2) {
		this.screenControlRegister.currentRasterLine = line;

		// check for raster interrupt	// does IRQ happen here or at xPos 0 aka cycle 13 ?
		if (line == this.screenControlRegister.interruptRasterLine) {
			this.interruptRegister.events.rasterLineOccurred = true;
			if (this.interruptRegister.mask.rasterLineEnabled)
				mos6510.irq = true;
		}

	} else if (cycle == 63) {
		// turn vBorder flag on/off depending on line and screenHeight
		if (line == (this.screenControlRegister.screenHeight ? 51 : 55) && this.screenControlRegister.screenOn)	// top (3)
			this.vBorder = false;
		else if (line == (this.screenControlRegister.screenHeight ? 251 : 247))	// bottom (2)
			this.vBorder = true;
	}


	// vertical blanking starts at line 286 and ends at line 13. During that time, nothing is ever rendered.
	if (line >= 14 && line < 286) {	// inside canvas?

		if (cycle == 14) {
			this.vc = this.vcBase;
			this.vmli = 0;
			if (this.badLine) {
				this.displayState = true;
				this.rc = 0;
			}
		} else if (cycle == 15) {
			for (var z = 7; z >= 0; z--) {
				var sprite = this.sprites[z];
				if (sprite.yex)
					sprite.mcbase = sprite.mcbase + 2;
			}
		} else if (cycle == 54) {	// FIXME this is supposed to happen in cycle 16. But putting it to cycle 54 fixes SCA's northstar intro and Attack of the Mutant Camels. So be it.
			for (var z = 7; z >= 0; z--) {
				var sprite = this.sprites[z];
				if (!sprite.doubleHeight)
					sprite.yex = true;

				if (sprite.yex)
					sprite.mcbase++;

				if (sprite.mcbase == 63)
					sprite.dma = false;
			}
		} else if (cycle == 55 || cycle == 56) {
			for (var z = 7; z >= 0; z--) {
				var sprite = this.sprites[z];
				if (cycle == 55 && sprite.doubleHeight)
					sprite.yex = !sprite.yex;
				if (sprite.enabled && sprite.y == (line & 0xff) && !sprite.dma) {
					sprite.dma = true;
					sprite.mcbase = 0;
					if (sprite.doubleHeight)
						sprite.yex = false;
				}
			}
		} else if (cycle == 58) {
			if (this.rc == 7) {
				this.vcBase = this.vc;
				if (!this.badLine)
					this.displayState = false;
			}
			this.rc = (this.rc + 1) & 7;

			for (var z = 7; z >= 0; z--) {
				var sprite = this.sprites[z];
				sprite.mc = sprite.mcbase;
			}
		}


		// Sprite DMA: Data pointers are always read, data bytes are read only if sprite is enabled
		if (activeSprite) {
			if (this.cycleTypeVIC == activeSprite.id) {	// 1st vic + cpu cycle
				sprite.pointer = memoryManager.readByteVIC(this.memorySetupRegister.pointerToScreenMemory + 0x3f8 + sprite.id) << 6;
				if (sprite.dma) {
					sprite.data[0] = memoryManager.readByteVIC(sprite.pointer + sprite.mc++);
				}
			} else if (sprite.dma) {						// 2nd vic + cpu cycle
				sprite.data[1] = memoryManager.readByteVIC(sprite.pointer + sprite.mc++);
				sprite.data[2] = memoryManager.readByteVIC(sprite.pointer + sprite.mc++);
			}
		}


		// horizontal blanking occurs between cycles 60 and 10 (first 87 pixels of a line)
		if (cycle >= 12 && cycle < 60) {

			// loop through all 8 pixels of this cycle
			for (var x = 0; x < 8; ++x) {

				// at left/right border boundaries: calculate vBorder and mainBorder flags
				if (this.xPos == (this.screenControlRegister.screenWidth ? 24 : 31)) {	// left
					if (line == (this.screenControlRegister.screenHeight ? 51 : 55) && this.screenControlRegister.screenOn)		// top
						this.vBorder = false;
					else if (line == (this.screenControlRegister.screenHeight ? 251 : 247))		// bottom
						this.vBorder = true;
					if (!this.vBorder)				// reset mainBorder if vBorder is not set
						this.mainBorder = false;
				} else if (this.xPos == (this.screenControlRegister.screenWidth ? 344 : 335)) {	// right
					if (this.sideBorderHack < 2)
						this.mainBorder = true;
					this.sideBorderHack = 0;
				}

				if (this.cycleTypeVIC == 'g' && x == this.screenControlRegister.xScroll) {	// cycles 15-55: display dma at current xScroll

					if (this.displayState) {
						// c (video ram) and color ram dma only occurs in displayState on bad lines.
						if (this.badLine) {
							this.videoMatrixLine[this.vmli] = memoryManager.readByteVIC(this.memorySetupRegister.pointerToScreenMemory + this.vc);
							this.colorMatrixLine[this.vmli] = memoryManager.readColorRAMVIC(this.vc);
						}

						this.cData = this.videoMatrixLine[this.vmli];
						this.colorData = this.colorMatrixLine[this.vmli];

						// g (bitmap or char) dma occurs always.
						if (this.screenControlRegister.bitmapMode)
							this.gData = memoryManager.readByteVIC(this.memorySetupRegister.pointerToBitmapMemory + (this.vc << 3) + this.rc);
						else if (this.screenControlRegister.extendedBackground)
							this.gData = memoryManager.readByteVIC(this.memorySetupRegister.pointerToCharMemory + ((this.cData & 0x3f) << 3) + this.rc);
						else
							this.gData = memoryManager.readByteVIC(this.memorySetupRegister.pointerToCharMemory + (this.cData << 3) + this.rc);

						this.vc++;
						this.vmli++;

					} else {	// idleState

						this.cData = 0;
						this.colorData = 0;

						// In idleState, gData is always read from $3fff (or $39ff in ECM)
						this.gData = memoryManager.readByteVIC(this.pointerToIdleMemory);
					}
				}

				if (!this.mainBorder) {
					this.pixelBit = (this.screenControlRegister.xScroll - x - 1) & 7 ;
					this.renderPixel();
					this.renderSprites();
				} else {
					this.pixelColor = this.borderColor;
				}

				var color = this.colorPalette[this.pixelColor];
				var position = (this.yPos * 384 + this.xPos - (cycle < 13 ? 504 : 0) + 8) * 4;		// xPos + 8 because 1st pixel of visible area is at coordinate -8 (=1f0, cycle 12)
				this.imageData[position + 0] = (color & 0xff0000) >> 16;	// red
				this.imageData[position + 1] = (color & 0x00ff00) >> 8;		// green
				this.imageData[position + 2] = (color & 0x0000ff);			// blue
				this.imageData[position + 3] = 0xff;						// alpha

				this.xPos++;

			}	// end of pixel loop

			this.xPos -= 8;	// when we return xPos is always the 1st pixel of char
		}
	}
}
