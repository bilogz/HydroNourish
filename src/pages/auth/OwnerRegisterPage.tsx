/**
 * HydroNourish — Pet Owner Registration Page
 * Heritage Animal Clinic Capstone Project
 *
 * Route: /owner/register
 */

import React from 'react';
import { OwnerLoginPage } from './OwnerLoginPage';

export const OwnerRegisterPage: React.FC = () => {
  return <OwnerLoginPage defaultTab="register" />;
};
