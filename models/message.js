const mongoose = require('mongoose')

const MessageSchema = mongoose.Schema({
    name: String,
    author: String,
    when: Date,
    msgtype: String,
    message: String,
    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room'
    }
})

const Message = mongoose.model('Message', MessageSchema)

module.exports = Message