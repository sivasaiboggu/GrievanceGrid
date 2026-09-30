import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'underline' | 'pills' | 'segmented';
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'underline',
  className = ''
}) => {
  return (
    <div className={`civic-tabs tabs-${variant} ${className}`.trim()} role="tablist">
      {tabs.map(tab => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`tab-item ${isActive ? 'is-active' : ''}`}
            onClick={() => onChange(tab.id)}
          >
            {tab.icon && <span className="tab-icon">{tab.icon}</span>}
            <span className="tab-label">{tab.label}</span>
            {tab.badge !== undefined && (
              <span className={`tab-badge ${isActive ? 'badge-active' : ''}`}>
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export interface SidebarNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
  badgeColor?: string;
}

export interface DesktopSidebarProps {
  items: SidebarNavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  footer?: React.ReactNode;
  className?: string;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  items,
  activeId,
  onSelect,
  footer,
  className = ''
}) => {
  return (
    <aside className={`desktop-sidebar ${className}`.trim()}>
      <div className="sidebar-nav-list" style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
        {items.map(item => {
          const isActive = item.id === activeId;
          return (
            <button
              key={item.id}
              type="button"
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelect(item.id)}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
              {item.badge !== undefined && (
                <span
                  className="sidebar-badge"
                  style={item.badgeColor ? { backgroundColor: item.badgeColor, color: '#ffffff' } : undefined}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {footer && <div className="sidebar-footer" style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--civic-border)' }}>{footer}</div>}
    </aside>
  );
};

export interface MobileBottomNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

export interface MobileBottomNavProps {
  items: MobileBottomNavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  className?: string;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  items,
  activeId,
  onSelect,
  className = ''
}) => {
  return (
    <nav className={`mobile-bottom-nav ${className}`.trim()} aria-label="Mobile navigation">
      {items.map(item => {
        const isActive = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            className={`mobile-nav-btn ${isActive ? 'active' : ''}`}
            onClick={() => onSelect(item.id)}
          >
            {item.icon}
            <span>{item.label}</span>
            {Boolean(item.badge && item.badge > 0) && (
              <span className="mobile-nav-badge">{item.badge}</span>
            )}
          </button>
        );
      })}
    </nav>
  );
};
