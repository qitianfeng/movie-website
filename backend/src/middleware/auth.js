const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Access denied. No token provided.'
        }
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid token'
      }
    });
  }
};

const adminOnly = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Admin access required'
      }
    });
  }
  next();
};

// Check if user has specific permission
const hasPermission = (permissionName) => {
  return async (req, res, next) => {
    try {
      const userId = req.userId;
      
      // Get user's role and permissions
      const [users] = await pool.execute(`
        SELECT r.id as role_id, r.name as role_name
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.id = ?
      `, [userId]);

      if (users.length === 0 || !users[0].role_id) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'No role assigned'
          }
        });
      }

      const userRole = users[0].role_name;

      // Super admin has all permissions
      if (userRole === 'super_admin') {
        return next();
      }

      // Check specific permission
      const [perms] = await pool.execute(`
        SELECT p.name
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        JOIN roles r ON rp.role_id = r.id
        WHERE r.id = ? AND p.name = ?
      `, [users[0].role_id, permissionName]);

      if (perms.length === 0) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: `Permission denied: ${permissionName}`
          }
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: error.message
        }
      });
    }
  };
};

// Check multiple permissions (OR logic - user needs at least one)
const hasAnyPermission = (...permissionNames) => {
  return async (req, res, next) => {
    try {
      const userId = req.userId;
      
      const [users] = await pool.execute(`
        SELECT r.id as role_id, r.name as role_name
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.id = ?
      `, [userId]);

      if (users.length === 0 || !users[0].role_id) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'No role assigned'
          }
        });
      }

      const userRole = users[0].role_name;

      // Super admin has all permissions
      if (userRole === 'super_admin') {
        return next();
      }

      // Check if user has any of the permissions
      const placeholders = permissionNames.map(() => '?').join(',');
      const [perms] = await pool.execute(`
        SELECT p.name
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        JOIN roles r ON rp.role_id = r.id
        WHERE r.id = ? AND p.name IN (${placeholders})
      `, [users[0].role_id, ...permissionNames]);

      if (perms.length === 0) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: `Permission denied: requires one of [${permissionNames.join(', ')}]`
          }
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: error.message
        }
      });
    }
  };
};

module.exports = { auth, adminOnly, hasPermission, hasAnyPermission };
