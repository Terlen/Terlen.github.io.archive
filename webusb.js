function buf2hex(buffer){
	return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
}

function concatTypedArrays(a, b) {
	var c = new (a.constructor)(a.length + b.length)
	c.set(a,0);
	c.set(b, a.length);
	return c;
}

/*async function writeToCard(data) {

	await device.transferOut(2,data)
	var x = await device.transferIn(2,64)
	//var unsignedView = new Uint8Array(x.data.buffer)
	console.log(unsignedView)
	if (unsignedView[unsignedView.length - 2] == 144){
		alert("Write successful to block")		
	} else {
		alert("Write failed to block")		
	}

}*/

/*async function cardPoll(){
	while (true){
		console.log("listening")
		//await device.transferOut(2,powerOn)
		let x = await device.transferIn(1,64)
		if (x.data){
			response = new Uint8Array(x.data.buffer)			
			if (response[1] === 3){
				console.log("Card added")
			} else if (response[1] === 2){
				console.log("Card removed")
			}
		
			
		}

		if (x.status === 'stall'){
			console.log('Endpoint Stalled');
			await device.clearHalt(1);
		}
		//var unsignedView = new Uint8Array(x.data.buffer)
		//if (unsignedView[unsignedView.length - 4] != 129){
		//	alert("Card Detected: ATR = "+buf2hex(unsignedView.slice(10)))
		//}
		//console.log(unsignedView)


	}
	
}*/

/*async function deviceConnect(){
	const VENDOR_ID = 0x072F

		try {
			device = await navigator.usb.requestDevice({
				filters: [{
					vendorID: VENDOR_ID				
				}]
			})
			console.log('open')
			await device.open()
			console.log('opened: ',device)
			await device.selectConfiguration(1)
			console.log('Configuration selected')
			await device.claimInterface(0)
			console.log('Claimed interface',device.configuration.interfaces[0])
			
		} catch (error) {
			console.log(error)
		}
		//cardPoll();
			//await device.close()
}*/

