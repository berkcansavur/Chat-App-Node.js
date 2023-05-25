const path = require('path');
const express = require('express');
const http = require('http');
const socketio = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname,'../public');
const Filter = require('bad-words');
const {generateMessage,generateLocationMessage}=require('./utils/messages')
const {getUser,getUsersInRoom,addUser,removeUser}=require('./utils/users')
app.use(express.static(publicDirectoryPath))
io.on('connection',(socket)=>{
    console.log('New Websocket connection');
    socket.on('join',({username, room},callback)=>{
        const {error,user}=addUser({id:socket.id,username,room})
        if(error){
            return callback(error);
        }
        socket.join(user.room)
        socket.emit('message',generateMessage('Admin','Welcome to the Chat App !'));
        socket.broadcast.to(user.room).emit('message',generateMessage('Admin',`${user.username} has joined.`) )
        io.to(user.room).emit('roomData',{
            room:user.room,
            users:getUsersInRoom(user.room)
        })
        callback();
        
    })
    socket.on('sendMessage',(message,callback)=>{
        const user = getUser(socket.id)
        const filter = new Filter();
        if(filter.isProfane(message)){
            return callback('Profanity is not allowed !')
        }
        io.to(user.room).emit('message',generateMessage(user.username,message))
        callback('Delivered !');
    })
    socket.on('disconnect',()=>{
        const user = removeUser(socket.id);
        if(user){
            io.to(user.room).emit('message', generateMessage('Admin',`${user.username} has left`));
            io.to(user.room).emit('roomData',{
                room: user.room,
                users:getUsersInRoom(user.room)
            })
        }
    })
    socket.on('sendLocation',(coords,callback)=>{
        const user =getUser(socket.id)
        io.to(user.room).emit('locationMessage',generateLocationMessage(user.username,`https://www.google.com.tr/maps/place?q=${coords.latitude},${coords.longitude}`));
        callback('Locaiton Sended.');
    })
})
server.listen(port, ()=>{
    console.log(`Server is up on port ${port}`)
})
