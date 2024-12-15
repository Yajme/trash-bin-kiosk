import { io } from "https://cdn.socket.io/4.8.1/socket.io.esm.min.js";

  
const socket = io(
    "ws://localhost:80"
);

// connection with server
socket.on('connect', function () {
    console.log('Connected to Server');
});

// message listener from server
socket.on('room-message',
    function (message) {
        console.log(message);
        if(message.step === 'next'){
            console.log(message.payload.userId);
            window.location.href = `/process?user_id=${message.payload.userId}`;
        }
    });
socket.on('records',function(message){
    console.log(message);
    const records = message.records;
    table_component.style.display = 'block';
    const data = [records.category,records.weight,records.points];
    addRow(data);
    setTimeout(()=>{
        document.querySelector('#send-message').disabled = !document.querySelector('#send-message').disabled;
    },1500);
    loading.textContent='';
});
socket.on('error',function(message){
    console.log(message);
    const div = document.querySelector(".detected");
    div.textContent = message.error;
    document.querySelector('#send-message').disabled = !document.querySelector('#send-message').disabled;
    //const qrimage = document.querySelector('.image');
    //qrimage.style.display = 'block';
 
});
// when disconnected from server
socket.on('disconnect', function () {
    console.log('Disconnected from server');
});
const table_component= document.querySelector('.table_component');
const loading = document.querySelector('.loading');
document.addEventListener('DOMContentLoaded', function () {
    table_component.style.display = 'none';
});
document.getElementById('send-message').addEventListener('click',function(e){
    
    const button = e.target;
    const qrimage = document.querySelector('.image');
    qrimage.style.display = 'none';
    // Disable the button
    button.disabled = true;
    loading.textContent = 'Loading...';
  
    socket.emit('begin-process',
    {
        from : 'Client',
        message : 'Begin Classification'
    });
})
// Function to add a row to the table
function addRow(data) {
    const tableBody = document.querySelector('.table_component tbody'); // Get the tbody inside the table
  
    // Create a new row
    const newRow = document.createElement('tr');
  
    // Loop through the data array to create table cells (td) for each item
    data.forEach(item => {
      const cell = document.createElement('td');
      cell.textContent = item; // Set the text of the cell
      newRow.appendChild(cell); // Add the cell to the row
    });
  
    // Append the new row to the table body
    tableBody.appendChild(newRow);
  }
  