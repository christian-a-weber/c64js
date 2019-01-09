var memoryManager = memoryManager || {};
memoryManager.cia2 = memoryManager.cia2 || {};

memoryManager.cia2.vicBankRawByte = 0x00;
memoryManager.cia2.vicBankMask = 0x00;

memoryManager.cia2.setVicBank = function(data) {
	
	memoryManager.cia2.vicBankRawByte = data;
	
	var config = (data & memoryManager.cia2.vicBankMask) & 0x03;
	var address = 0xc000 - (config * 0x4000);
	
	memoryManager.vicBankAddress = address;
	
	if ((config & 0x01) == 0x01) {
		memoryManager.vicCharROMEnabled = true;
	
		if ((config & 0x02) == 0x02)
			memoryManager.vicCharROMAddress = 0x1000;
		else
			memoryManager.vicCharROMAddress = 0x9000;
			
	} else {
		memoryManager.vicCharROMEnabled = false;
	}
	
};

memoryManager.cia2.onWriteByte = function(address, data) {
	switch(address & 0x000f) {	// registers are repeated every 16 bytes
		case 0x00:
			this.setVicBank(data);
			break;
		case 0x02:
			memoryManager.cia2.vicBankMask = data;
			break;
		default:
			console.log('unhandled write ' + data.toString(16) + ' to cia2 ' + address.toString(16));
			break;
	}
};

memoryManager.cia2.onReadByte = function(address) {
	switch(address & 0x000f) {
		case 0x00:
			return memoryManager.cia2.vicBankRawByte;
		case 0x02:
			return this.vicBankMask;
		default:
			console.log('unhandled read from cia2: ' + address.toString(16));
			break;
	}
};

memoryManager.cia2.process = function(clockTicksElapsed) {
	// mos6510.nmi = true;
};
