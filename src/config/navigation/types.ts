/**
 * Navigation configuration types
 */

export interface NavLink {
  href: string;
  labelKey: string; // i18n key for translation
  type?: 'page' | 'section'; // 'page' for route navigation, 'section' for scroll to section
  sectionId?: string; // section id for scroll behavior (only when type is 'section')
  openInNewWindow?: boolean; // if true, opens link in a new window/tab
  enabled?: boolean; // whether this link is enabled, defaults to true
}

export interface NavDropdownItem {
  href: string;
  labelKey: string;
  descriptionKey?: string; // i18n key for description
  icon?: React.ComponentType<{ className?: string }> | React.ReactNode;
  enabled?: boolean;
}

export interface NavDropdown {
  id: string;
  labelKey: string;
  items: NavDropdownItem[];
  enabled?: boolean;
  insertAfter?: string; // href of the link after which this dropdown should appear
}

export interface NavigationConfig {
  links: NavLink[];
  dropdowns: NavDropdown[];
}