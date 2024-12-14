import { SerialPort, ReadlineParser } from 'serialport';


// Configure the serial port
let port;
const initSerial = () =>{
try{
    port = new SerialPort({
        path: '/dev/ttyACM0', // Replace with your serial port path
        baudRate: 9600,       // Match the baud rate with your Arduino
      });
       // Set up a parser to read data line by line
  const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));
   
  // Open the port and handle events
  port.on('open', () => {
    console.log('Serial Port Opened');
  });
  
  // Listen for data from the Arduino
  parser.on('data', (data) => {
    console.log(`Arduino: ${data.trim()}`);
  });
  
  // Handle errors
  port.on('error', (err) => {
    console.error('Serial Port Error:', err.message);
  });

}catch(error){
    console.log(error);
}
}
 let port_ultrasonic;
  const initSerialUltrasonic = () =>{
    try{
      port_ultrasonic = new SerialPort({
        path: '/dev/ttyACM1', // Replace with your serial port path
        baudRate: 19200, 
      });
           // Set up a parser to read data line by line
  const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));
   
  // Open the port and handle events
  port.on('open', () => {
    console.log('Serial Port Ultrasonic Opened');
  });
  
  // Listen for data from the Arduino
  parser.on('data', (data) => {
    console.log(`Arduino: ${data.trim()}`);
  });
  
  // Handle errors
  port.on('error', (err) => {
    console.error('Serial Port Error:', err.message);
  });
    }catch(error){
      console.log(error);
    }
  }
  // Function to send commands to the serial port
  function sendCommand(command) {
    console.log(`Sending: ${command}`);
    port.write(`${command}\n`, (err) => {
      if (err) {
        console.error('Error writing to serial port:', err.message);
      }
    });
  }
 
  
export {
    initSerial,
    initSerialUltrasonic,
    sendCommand
}