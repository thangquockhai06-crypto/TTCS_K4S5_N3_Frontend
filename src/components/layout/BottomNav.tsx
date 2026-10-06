import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Briefcase, LayoutDashboard, Plus, Settings, Users } from 'lucide-react';
import styles from './BottomNav.module.css';

export const BottomNav: React.FC = () => {
  const navigate = useNavigate();

  return (
    <>
      <button
        type="button"
        className={styles.fabBtn}
        onClick={() => navigate('/customers/new')}
        aria-label="Thêm khách hàng mới"
      >
        <Plus size={22} />
      </button>

      <nav className={styles.bottomNav} aria-label="Menu điều hướng di động">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `${styles.bottomNav__item} ${isActive ? styles['bottomNav__item--active'] : ''}`
          }
        >
          <LayoutDashboard size={19} />
          <span>Tổng quan</span>
        </NavLink>

        <NavLink
          to="/customers"
          className={({ isActive }) =>
            `${styles.bottomNav__item} ${isActive ? styles['bottomNav__item--active'] : ''}`
          }
        >
          <Users size={19} />
          <span>Khách hàng</span>
        </NavLink>

        <NavLink
          to="/deals"
          className={({ isActive }) =>
            `${styles.bottomNav__item} ${isActive ? styles['bottomNav__item--active'] : ''}`
          }
        >
          <Briefcase size={19} />
          <span>Cơ hội</span>
        </NavLink>

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `${styles.bottomNav__item} ${isActive ? styles['bottomNav__item--active'] : ''}`
          }
        >
          <Settings size={19} />
          <span>Cài đặt</span>
        </NavLink>
      </nav>
    </>
  );
};
