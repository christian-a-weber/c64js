var cpuMemoryManager = cpuMemoryManager || {};

cpuMemoryManager.memoryMode = 0x1f;						// Bit 2: *CHAREN, Bit 1: *HIRAM, Bit 0: *LORAM

cpuMemoryManager.init = function() {
	memoryManager.ram.onWriteByte(0x0000, 0x2f);		// Data Direction Register
	memoryManager.ram.onWriteByte(0x0001, 0x1f);		// Processor port
};

cpuMemoryManager.readByte = function(address) {
	
	/* Kernel ROM if *HIRAM is 1 */
	if (address >= 0xe000 && this.memoryMode & 0x02) {
		return memoryManager.kernel.onReadByte(address);
	}
	
	/* Basic ROM if *LORAM and *HIRAM are both 1 */
	if (address >= 0xa000 && address < 0xc000 && (this.memoryMode & 0x03) == 0x03) {
		return memoryManager.basic.onReadByte(address);
	}

	/* Character ROM or IO chips if *HIRAM or *LORAM is 1 */
	if (address >= 0xd000 && address < 0xe000 && this.memoryMode & 0x03) {
		return this.memoryMode & 0x04 ? memoryManager.io.onReadByte(address) : memoryManager.character.onReadByte(address - 0xd000);
	}
	
	return memoryManager.ram.onReadByte(address);
};

cpuMemoryManager.writeByte = function(address, data) {

	/* IO chips if CHAREN && (HIRAM | LORAM) */
	if (address >= 0xd000 && address < 0xe000 && (this.memoryMode & 0x07) >= 0x05) {
		return memoryManager.io.onWriteByte(address, data);
	}
	
	/* Bank switching */
	if (address == 0x0001) {
		memoryManager.ram.onWriteByte(0x0001, memoryManager.ram.onReadByte(0x0000) & memoryManager.ram.onReadByte(0x0001));   
		this.memoryMode = 0x18 | data & 0x07;
	}

	return memoryManager.ram.onWriteByte(address, data);
};
