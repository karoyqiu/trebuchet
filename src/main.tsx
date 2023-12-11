/// <reference types="vite-plugin-svgr/client" />
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import App from './App';
import Xray from './api/xray/xray';
import EndpointPage from './pages/EndpointPage';
import GeneralPage from './pages/GeneralPage';
import SubscriptionPage from './pages/SubscriptionPage';
import './styles.css';

declare global {
  interface Window {
    xray: Xray;
  }
}

if (!window.xray) {
  window.xray = new Xray();
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        element: <GeneralPage />,
        index: true,
      },
      {
        path: 'ep',
        element: <EndpointPage />,
      },
      {
        path: 'sub',
        element: <SubscriptionPage />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
