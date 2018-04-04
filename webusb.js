document.addEventListener('DOMContentLoaded', event => {
	let connectButton = document.querySelector("#webUsbConnect");

	
connectButton.addEventListener('click', function() {
	navigator.usb.requestDevice({ filters: [{ vendorId: 0x072f }] })
	.then(device => {
	  console.log(device);      // "Arduino Micro"
	 // console.log(device.manufacturerName); // "Arduino LLC"
	 return device.open();
	})
	.catch(error => { console.log(error); })
	.then(() => device.selectConfiguration(1))
});
});