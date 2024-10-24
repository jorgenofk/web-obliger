import { DataMessage } from './whiteboard-component';


export class Subscription {
  onopen: () => void = () => {};
  onmessage: (message: DataMessage) => void = () => {};
  onclose: (code: number, reason: string) => void = () => {};
  onerror: (error: Error) => void = () => {};
}

class WhiteboardService {
  private connection: WebSocket;
  private subscriptions = new Set<Subscription>();

  constructor() {
    this.connection = new WebSocket('ws://localhost:3000/api/v1/whiteboard');

    this.connection.onopen = () => {
      this.subscriptions.forEach((subscription) => subscription.onopen());
    };

    this.connection.onmessage = (event) => {
      const data: DataMessage = JSON.parse(event.data);
      this.subscriptions.forEach((subscription) => subscription.onmessage(data));
    };

    this.connection.onclose = (event) => {
      this.subscriptions.forEach((subscription) => subscription.onclose(event.code, event.reason));
    };

    this.connection.onerror = () => {
      const error = new Error('WebSocket connection error.');
      this.subscriptions.forEach((subscription) => subscription.onerror(error));
    };
  }

  subscribe(): Subscription {
    const subscription = new Subscription();
    this.subscriptions.add(subscription);

    if (this.connection.readyState === WebSocket.OPEN) {
      subscription.onopen();
    }

    return subscription;
  }

  unsubscribe(subscription: Subscription) {
    this.subscriptions.delete(subscription);
  }

  send(message: DataMessage) {
    if (this.connection.readyState === WebSocket.OPEN) {
      this.connection.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not open. Message not sent:', message);
    }
  }
}

const whiteboardService = new WhiteboardService();
export default whiteboardService;
