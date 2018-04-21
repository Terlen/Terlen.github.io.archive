function buf2hex(buffer){
	return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
}


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



	})

	let powerButton = document.querySelector("#powerOn");
	powerButton.addEventListener('click', async() => {
		powerOn = new Uint8Array([0x62,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00, 0x00])
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




})




