/**
 * Navigation configuration entry point
 *
 * Automatically selects development or production config based on environment
 */

import { navigationConfig as devConfig } from './nav.development';
import { navigationConfig as prodConfig } from './nav.production';
import type { NavLink, NavDropdown, NavDropdownItem, NavigationConfig } from './types';

// Select config based on environment
const isProduction = process.env.NODE_ENV === 'production';
export const navigationConfig: NavigationConfig = isProduction ? prodConfig : devConfig;

// Export individual parts for convenience
export const NAV_LINKS: NavLink[] = navigationConfig.links.filter(link => link.enabled !== false);
export const NAV_DROPDOWNS: NavDropdown[] = navigationConfig.dropdowns.filter(dropdown => dropdown.enabled !== false);

// Export types
export type { NavLink, NavDropdown, NavDropdownItem, NavigationConfig };

/**
 * Get all enabled navigation links
 */
export function getEnabledNavLinks(): NavLink[] {
  return navigationConfig.links.filter(link => link.enabled !== false);
}

/**
 * Get all enabled dropdowns with their enabled items
 */
export function getEnabledDropdowns(): NavDropdown[] {
  return navigationConfig.dropdowns
    .filter(dropdown => dropdown.enabled !== false)
    .map(dropdown => ({
      ...dropdown,
      items: dropdown.items.filter(item => item.enabled !== false),
    }));
}

/**
 * Get dropdown by ID
 */
export function getDropdownById(id: string): NavDropdown | undefined {
  return navigationConfig.dropdowns.find(dropdown => dropdown.id === id);
}