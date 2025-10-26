const {
  getDesignRoomName,
  getActiveUsersCount,
  joinDesignRoom,
  leaveDesignRoom,
} = require('./roomManager');

const {
  validateDesignExists,
  updateDesignInDB,
  addElementToDB,
  updateElementInDB,
  deleteElementFromDB,
  updateCanvasBackground,
  updateCanvasDimensions,
  updateDesignName,
} = require('./designSync');

const handleSocketEvent = async (socket, io, eventName, data, handler) => {
  try {
    const { designId } = data;

    const exists = await validateDesignExists(designId);
    if (!exists) {
      socket.emit('error', {
        event: eventName,
        message: 'Design not found',
        designId,
      });
      return;
    }

    await handler(data);
  } catch (error) {
    console.error(`Error in ${eventName}:`, error);
    socket.emit('error', {
      event: eventName,
      message: error.message,
      designId: data.designId,
      elementId: data.elementId,
    });
  }
};

const initializeSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    const socketRooms = new Set();

    socket.on('design:join', async ({ designId, clientId }) => {
      try {
        console.log(`design:join - designId: ${designId}, clientId: ${clientId}`);

        const exists = await validateDesignExists(designId);
        if (!exists) {
          socket.emit('error', { event: 'design:join', message: 'Design not found', designId });
          return;
        }

        joinDesignRoom(socket, designId);
        socketRooms.add(designId);

        const activeUsers = getActiveUsersCount(io, designId);
        const roomName = getDesignRoomName(designId);

        io.to(roomName).emit('design:user-joined', {
          designId,
          activeUsers,
          timestamp: Date.now(),
        });

        console.log(`Client ${clientId} joined design ${designId}. Active users: ${activeUsers}`);
      } catch (error) {
        console.error('Error in design:join:', error);
        socket.emit('error', { event: 'design:join', message: error.message, designId });
      }
    });

    socket.on('design:leave', async ({ designId }) => {
      try {
        console.log(`design:leave - designId: ${designId}`);

        leaveDesignRoom(socket, designId);
        socketRooms.delete(designId);

        const activeUsers = getActiveUsersCount(io, designId);
        const roomName = getDesignRoomName(designId);

        io.to(roomName).emit('design:user-left', {
          designId,
          activeUsers,
          timestamp: Date.now(),
        });

        console.log(`Client left design ${designId}. Active users: ${activeUsers}`);
      } catch (error) {
        console.error('Error in design:leave:', error);
        socket.emit('error', { event: 'design:leave', message: error.message, designId });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);

      // Leave all design rooms and broadcast updated counts
      socketRooms.forEach((designId) => {
        const activeUsers = getActiveUsersCount(io, designId);
        const roomName = getDesignRoomName(designId);

        io.to(roomName).emit('design:user-left', {
          designId,
          activeUsers,
          timestamp: Date.now(),
        });

        console.log(`Auto-removed from design ${designId}. Active users: ${activeUsers}`);
      });

      socketRooms.clear();
    });

    socket.on('design:update', async ({ designId, clientId, timestamp, changes }) => {
      await handleSocketEvent(socket, io, 'design:update', { designId }, async () => {
        console.log(`design:update - designId: ${designId}, clientId: ${clientId}`);

        await updateDesignInDB(designId, changes);

        const roomName = getDesignRoomName(designId);
        io.to(roomName).emit('design:update-received', {
          designId,
          clientId,
          timestamp,
          changes,
        });

        console.log(`Design ${designId} updated and broadcast`);
      });
    });

    socket.on('design:element-add', async ({ designId, clientId, timestamp, element }) => {
      await handleSocketEvent(socket, io, 'design:element-add', { designId }, async () => {
        console.log(`design:element-add - designId: ${designId}, elementId: ${element.id}`);

        await addElementToDB(designId, element);

        const roomName = getDesignRoomName(designId);
        io.to(roomName).emit('design:element-added', {
          designId,
          clientId,
          timestamp,
          element,
        });

        console.log(`Element ${element.id} added to design ${designId}`);
      });
    });

    socket.on('design:element-update', async ({ designId, clientId, timestamp, elementId, updates }) => {
      await handleSocketEvent(socket, io, 'design:element-update', { designId, elementId }, async () => {
        console.log(`design:element-update - designId: ${designId}, elementId: ${elementId}`);

        await updateElementInDB(designId, elementId, updates);

        const roomName = getDesignRoomName(designId);
        io.to(roomName).emit('design:element-updated', {
          designId,
          clientId,
          timestamp,
          elementId,
          updates,
        });

        console.log(`Element ${elementId} updated in design ${designId}`);
      });
    });


    socket.on('design:element-delete', async ({ designId, clientId, timestamp, elementId }) => {
      await handleSocketEvent(socket, io, 'design:element-delete', { designId, elementId }, async () => {
        console.log(`design:element-delete - designId: ${designId}, elementId: ${elementId}`);

        await deleteElementFromDB(designId, elementId);

        const roomName = getDesignRoomName(designId);
        io.to(roomName).emit('design:element-deleted', {
          designId,
          clientId,
          timestamp,
          elementId,
        });

        console.log(`Element ${elementId} deleted from design ${designId}`);
      });
    });

    socket.on('design:background-change', async ({ designId, clientId, timestamp, canvasBackground }) => {
      await handleSocketEvent(socket, io, 'design:background-change', { designId }, async () => {
        console.log(`design:background-change - designId: ${designId}, color: ${canvasBackground}`);

        await updateCanvasBackground(designId, canvasBackground);

        const roomName = getDesignRoomName(designId);
        io.to(roomName).emit('design:background-changed', {
          designId,
          clientId,
          timestamp,
          canvasBackground,
        });

        console.log(`Background changed for design ${designId}`);
      });
    });

    socket.on('design:resize', async ({ designId, clientId, timestamp, width, height }) => {
      await handleSocketEvent(socket, io, 'design:resize', { designId }, async () => {
        console.log(`design:resize - designId: ${designId}, size: ${width}x${height}`);

        await updateCanvasDimensions(designId, width, height);

        const roomName = getDesignRoomName(designId);
        io.to(roomName).emit('design:resized', {
          designId,
          clientId,
          timestamp,
          width,
          height,
        });

        console.log(`Canvas resized for design ${designId}`);
      });
    });

    socket.on('design:name-change', async ({ designId, clientId, timestamp, name }) => {
      await handleSocketEvent(socket, io, 'design:name-change', { designId }, async () => {
        console.log(`design:name-change - designId: ${designId}, name: ${name}`);

        await updateDesignName(designId, name);

        const roomName = getDesignRoomName(designId);
        io.to(roomName).emit('design:name-changed', {
          designId,
          clientId,
          timestamp,
          name,
        });

        console.log(`Design ${designId} renamed to "${name}"`);
      });
    });
  });
};

module.exports = { initializeSocketHandlers };