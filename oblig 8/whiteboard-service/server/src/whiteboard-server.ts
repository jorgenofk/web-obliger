import type http from 'http';
import type https from 'https';
import WebSocket from 'ws';

interface DataMessage {
  type: 'message' | 'user-list' | 'register' | 'request-user-list' | 'clear-history';
  username?: string;
  text?: string;
}

interface UserListMessage {
  type: 'user-list';
  users: string[];
}

export default class WhiteboardServer {
  private users: Set<string> = new Set();
  private messageHistory: DataMessage[] = [];

  constructor(webServer: http.Server | https.Server, path: string) {
    const server = new WebSocket.Server({ server: webServer, path: path + '/whiteboard' });

    server.on('connection', (connection) => {
      let username: string | undefined;

      connection.on('message', (message) => {
        try {
          const parsedMessage: DataMessage = JSON.parse(message.toString());

          // Handle user registration
          if (parsedMessage.type === 'register') {
            if (!parsedMessage.username || this.users.has(parsedMessage.username)) {
              connection.send(
                JSON.stringify({ type: 'error', message: 'Username is already taken or invalid.' }),
              );
              return;
            }

            username = parsedMessage.username;
            this.users.add(username);
            this.broadcastUserList(server);
            this.sendMessageHistory(connection);
          }

          // Handle incoming chat message
          if (parsedMessage.type === 'message' && username) {
            this.messageHistory.push(parsedMessage);
            this.broadcastMessage(server, JSON.stringify(parsedMessage));
          }

          // Handle clearing the message history
          if (parsedMessage.type === 'clear-history') {
            this.messageHistory = []; // Clear the message history
            console.log('Message history cleared');
            return; // No need to broadcast this message
          }

          // Handle user list request
          if (parsedMessage.type === 'request-user-list') {
            this.sendUserList(connection);
          }
        } catch (error) {
          connection.send(JSON.stringify({ type: 'error', message: 'Invalid message format.' }));
        }
      });

      // Handle client disconnect
      connection.on('close', () => {
        if (username) {
          this.users.delete(username);
          this.broadcastUserList(server);
        }
      });
    });
  }

  // Broadcast message to all clients
  private broadcastMessage(server: WebSocket.Server, message: string) {
    server.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // Broadcast the updated user list to all clients
  private broadcastUserList(server: WebSocket.Server) {
    const userListMessage: UserListMessage = {
      type: 'user-list',
      users: Array.from(this.users),
    };

    this.broadcastMessage(server, JSON.stringify(userListMessage));
  }

  // Send the current user list to a specific client
  private sendUserList(connection: WebSocket) {
    const userListMessage: UserListMessage = {
      type: 'user-list',
      users: Array.from(this.users),
    };

    connection.send(JSON.stringify(userListMessage));
  }

  // Send the full message history to a specific client
  private sendMessageHistory(connection: WebSocket) {
    this.messageHistory.forEach((message) => {
      connection.send(JSON.stringify(message));
    });
  }
}
