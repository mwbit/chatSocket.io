const express = require('express')
const mongoose = require('mongoose')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)
const bodyParser = require('body-parser')
const session = require('express-session')
const shareSession = require('express-socket.io-session')
const Room = require('./models/room')
const Message = require('./models/message')

const uri = 'mongodb://localhost:27017/chat-socketio'

app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }))

const expressSession = session({
    secret: 'socket.io',
    cookie: {
        maxAge: 10 * 60 * 1000
    }
})

app.use(expressSession)
io.use(shareSession(expressSession, { autoSave: true }))
// io.use((socket,next) => {
//     const session = socket.handshake.session
//     if (!session.user){
//         next(new Error("Auth failed."))
//     }else{
//         next
//     }
// })


app.set("view engine", 'ejs')

app.get('/', (req, res) => {
    res.render('home')
})

app.post('/', (req, res) => {
    req.session.user = {
        name: req.body.name
    }
    res.redirect('/room')
})

app.get('/room', (req, res) => {

    if (!(req.session.user)) {
        res.redirect('/')
    } else {
        res.render('room', {
            name: req.session.user.name
        })
    }
})


io.on('connection', socket => {

    Room.find({}, (err, rooms) => {
        socket.emit('roomList', rooms)
    })

    socket.on('addRoom', roomName => {
        const room = new Room({
            name: roomName
        })

        room
            .save()
            .then(() => {
                io.emit('newRoom', room)
            })
    })

    socket.on('join', roomId => {
        socket.join(roomId)
        Message
            .find({ room: roomId })
            .then((msgs) => {
                socket.emit('msgsList',msgs)
            })
    })

    socket.on('sendMsg', msg => {
        const message = new Message({
            author: socket.handshake.session.user.name,
            when: new Date(),
            msgtype: 'text',
            message: msg.msg,
            room: msg.room
        })
        message
            .save()
            .then(() => {
                io.to(msg.room).emit('newMsg', message)
            })
    })

    socket.on('sendAudio', msg => {
        const message = new Message({
            author: socket.handshake.session.user.name,
            when: new Date(),
            msgtype: 'audio',
            message: msg.data,
            room: msg.room
        })
        message
            .save()
            .then(() => {
                io.to(msg.room).emit('newAudio', message)
            })
    })

})

mongoose
    .connect(uri, { useNewUrlParser: true })
    .then(() => {
        http.listen(3000, () => console.log('Chat running...'))
    })

