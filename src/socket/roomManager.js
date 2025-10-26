const getDesignRoomName = (designId) => {
  return `design-${designId}`;
};

const getActiveUsersCount = (io, designId) => {
  const roomName = getDesignRoomName(designId);
  const room = io.sockets.adapter.rooms.get(roomName);
  return room ? room.size : 0;
};

const getRoomSockets = (io, designId) => {
  const roomName = getDesignRoomName(designId);
  const room = io.sockets.adapter.rooms.get(roomName);
  return room ? Array.from(room) : [];
};

const joinDesignRoom = (socket, designId) => {
  const roomName = getDesignRoomName(designId);
  socket.join(roomName);
};

const leaveDesignRoom = (socket, designId) => {
  const roomName = getDesignRoomName(designId);
  socket.leave(roomName);
};

module.exports = {
  getDesignRoomName,
  getActiveUsersCount,
  getRoomSockets,
  joinDesignRoom,
  leaveDesignRoom,
};