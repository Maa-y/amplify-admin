declare module '../amplify_outputs.json' {
  interface AmplifyOutputs {
    version: string;
    custom?: {
      API?: {
        [key: string]: {
          endpoint: string;
          region: string;
          apiName: string;
        };
      };
    };
  }
  
  const outputs: AmplifyOutputs;
  export default outputs;
}
