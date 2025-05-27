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
import amplifyOutputs from '../amplify_outputs.json';
import { fetchAuthSession } from 'aws-amplify/auth';
import { 
  Authenticator,
  useAuthenticator
} from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

// Create a wrapper component that uses the Authenticator
const ApiTestContent = () => {
  const [response, setResponse] = useState<string | null>(null);
  const [publicApiLoading, setPublicApiLoading] = useState(false);
  const [securedApiLoading, setSecuredApiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use the useAuthenticator hook to access auth state and methods
  const { user, signOut } = useAuthenticator((context) => [context.user]);
  
  // Get the API endpoints from amplify_outputs.json
  const publicApiUrl = amplifyOutputs.custom.API.myRestApi.endpoint + 'hello';
  const securedApiUrl = amplifyOutputs.custom.API.myRestApi.endpoint + 'secured';
  console.log('Public API endpoint:', publicApiUrl);
  console.log('Secured API endpoint:', securedApiUrl);

  const callPublicApi = async () => {
    setPublicApiLoading(true);
    setError(null);
    
    try {
      const result = await fetch(publicApiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!result.ok) {
        throw new Error(`API request failed with status ${result.status}`);
      }
      
      const data = await result.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (err) {
      console.error('Error calling API:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.log('API URL:', publicApiUrl);
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
      
      const result = await fetch(securedApiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': idToken
        },
      });
      
      if (!result.ok) {
        throw new Error(`API request failed with status ${result.status}`);
      }
      
      const data = await result.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (err) {
      console.error('Error calling secured API:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.log('Secured API URL:', securedApiUrl);
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
          This demo shows how to call both public and secured API endpoints. 
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
