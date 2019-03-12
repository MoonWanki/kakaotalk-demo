const uuidv4 = require('uuid/v4')
const Room = require('./Room')

class Lobby {

    constructor() {
        this.users = new Array()
        this.rooms = new Array()
    }

    register(user) {
        this.users.push(user)
        this.users.forEach(user => { if(user.isOnline) this.notifyUserStatusTo(user) })
    }

    join(user) {
        console.log(`${user.nickname}님이 채팅에 접속하였습니다.`)
        user.isOnline = true
        user.socket.on('create_room', () => this.createRoom(user))
        user.socket.on('join_room', roomId => this.onUserJoinRoom(user, roomId))
        user.socket.on('leave_room', roomId => this.onUserLeaveRoom(user, roomId))
        user.socket.on('disconnect', reason => this.leave(user))

        user.socket.emit('login_success')
        user.notifyRoomStatus()
    }

    leave(user) {
        user.isOnline = false
        user.socket = null
        console.log(`${user.nickname}님이 채팅을 종료하였습니다.`)
    }

    kick(user) {
        user.socket.emit('disconnected_by_reconnection')
        this.leave(user)
    }

    createRoom(owner) {
        const uuid = uuidv4()
        const newRoom = new Room(uuid)
        newRoom.join(owner)
        this.rooms.push(newRoom)
        owner.notifyRoomStatus()
    }

    onUserJoinRoom(user, roomId) {
        const room = user.findRoomById(roomId)
        room.join(user)
        user.notifyRoomStatus()
    }

    onUserLeaveRoom(user, roomId) {
        user.notifyRoomStatus()
    }

    notifyUserStatusTo(user) {
        const userStatus = this.users.map(user => ({
            id: user.id,
            nickname: user.nickname,
        }))
        user.socket.emit('user_status', userStatus)
    }
    
    findUserById(id) {
        return this.users.find(user => id === user.id)
    }
}

module.exports = Lobby