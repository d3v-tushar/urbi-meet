import { Server as NetServer } from 'http'
import { Server as ServerIO } from 'socket.io'
import { NextApiResponse } from 'next'

export type NextApiResponseServerIO = NextApiResponse & {
  socket: any
}

export const config = {
  api: {
    bodyParser: false,
  },
}

export const initSocket = (server: NetServer) => {
  const io = new ServerIO(server, {
    path: '/api/socket',
  })

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    socket.on('join-room', (roomId) => {
      socket.join(roomId)
      console.log(`Socket ${socket.id} joined room ${roomId}`)
    })

    socket.on('offer', ({ roomId, offer }) => {
      socket.to(roomId).emit('offer', offer)
    })

    socket.on('answer', ({ roomId, answer }) => {
      socket.to(roomId).emit('answer', answer)
    })

    socket.on('ice-candidate', ({ roomId, candidate }) => {
      socket.to(roomId).emit('ice-candidate', candidate)
    })

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
    })
  })

  return io
}