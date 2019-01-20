var memoryManager = memoryManager || {
	mainRAM:			null,		// 64 KB RAM
	colorRAM:			null,		//  1 KB x 4 color ram
	basicROM:			null,		//  8 KB
	charROM:			null,		//  4 KB
	kernelROM:			null,		//  8 KB

	memoryMode:			0x1f,		// Bit 2: *CHAREN, Bit 1: *HIRAM, Bit 0: *LORAM

	vicBankAddress:		0,			// 0x0000, 0x4000, 0x8000 or 0xC000
	vicCharROMEnabled:	true,
};

memoryManager.init = function() {

	this.mainRAM = new Uint8Array(65536);
	this.colorRAM = new Uint8Array(1096);

	this.basicROM = romDump.basic;
	this.kernelROM = romDump.kernel;
	this.charROM = romDump.character;

	this.writeByte(0x0000, 0x2f);		// Data Direction Register
	this.writeByte(0x0001, 0x1f);		// Processor i/o port
}


// Read a byte using the CPU
memoryManager.readByte = function(address) {

	// Kernel ROM if *HIRAM is 1
	if (address >= 0xe000 && this.memoryMode & 0x02) {
		return this.kernelROM[address & 0x1fff];
	}

	// Basic ROM if *LORAM and *HIRAM are both 1
	if (address >= 0xa000 && address < 0xc000 && (this.memoryMode & 0x03) == 0x03) {
		return this.basicROM[address & 0x1fff];
	}

	// Character ROM or IO chips if *HIRAM or *LORAM is 1
	if (address >= 0xd000 && address < 0xe000 && this.memoryMode & 0x03) {

		if (!(this.memoryMode & 0x04)) {					// *CHAREN ?
			return this.charROM[address & 0x0fff];
		}

		if (address >= 0xd000 && address <= 0xd3ff) {		// VIC-II
			return vic2.onReadByte(address);
		}

		if (address >= 0xd400 && address <= 0xd7ff) {		// SID
			return sid.onReadByte(address);
		}

		if (address >= 0xd800 && address <= 0xdbff) {		// Color RAM
			return this.colorRAM[address & 0x03ff] | 0xa0;	// TODO return the last data on the bus for the top 4 bits
		}

		if (address >= 0xdc00 && address <= 0xdcff) {		// CIA 1
			return memoryManager.cia1.onReadByte(address);
		}

		if (address >= 0xdd00 && address <= 0xddff) {		// CIA 2
			return memoryManager.cia2.onReadByte(address);
		}
	}

	if (this.mainRAM[address] === undefined)
		console.log("reading undefined from " + address.toString(16));

	return this.mainRAM[address];
}


// Write a byte using the CPU
memoryManager.writeByte = function(address, data) {

	// Bank switching
	if (address == 1) {
		this.mainRAM[1] = this.mainRAM[0] & data;
		this.memoryMode = 0x18 | data & 0x07;
	}

	// IO chips if CHAREN && (HIRAM | LORAM)
	if (address >= 0xd000 && address < 0xe000 && (this.memoryMode & 0x07) >= 0x05) {
		if (address >= 0xd000 && address <= 0xd3ff) {			// VIC-II
			vic2.onWriteByte(address, data);
		} else if (address >= 0xd400 && address <= 0xd7ff) {	// SID
			sid.onWriteByte(address, data);
		} else if (address >= 0xd800 && address <= 0xdbff) {	// Color RAM
			this.colorRAM[address & 0x03ff] = data & 0x0f;
		}

		if (address >= 0xdc00 && address <= 0xdcff) {		// CIA 1
			memoryManager.cia1.onWriteByte(address, data);
		}

		if (address >= 0xdd00 && address <= 0xddff) {		// CIA 2
			memoryManager.cia2.onWriteByte(address, data);
		}
	}

	this.mainRAM[address] = data;
}


// Read a byte using VIC
memoryManager.readByteVIC = function(address) {
	if (address & 0xc000)
		console.log("VIC read: address > 4000: " + address.toString(16) + " at " + mos6510.register.pc.toString(16));

	if (this.vicCharROMEnabled && address >= 0x1000 && address <= 0x1fff) {
		return this.charROM[address & 0x0fff];
	}

	return this.mainRAM[this.vicBankAddress + address];
}


// Read a nybble from the color ram
memoryManager.readColorRAMVIC = function(address) {
	return this.colorRAM[address & 0x03ff];
}
