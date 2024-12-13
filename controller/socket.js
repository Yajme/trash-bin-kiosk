import {Server} from 'socket.io';
import cache from 'memory-cache';
let io;
const initSocket = (server, callback) =>{
    
io = new Server(
    server, {
        cors : {
            origin: "http://localhost:8080", // Replace with your actual front-end URL
            methods: ["GET", "POST"],
        }
    }
);


io.on('connection',
    (socket) => {
        console.log(`User connected: ${socket.id}`);
        //emit message from server to user
        
         // Join a room
         socket.join('room1');
        

        // listen for message from user
        socket.on('createMessage',
            (newMessage) => {
                console.log('newMessage', newMessage);
            });
        socket.on('serial-command',(command)=>{
            console.log('command:', command);
            if(command.category){
                callback.sendCommand(`${command.category} ${command.angle}`);
            }

            if(command.conveyor_status){
                callback.sendCommand(command.conveyor_status);
            }
            
        });
        socket.on('begin-process',
            (message)=>{
                //Production directory = /home/pi/Desktop/picam_test.py
                callback.run('/home/yajme/demo.py').then((jsonData) => {
                    
                    let records = cache.get('records') ?? [];
                    if(records && records instanceof Array){
                        records.push(jsonData[0]);
                        cache.put('records',records);
                    }else{
                        records.push(jsonData[0]);
                        cache.put('records',records);
                    }
                    const category = jsonData[0].category;
                    callback.runConveyorBelt(category,callback.sendCommand);
                    console.log(records);
                    socket.emit('records',{records: jsonData[0]});
                })
                .catch((error) => {
                    console.error('Error running Python script:', error);
                    socket.emit('error',{
                        error: error
                    });
                });
                console.log(message);
            }
        );
        // when server disconnects from user
        socket.on('disconnect',
            () => {
                console.log('disconnected from user');
            });
    });
}
    function QRcodeScanned(payload){
        console.log("payload:", payload);
        io.to('room1').emit('room-message', {from :'server', message: 'QR Code successfully scanned', step:'next', payload: payload});
    }


export {
    initSocket,
    QRcodeScanned
}