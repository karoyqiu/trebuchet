import 'material-symbols/outlined.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import App from './App';
import EndpointPage from './pages/EndpointPage';
import GeneralPage from './pages/GeneralPage';
import SubscriptionPage from './pages/SubscriptionPage';
import './styles.css';

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
