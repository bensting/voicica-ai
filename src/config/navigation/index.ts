/**
 * Navigation configuration entry point
 *
 * Generates navigation dropdowns from studioMenu configuration
 */

import { navigationConfig as devConfig } from './nav.development';
import { navigationConfig as prodConfig } from './nav.production';
import { studioMenuCategories, categoryOrder } from '@/config/studioMenu';
import type { NavLink, NavDropdown, NavDropdownItem, NavigationConfig } from './types';

// Select base config based on environment
const isProduction = process.env.NODE_ENV === 'production';
const baseConfig: NavigationConfig = isProduction ? prodConfig : devConfig;

/**
 * Generate navigation dropdowns from studioMenu configuration
 */
function generateDropdownsFromStudioMenu(): NavDropdown[] {
  const dropdowns: NavDropdown[] = [];

  // Generate dropdowns for each category based on categoryOrder
  categoryOrder.forEach((category) => {
    // Skip if showInNav is explicitly false
    if (category.showInNav === false) return;

    const items = studioMenuCategories[category.key];
    // Skip empty categories
    if (items.length === 0) return;

    const dropdownItems: NavDropdownItem[] = items.map((item) => ({
      href: item.href,
      labelKey: item.labelKey,
      icon: item.icon,
      enabled: item.enabled,
    }));

    dropdowns.push({
      id: category.key,
      labelKey: category.labelKey,
      items: dropdownItems,
      enabled: dropdownItems.some(item => item.enabled !== false),
    });
  });

  return dropdowns;
}

// Generate the final navigation config with dropdowns from studioMenu
export const navigationConfig: NavigationConfig = {
  links: baseConfig.links,
  dropdowns: generateDropdownsFromStudioMenu(),
};

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