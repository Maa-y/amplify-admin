import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { Amplify } from 'aws-amplify';
import { parseAmplifyConfig } from "aws-amplify/utils";
import outputs from '../amplify_outputs.json';

// Configure Amplify
try {
  const amplifyConfig = parseAmplifyConfig(outputs);
  Amplify.configure(
    {
      ...amplifyConfig,
      API: {
        ...amplifyConfig.API,
        REST: outputs.custom?.API || {},
      },
    },
    {
      API: {
        REST: {
          retryStrategy: {
            strategy: 'no-retry',
          },
        }
      }
    }
  );
  console.log('Amplify configured successfully');
} catch (error) {
  console.error('Error configuring Amplify:', error);
  console.warn('API functionality may not work until the backend is deployed');
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
