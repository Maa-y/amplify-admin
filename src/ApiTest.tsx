import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  Button, 
  Typography, 
  Box, 
  CircularProgress, 
  Stack, 
  Divider
} from '@mui/material';
import { fetchAuthSession } from 'aws-amplify/auth';
import { 
  Authenticator,
  useAuthenticator
} from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { get, ApiError } from 'aws-amplify/api';

// Create a wrapper component that uses the Authenticator
const ApiTestContent = () => {
  const [response, setResponse] = useState<string | null>(null);
  const [publicApiLoading, setPublicApiLoading] = useState(false);
  const [securedApiLoading, setSecuredApiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use the useAuthenticator hook to access auth state and methods
  const { user, signOut } = useAuthenticator((context) => [context.user]);
  
  // API name from amplify_outputs.json
  const apiName = 'myRestApi';
  console.log('API name:', apiName);

  const callPublicApi = async () => {
    setPublicApiLoading(true);
    setError(null);
    
    try {
      // Using Amplify's API client instead of fetch
      const restOperation = get({
        apiName: apiName,
        path: 'hello',
        options: {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      });
      
      const response = await restOperation.response;
      const data = await response.body.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (err) {
      console.error('Error calling API:', err);
      
      // Enhanced error handling for Amplify API errors
      if (err instanceof ApiError) {
        if (err.response) {
          const { statusCode, body } = err.response;
          console.error(`Received ${statusCode} error response with payload: ${body}`);
          setError(`API Error (${statusCode}): ${body}`);
        } else {
          setError('API request failed');
        }
      } else {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      }
    } finally {
      setPublicApiLoading(false);
    }
  };

  const callSecuredApi = async () => {
    setSecuredApiLoading(true);
    setError(null);
    
    try {
      // Get the current session to get the ID token
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken?.toString();
      if (!idToken) {
        throw new Error('No authentication token available');
      }
      
      const restOperation = get({
        apiName: apiName,
        path: 'secured',
        options: {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': idToken
          }
        }
      });
      
      const response = await restOperation.response;
      const data = await response.body.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (err) {
      console.error('Error calling secured API:', err);
      
      // Enhanced error handling for Amplify API errors
      if (err instanceof ApiError) {
        if (err.response) {
          const { statusCode, body } = err.response;
          console.error(`Received ${statusCode} error response with payload: ${body}`);
          setError(`API Error (${statusCode}): ${body}`);
        } else {
          setError('API request failed - authentication may be required');
        }
      } else {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      }
    } finally {
      setSecuredApiLoading(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" component="div" gutterBottom>
          API Gateway / Lambda Test
        </Typography>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          This demo shows how to call both public and secured API endpoints using Amplify API client. 
          The secured endpoint is protected by a Cognito authorizer.
        </Typography>
        
        <Box mb={3}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Signed in as: <strong>{user?.username || 'User'}</strong>
          </Typography>
          <Button 
            variant="outlined" 
            color="secondary" 
            onClick={signOut}
          >
            Sign Out
          </Button>
        </Box>
        
        <Divider sx={{ my: 2 }} />
  
        <Stack direction="row" spacing={2}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={callPublicApi}
            disabled={publicApiLoading}
          >
            {publicApiLoading ? <CircularProgress size={24} /> : 'Call Public API'}
          </Button>
          
          <Button 
            variant="contained" 
            color="primary" 
            onClick={callSecuredApi}
            disabled={securedApiLoading}
          >
            {securedApiLoading ? <CircularProgress size={24} /> : 'Call Secured API'}
          </Button>
        </Stack>
        
        {error && (
          <Box mt={2}>
            <Typography variant="body2" color="error">
              Error: {error}
            </Typography>
          </Box>
        )}
        
        {response && (
          <Box mt={2} p={2} bgcolor="background.paper" borderRadius={1}>
            <Typography variant="h6" gutterBottom>
              Response:
            </Typography>
            <Typography component="pre" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {response}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// Main component that wraps the content with Authenticator
export const ApiTest = () => {
  return (
    <Authenticator>
      <ApiTestContent />
    </Authenticator>
  );
};
