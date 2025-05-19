import type { ReactNode } from "react";
import { Layout as RALayout, CheckForApplicationUpdate, Menu, MenuItemLink } from "react-admin";
import ApiIcon from '@mui/icons-material/Api';
import PeopleIcon from '@mui/icons-material/People';

const CustomMenu = () => (
  <Menu>
    <MenuItemLink to="/" primaryText="Users" leftIcon={<PeopleIcon />} />
    <MenuItemLink to="/api-test" primaryText="API Test" leftIcon={<ApiIcon />} />
  </Menu>
);

export const Layout = ({ children }: { children: ReactNode }) => (
  <RALayout menu={CustomMenu}>
    {children}
    <CheckForApplicationUpdate />
  </RALayout>
);
