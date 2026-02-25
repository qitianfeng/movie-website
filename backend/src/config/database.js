const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'my_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

// Initialize database tables
const initDB = async () => {
  const conn = await pool.getConnection();
  
  try {
    // Movies table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS movies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tmdb_id INT UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        original_title VARCHAR(255),
        overview TEXT,
        poster_path VARCHAR(255),
        backdrop_path VARCHAR(255),
        release_date DATE,
        runtime INT,
        vote_average DECIMAL(3,1) DEFAULT 0,
        vote_count INT DEFAULT 0,
        popularity DECIMAL(10,2) DEFAULT 0,
        original_language VARCHAR(10),
        status VARCHAR(50),
        tagline VARCHAR(255),
        is_popular BOOLEAN DEFAULT FALSE,
        is_trending BOOLEAN DEFAULT FALSE,
        is_banner BOOLEAN DEFAULT FALSE,
        banner_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FULLTEXT INDEX idx_title_overview (title, overview),
        INDEX idx_popularity (popularity),
        INDEX idx_release_date (release_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Genres table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS genres (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tmdb_id INT UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        name_en VARCHAR(100)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Movie-Genre relation
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS movie_genres (
        movie_id INT,
        genre_id INT,
        PRIMARY KEY (movie_id, genre_id),
        FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
        FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Users table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(30) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        avatar VARCHAR(255) DEFAULT '',
        role ENUM('user', 'admin') DEFAULT 'user',
        last_login TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Reviews table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        movie_id INT NOT NULL,
        rating DECIMAL(2,1) NOT NULL,
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_movie (user_id, movie_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // User favorites
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS user_favorites (
        user_id INT,
        movie_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, movie_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // User watchlist
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS user_watchlist (
        user_id INT,
        movie_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, movie_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Cast table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS movie_cast (
        id INT AUTO_INCREMENT PRIMARY KEY,
        movie_id INT NOT NULL,
        tmdb_id INT,
        name VARCHAR(255),
        character_name VARCHAR(255),
        profile_path VARCHAR(255),
        \`order\` INT,
        FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Videos table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS movie_videos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        movie_id INT NOT NULL,
        video_key VARCHAR(100),
        name VARCHAR(255),
        site VARCHAR(50),
        type VARCHAR(50),
        FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // ==================== RBAC 权限系统表 ====================

    // Roles table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        display_name VARCHAR(100) NOT NULL,
        description VARCHAR(255),
        is_system BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Permissions table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS permissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        display_name VARCHAR(100) NOT NULL,
        module VARCHAR(50) NOT NULL,
        description VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Role-Permission relation
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        role_id INT NOT NULL,
        permission_id INT NOT NULL,
        PRIMARY KEY (role_id, permission_id),
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Add role_id to users table (if not exists)
    try {
      const [columns] = await conn.execute(`SHOW COLUMNS FROM users LIKE 'role_id'`);
      if (columns.length === 0) {
        await conn.execute(`ALTER TABLE users ADD COLUMN role_id INT NULL AFTER role`);
        await conn.execute(`ALTER TABLE users ADD FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL`);
      }
    } catch (err) {
      console.log('role_id column might already exist:', err.message);
    }

    // Initialize default roles and permissions
    await initRBACData(conn);

    console.log('MySQL Connected and Tables Initialized');
  } catch (error) {
    console.error('Database initialization error:', error.message);
    throw error;
  } finally {
    conn.release();
  }
};

// Initialize default RBAC data
const initRBACData = async (conn) => {
  try {
    // Check if roles already exist
    const [existingRoles] = await conn.execute(`SELECT COUNT(*) as count FROM roles`);
    if (existingRoles[0].count > 0) {
      console.log('RBAC data already initialized');
      return;
    }

    console.log('Initializing RBAC data...');

    // Insert default roles
    const defaultRoles = [
      { name: 'super_admin', display_name: '超级管理员', description: '拥有所有权限', is_system: true },
      { name: 'admin', display_name: '管理员', description: '管理电影、评论、用户', is_system: true },
      { name: 'editor', display_name: '编辑', description: '管理电影和评论', is_system: true },
      { name: 'viewer', display_name: '访客', description: '只能查看数据', is_system: true }
    ];

    for (const role of defaultRoles) {
      await conn.execute(
        `INSERT INTO roles (name, display_name, description, is_system) VALUES (?, ?, ?, ?)`,
        [role.name, role.display_name, role.description, role.is_system]
      );
    }

    // Insert default permissions
    const defaultPermissions = [
      // 电影模块
      { name: 'movie:view', display_name: '查看电影', module: 'movie' },
      { name: 'movie:create', display_name: '创建电影', module: 'movie' },
      { name: 'movie:edit', display_name: '编辑电影', module: 'movie' },
      { name: 'movie:delete', display_name: '删除电影', module: 'movie' },
      { name: 'movie:sync', display_name: '同步电影', module: 'movie' },
      // 分类模块
      { name: 'genre:view', display_name: '查看分类', module: 'genre' },
      { name: 'genre:create', display_name: '创建分类', module: 'genre' },
      { name: 'genre:edit', display_name: '编辑分类', module: 'genre' },
      { name: 'genre:delete', display_name: '删除分类', module: 'genre' },
      // 用户模块
      { name: 'user:view', display_name: '查看用户', module: 'user' },
      { name: 'user:edit', display_name: '编辑用户', module: 'user' },
      { name: 'user:delete', display_name: '删除用户', module: 'user' },
      // 评论模块
      { name: 'review:view', display_name: '查看评论', module: 'review' },
      { name: 'review:audit', display_name: '审核评论', module: 'review' },
      { name: 'review:delete', display_name: '删除评论', module: 'review' },
      // 系统模块
      { name: 'system:settings', display_name: '系统设置', module: 'system' },
      { name: 'system:logs', display_name: '查看日志', module: 'system' },
      { name: 'system:role', display_name: '角色管理', module: 'system' }
    ];

    for (const perm of defaultPermissions) {
      await conn.execute(
        `INSERT INTO permissions (name, display_name, module) VALUES (?, ?, ?)`,
        [perm.name, perm.display_name, perm.module]
      );
    }

    // Get role and permission IDs
    const [roles] = await conn.execute(`SELECT id, name FROM roles`);
    const [permissions] = await conn.execute(`SELECT id, name FROM permissions`);
    
    const roleMap = {};
    roles.forEach(r => roleMap[r.name] = r.id);
    
    const permMap = {};
    permissions.forEach(p => permMap[p.name] = p.id);

    // Assign permissions to roles
    const rolePermissions = {
      super_admin: Object.keys(permMap), // 所有权限
      admin: [
        'movie:view', 'movie:create', 'movie:edit', 'movie:delete', 'movie:sync',
        'genre:view', 'genre:create', 'genre:edit', 'genre:delete',
        'user:view', 'user:edit',
        'review:view', 'review:audit', 'review:delete',
        'system:logs'
      ],
      editor: [
        'movie:view', 'movie:create', 'movie:edit',
        'genre:view',
        'review:view', 'review:audit'
      ],
      viewer: [
        'movie:view', 'genre:view', 'user:view', 'review:view', 'system:logs'
      ]
    };

    for (const [roleName, permNames] of Object.entries(rolePermissions)) {
      const roleId = roleMap[roleName];
      for (const permName of permNames) {
        const permId = permMap[permName];
        if (roleId && permId) {
          await conn.execute(
            `INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`,
            [roleId, permId]
          );
        }
      }
    }

    // Migrate existing users: role='admin' -> role_id=super_admin, role='user' -> role_id=viewer
    const superAdminRoleId = roleMap['super_admin'];
    const viewerRoleId = roleMap['viewer'];
    
    if (superAdminRoleId) {
      await conn.execute(
        `UPDATE users SET role_id = ? WHERE role = 'admin' AND role_id IS NULL`,
        [superAdminRoleId]
      );
    }
    if (viewerRoleId) {
      await conn.execute(
        `UPDATE users SET role_id = ? WHERE role = 'user' AND role_id IS NULL`,
        [viewerRoleId]
      );
    }

    console.log('RBAC data initialized successfully');
  } catch (error) {
    console.error('RBAC initialization error:', error.message);
    // Don't throw, allow app to continue
  }
};

module.exports = { pool, initDB };
