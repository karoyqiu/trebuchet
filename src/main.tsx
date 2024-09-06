/// <reference types="vite-plugin-svgr/client" />
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import App from './App';
import EndpointPage from './pages/EndpointPage';
import GeneralPage from './pages/GeneralPage';
import LogPage from './pages/LogPage';
import RulePage from './pages/RulePage';
import SubscriptionPage from './pages/SubscriptionPage';
import './styles.css';

if (!import.meta.env.DEV) {
  document.addEventListener('contextmenu', (event) => {
    if (!event.target || !('tagName' in event.target) || event.target.tagName !== 'INPUT') {
      event.preventDefault();
    }
  });
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
      {
        path: 'rule',
        element: <RulePage />,
      },
      {
        path: 'log',
        element: <LogPage />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
