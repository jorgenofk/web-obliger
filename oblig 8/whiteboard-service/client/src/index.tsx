import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { MessageApp } from './whiteboard-component';
import { Alert, Card, Button, Row, Column, Form } from './widgets';
import { Component } from 'react-simplified';

let root = document.getElementById('root');

if (root)
  createRoot(root).render(
    <>
      <Alert />
      <MessageApp />
    </>,
  );
