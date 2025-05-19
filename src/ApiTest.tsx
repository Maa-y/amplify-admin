import React, { useState } from 'react';
import { Card, CardContent, Button, Typography, Box, CircularProgress } from '@mui/material';
import amplifyOutputs from '../amplify_outputs.json';

export const ApiTest = () => {
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get the API endpoint from amplify_outputs.json
  const apiUrl = amplifyOutputs.custom.API.myRestApi.endpoint + 'hello';
  console.log('API endpoint from amplify_outputs.json:', apiUrl);

  const callApi = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetch(apiUrl, {
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
      // More detailed error message
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.log('API URL:', apiUrl);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" component="div" gutterBottom>
          API Gateway / Lambda Test
        </Typography>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          Click the button below to test the Lambda function via API Gateway.
        </Typography>
        
        <Button 
          variant="contained" 
          color="primary" 
          onClick={callApi}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Call API'}
        </Button>
        
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
