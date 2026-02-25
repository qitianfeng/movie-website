const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { pool } = require('../config/database');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: { code: 'USER_EXISTS', message: 'User already exists with this email or username' }
      });
    }

    // Create user
    const userId = await User.create({ username, email, password });
    const user = await User.findById(userId);

    // Generate token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          role: user.role
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
      });
    }

    // Check password
    const isMatch = await User.comparePassword(user, password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
      });
    }

    // Update last login
    await User.updateLastLogin(user.id);

    // Generate token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    // 获取用户角色和权限信息
    const [users] = await pool.execute(`
      SELECT u.id, u.username, u.email, u.avatar, u.role_id, r.name as role_name, r.display_name as role_display_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = ?
    `, [user.id]);

    const userInfo = users[0];
    let permissions = [];

    // 如果用户有角色，获取权限列表
    if (userInfo.role_id) {
      const [perms] = await pool.execute(`
        SELECT DISTINCT p.name
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = ?
      `, [userInfo.role_id]);
      permissions = perms.map(p => p.name);
    }

    // 判断是否是超级管理员（role_id = 1 或 role_name = 'super_admin'）
    const isSuperAdmin = userInfo.role_id === 1 || userInfo.role_name === 'super_admin';

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          roleId: userInfo.role_id,
          roleName: userInfo.role_display_name || userInfo.role_name,
          permissions,
          isSuperAdmin
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

module.exports = router;
