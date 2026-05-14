const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 30]
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  role: {
    type: DataTypes.ENUM('user', 'seller', 'admin'),
    defaultValue: 'user'
  },
  // Seller-specific fields
  isVerifiedSeller: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  sellerAddress: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'The address from which seller ships products'
  },
  sellerCity: {
    type: DataTypes.STRING,
    allowNull: true
  },
  sellerCountry: {
    type: DataTypes.STRING,
    allowNull: true
  },
  sellerZipCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  sellerPhone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  sellerRating: {
    type: DataTypes.DECIMAL(2, 1),
    defaultValue: 0
  },
  totalSales: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  hooks: {
    beforeCreate: async (user) => {
      user.password = await bcrypt.hash(user.password, 10);
    }
  }
});

User.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = User;