let seqNum = 0x00
let device
document.addEventListener('DOMContentLoaded', event => {



	let connectButton = document.querySelector("#webUsbConnect");

	connectButton.addEventListener('click', async() => {
		
		const VENDOR_ID = 0x072F

		try {
			device = await navigator.usb.requestDevice({
				filters: [{
					vendorID: VENDOR_ID				
				}]
			})
			console.log('open')
			await device.open()
			console.log('opened: ',device)
			await device.selectConfiguration(1)
			console.log('Configuration selected')
			await device.claimInterface(0)
			console.log('Claimed interface',device.configuration.interfaces[0])
			
		} catch (error) {
			console.log(error)
		}
			//await device.close()
		
		//Polling code for PRESENTER / READ ONLY page
		//cardPoll();


	})

	let powerButton = document.querySelector("#powerOn");
	powerButton.addEventListener('click', async() => {
		powerOn = new Uint8Array([0x62,0x00,0x00,0x00,0x00,0x00,seqNum,0x00,0x00, 0x00])
		await device.transferOut(2,powerOn)
		var x = await device.transferIn(2,64)
		var unsignedView = new Uint8Array(x.data.buffer)
		if (unsignedView[unsignedView.length - 4] == 129){
			alert("No smart card detected!")
		} else{
			alert("Card Detected: ATR = "+buf2hex(unsignedView.slice(10)))
			
		}	
		console.log(unsignedView)
		console.log('POWER ON')			
		//await device.close()			
		//powerOff = new Uint8Array([0x63,0x00,0x00,0x00,0x00,0x00,0x00])
		//await device.transferOut(2,powerOff)			
		//console.log('Power off')
		
		//x = await device.transferIn(2,64)
		//console.log(x)
	

	})
	
	let loadKey = document.querySelector("#keyLoad");
	loadKey.addEventListener('click', async() => {
		keyLoad = new Uint8Array([0x6F, 0x0B, 0x00, 0x00, 0x00, 0x00, 0x0F, 0x00, 0x00, 0x00, 0xFF, 0x82, 0x00, 0x00, 0x06, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF])
	await device.transferOut(2,keyLoad)
	var x = await device.transferIn(2,64)
	var unsignedView = new Uint8Array(x.data.buffer)
	if (unsignedView[unsignedView.length - 2] == 144){
		alert("Key loaded into memory")
	} else {
		alert("Error loading authentication keys")
	}
	console.log(x)

	})

	let readData = document.querySelector("#dataRead");
	readData.addEventListener('click', async() => {
		let sectors = [0x2c, 0x30, 0x34, 0x38, 0x3c]
		// Change slice index depending on number of fields, bad fixed value for now
		var message = []
		for (let readBlock of sectors.slice(0,3)){
			cardAuth = new Uint8Array([0x6F, 0x06, 0x00, 0x00, 0x00, 0x00, 0x10, 0x00, 0x00, 0x00, 0xFF, 0x88, 0x00, readBlock, 0x60, 0x00])
			console.log("Authenticating sector "+readBlock)
			console.log(cardAuth)
			await device.transferOut(2,cardAuth)
			var x = await device.transferIn(2,64)
			var unsignedView = new Uint8Array(x.data.buffer)
			//console.log(unsignedView)
			if (unsignedView[unsignedView.length - 2] == 144){
				//alert("Read access granted to sector "+readBlock)		
			} else {
				//alert("Read access denied!")		
			}
			var wholeData = new Uint8Array([])
			for (var y = 0; y < 3; y++){
				console.log("y "+y)
				dataRead = new Uint8Array([0x6F, 0x05, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xB0, 0x00, readBlock+y, 0x10])
				console.log("Reading from "+(readBlock+y))				
				console.log(dataRead)
				await device.transferOut(2,dataRead)
				var x = await device.transferIn(2,128)
				var unsignedView = new Uint8Array(x.data.buffer)
				console.log(unsignedView)
				if (unsignedView[unsignedView.length - 2] == 144){
					wholeData = concatTypedArrays(wholeData, unsignedView.slice(10, unsignedView.length -2))
					alert("Read successful: " + buf2hex(unsignedView.slice(10, unsignedView.length -2)))		
				} else {
					alert("Read error!")		
				}

			}
			console.log(wholeData)
			message.push(wholeData)

		}
		console.log(message)
		let decoder = new TextDecoder('utf-8')
		for (var text of message){
			text = text.slice(0, text.indexOf(0))
			console.log(decoder.decode(text))
		}

		/*let content = document.getElementById("reader").value
		content = parseInt(content, 10)
		console.log(content)
		// Authenticate to block 0, sector 0 using key @ 0
		
		*/
	})

	let writeData = document.querySelector("#dataWrite");
	writeData.addEventListener('click', async() => {
		let content = document.getElementById("text").value
		let fields = content.split('|')
		//console.log(fields)
		var encoder = new TextEncoder();
		fields.forEach(function (value, index) {
			let zeroPad = new Uint8Array(48 - encoder.encode(fields[index]).length)
			fields[index] = concatTypedArrays(encoder.encode(fields[index]), zeroPad)
		})
		//console.log(fields)
		let blockData = []
		fields.forEach(function (value, index) {
			for (var i = 0; i < 3; i++){ 			
				blockData.push(value.slice(16*i,16*(i+1)))
			}
			//console.log(blockData)
		})
		let sectors = [0x2c, 0x30, 0x34, 0x38, 0x3c]
		sectors = sectors.slice(0,fields.length)
		//console.log(sectors)
		var i = 0;
		
		for (let writeBlock of sectors){
			var t = 0;
			//console.log("Sector "+i+" block "+writeBlock)
			cardAuth = new Uint8Array([0x6F, 0x06, 0x00, 0x00, 0x00, 0x00, 0x10, 0x00, 0x00, 0x00, 0xFF, 0x88, 0x00, writeBlock, 0x60, 0x00])
			await device.transferOut(2,cardAuth)
			var x = await device.transferIn(2,64)
			var unsignedView = new Uint8Array(x.data.buffer)
			//console.log("Auth response sector "+sector+unsignedView)
			if (unsignedView[unsignedView.length - 2] == 144){
				//alert("Write access granted to block "+writeBlock)		
			} else {
				//alert("Write access denied to block "+writeBlock)		
			}
			//console.log(blockData.slice(3*i, 3*(i+1)))
			for (let dataBlock of blockData.slice(3*i, 3*(i+1))){
				//console.log(dataBlock)
				//console.log("Writing to block "+writeBlock+t)
				dataWriteHeader = new Uint8Array([0x6F, 0x15, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xD6, 0x00, writeBlock+t, 0x10])
				dataWrite = concatTypedArrays(dataWriteHeader, dataBlock)
				//console.log(dataWrite)
				await device.transferOut(2,dataWrite)
				var x = await device.transferIn(2,64)
				var unsignedView = new Uint8Array(x.data.buffer)
				//console.log(unsignedView)
				if (unsignedView[unsignedView.length - 2] == 144){
					//alert("Write successful to block")		
				} else {
					//alert("Write failed to block")		
				}
				dataRead = new Uint8Array([0x6F, 0x05, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xB0, 0x00, 0x04, 0x10])
				await device.transferOut(2,dataRead)
				var x = await device.transferIn(2,128)
				var unsignedView = new Uint8Array(x.data.buffer)
				//console.log(unsignedView)
				if (unsignedView[unsignedView.length - 2] == 144){
					//alert("Read successful: " + buf2hex(unsignedView.slice(10, unsignedView.length -2)))		
				} else {
					//alert("Read error!")		
				}
			t++;
			}
			i++;
		}
		
		
		/*
		
		console.log(dataWrite)
		await device.transferOut(2,dataWrite)
		var x = await device.transferIn(2,64)
		//var unsignedView = new Uint8Array(x.data.buffer)
		console.log(unsignedView)
		if (unsignedView[unsignedView.length - 2] == 144){
			alert("Write successful to block")		
		} else {
			alert("Write failed to block")		
		}
		/*for (var sector = 13; sector < fields.length+13; sector++){
			cardAuth = new Uint8Array([0x6F, 0x06, 0x00, 0x00, 0x00, 0x00, 0x10, 0x00, 0x00, 0x00, 0xFF, 0x88, 0x00, sector*4, 0x60, 0x00])
			await device.transferOut(2,cardAuth)
			var x = await device.transferIn(2,64)
			var unsignedView = new Uint8Array(x.data.buffer)
			console.log("Auth response sector "+sector+unsignedView)
			if (unsignedView[unsignedView.length - 2] == 144){
				alert("Write access granted to block"+sector*4)		
			} else {
				alert("Write access denied to block"+sector*4)		
			}
			sectorBlock = blockData.slice(fields.length*sector,fields.length*(sector+1))
			console.log("sector "+sector)
			console.log(sectorBlock)
			sectorBlock.forEach(async function (value, index) {
				dataWriteHeader = new Uint8Array([0x6F, 0x16, 0x00, 0x00, 0x00, 0x00, 0x10, 0x00, 0x00, 0x00, 0xFF, 0xD6, 0x00, index+(sector*4), 0x10])
				dataWrite = concatTypedArrays(dataWriteHeader, value)
				//console.log("Write header "+sector+" "+indexdataWrite)
				console.log("Data + header")				
				console.log(dataWrite)
				await writeToCard(dataWrite)
			})
		}*/
		

	








	})
	//powerOn = new Uint8Array([0x62,0x00,0x00,0x00,0x00,0x00,seqNum,0x00,0x00, 0x00])
	

	//deviceConnect();
	//while (true){
	//	deviceConnect()
	//	cardPoll()
	//}


})




