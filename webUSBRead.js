let device;

function concatTypedArrays(a, b) {
	var c = new (a.constructor)(a.length + b.length)
	c.set(a,0);
	c.set(b, a.length);
	return c;
}

function buf2hex(buffer){
	return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
}

async function cardPoll(){
	while (true){
		console.log("listening")
		//await device.transferOut(2,powerOn)
		let x = await device.transferIn(1,64)
		if (x.data){
			response = new Uint8Array(x.data.buffer)			
			if (response[1] === 3){
				console.log("Card added")
				autoRead();
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
	
}
async function autoRead(){
	let sectors = [0x2c, 0x30, 0x34, 0x38, 0x3c]
		// Change slice index depending on number of fields, bad fixed value for now
		var message = []
		for (let readBlock of sectors.slice(0,3)){
			cardAuth = new Uint8Array([0x6F, 0x06, 0x00, 0x00, 0x00, 0x00, 0x10, 0x00, 0x00, 0x00, 0xFF, 0x88, 0x00, readBlock, 0x60, 0x00])
			//console.log("Authenticating sector "+readBlock)
			//console.log(cardAuth)
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
				//console.log("y "+y)
				dataRead = new Uint8Array([0x6F, 0x05, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xB0, 0x00, readBlock+y, 0x10])
				//console.log("Reading from "+(readBlock+y))				
				//console.log(dataRead)
				await device.transferOut(2,dataRead)
				var x = await device.transferIn(2,128)
				var unsignedView = new Uint8Array(x.data.buffer)
				console.log(unsignedView)
				if (unsignedView[unsignedView.length - 2] == 144){
					wholeData = concatTypedArrays(wholeData, unsignedView.slice(10, unsignedView.length -2))
					//alert("Read successful: " + buf2hex(unsignedView.slice(10, unsignedView.length -2)))		
				} else {
					//alert("Read error!")		
				}

			}
			//console.log(wholeData)
			message.push(wholeData)

		}
		//console.log(message)
		let decoder = new TextDecoder('utf-8')
		for (var text of message){
			text = text.slice(0, text.indexOf(0))
			alert(decoder.decode(text))
		}

		/*let content = document.getElementById("reader").value
		content = parseInt(content, 10)
		console.log(content)
		// Authenticate to block 0, sector 0 using key @ 0
		
		*/

}




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
		cardPoll();


	})
})
