import { Admin, Resource, ListGuesser, CustomRoutes } from 'react-admin';
import { dataProvider } from './dataProvider';
import { ApiTest } from './ApiTest';
import { Route } from 'react-router';
import { Layout } from './Layout';

export const App = () => (
  <Admin dataProvider={dataProvider} layout={Layout}>
    <CustomRoutes>
      <Route path="/api-test" element={<ApiTest />} />
    </CustomRoutes>
    <Resource name="users" list={ListGuesser} />
  </Admin>
);
