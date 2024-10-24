import * as React from 'react';
import { Component } from 'react-simplified';
import whiteboardService, { Subscription } from './whiteboard-service';
import { Card, Button, Row, Column, Form } from './widgets';

export interface DataMessage {
  type: 'message' | 'user-list' | 'register' | 'request-user-list' | 'clear-history';
  username?: string;
  text?: string;
}

export class User {
  username: string = '';
}

export class Message {
  text: string = '';
  username: string = '';
}

export class MessageApp extends Component {
  user: User = new User();
  message: Message = new Message();
  messages: Message[] = [];
  subscription: Subscription | null = null;
  connected = false;
  users: User[] = [];

  render() {
    return (
      <div>
        <Card title={`Chat (${this.connected ? 'Connected' : 'Disconnected'})`}>
          <Card title="Connected users">
            {this.users.map((user, index) => (
              <Row key={index}>
                <Column>- {user.username}</Column>
              </Row>
            ))}
          </Card>
          <Card title="Messages">
            {this.messages.map((message, index) => (
              <Row key={index}>
                <Column>
                  <b>{message.username}:</b> {message.text}
                </Column>
              </Row>
            ))}
            <br />
            <Button.Danger small={true} onClick={() => this.clearMessageHistory()}>
              Delete message history
            </Button.Danger>
          </Card>
          <Card title="New message">
            <Row>
              <Column width={1}>
                <Button.Light onClick={this.sendMessage}>{this.user.username}</Button.Light>
              </Column>
              <Column>
                <Form.Input
                  type="text"
                  value={this.message.text}
                  placeholder="Type message"
                  onChange={(event) => (this.message.text = event.currentTarget.value)}
                />
              </Column>
            </Row>
          </Card>
        </Card>
      </div>
    );
  }

  sendMessage = () => {
    if (this.message.text.trim()) {
      const newMessage: DataMessage = {
        type: 'message',
        text: this.message.text,
        username: this.user.username || 'Anonymous',
      };

      whiteboardService.send(newMessage); // Send message to server
      this.message.text = ''; // Clear input
    }
  };

  clearMessageHistory = () => {
    this.messages = []; // Clear client-side messages
    whiteboardService.send({ type: 'clear-history' }); // Send the clear message to the server
    this.forceUpdate(); // Force re-render to update the UI
  };

  mounted() {
    const username = prompt('Enter your username:') || 'Anonymous';
    this.user.username = username;

    this.subscription = whiteboardService.subscribe();

    this.subscription.onopen = () => {
      this.connected = true;

      // Send register message
      whiteboardService.send({
        type: 'register',
        username: this.user.username,
      });
      this.forceUpdate(); // Trigger re-render to show connected state
    };

    this.subscription.onmessage = (message) => {
      if (message.type === 'message') {
        this.messages.push({
          text: message.text || '',
          username: message.username || 'Anonymous',
        });
        this.forceUpdate(); // Update state to trigger re-render
      } else if (message.type === 'user-list') {
        //@ts-ignore
        this.users = message.users ? message.users.map((user) => ({ username: user })) : [];
        this.forceUpdate(); // Update state to trigger re-render
      }
    };

    this.subscription.onclose = (code, reason) => {
      this.connected = false;
      alert('Connection closed: ' + reason);
      this.forceUpdate(); // Trigger re-render to show disconnected state
    };
  }

  beforeUnmount() {
    if (this.subscription) whiteboardService.unsubscribe(this.subscription);
  }
}
