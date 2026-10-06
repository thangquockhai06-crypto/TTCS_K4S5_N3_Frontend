import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, UserCheck, User } from 'lucide-react';
import styles from './BottomNav.module.css';

export const BottomNav: React.FC = () => {
  return (
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
        to="/users"
        className={({ isActive }) =>
          `${styles.bottomNav__item} ${isActive ? styles['bottomNav__item--active'] : ''}`
        }
      >
        <UserCheck size={19} />
        <span>Người dùng</span>
      </NavLink>

      <NavLink
        to="/products"
        className={({ isActive }) =>
          `${styles.bottomNav__item} ${isActive ? styles['bottomNav__item--active'] : ''}`
        }
      >
        <Package size={19} />
        <span>Sản phẩm</span>
      </NavLink>

      <NavLink
        to="/profile"
        className={({ isActive }) =>
          `${styles.bottomNav__item} ${isActive ? styles['bottomNav__item--active'] : ''}`
        }
      >
        <User size={19} />
        <span>Hồ sơ</span>
      </NavLink>
    </nav>
  );
};
