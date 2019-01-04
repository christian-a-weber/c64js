var memoryManager = memoryManager || {};
memoryManager.io = {};

memoryManager.io.colorRam = [];

memoryManager.io.onWriteByte = function(address, data) {
	
	/* VIC-II */
	if (address >= 0xd000 && address <= 0xd3ff) {
		vic2.onWriteByte(address, data);
	}
	
	/* SID */
	if (address >= 0xd400 && address <= 0xd7ff) {
		sid.onWriteByte(address, data);
	}
	
	/* Color ram */
	if (address >= 0xd800 && address <= 0xdbff) {
		memoryManager.io.colorRam[address - 0xd800] = data & 0x0f;
	}
	
	/* CIA 1 */
	if (address >= 0xdc00 && address <= 0xdcff) {
		memoryManager.cia1.onWriteByte(address, data);
	} 
	
	/* CIA 2 */
	if (address >= 0xdd00 && address <= 0xddff) {
		memoryManager.cia2.onWriteByte(address, data);
	} 
	
};

memoryManager.io.onReadByte = function(address) {
	
	/* VIC-II */
	if (address >= 0xd000 && address <= 0xd3ff) {
		return vic2.onReadByte(address);
	}
	
	/* SID */
	if (address >= 0xd400 && address <= 0xd7ff) {
		return sid.onReadByte(address);
	}
	
	/* Color ram */
	if (address >= 0xd800 && address <= 0xdbff) {
		return memoryManager.io.colorRam[address - 0xd800];
	}
	
	/* CIA 1 */
	if (address >= 0xdc00 && address <= 0xdcff) {
		return memoryManager.cia1.onReadByte(address);
	} 
	
	/* CIA 2 */
	if (address >= 0xdd00 && address <= 0xddff) {
		return memoryManager.cia2.onReadByte(address);
	} 
		
};
