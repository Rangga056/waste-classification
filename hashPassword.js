const bcrypt = require("bcryptjs");

async function hashMyPassword(password) {
  const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds
  console.log("Hashed Password:", hashedPassword);
}

// Replace 'your-desired-admin-password' with the actual password you want to set
hashMyPassword("123456");
