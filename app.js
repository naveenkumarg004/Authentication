const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const path = require("path");
app.use(express.json());
const dbPath = path.join(__dirname, "userData.db");

let db = null;
const startServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("Server Running Successfully");
    });
  } catch (e) {
    console.log(`DB Error : ${e.message}`);
    process.exit(1);
  }
};
startServer();
//POST /register API 1
app.post("/register/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(request.body.password, 10);
  const selectUserQuery = `
    select * from user  where username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser !== undefined) {
    response.status(400);
    response.send("User Already Exits");
  } else if (password.length <= 5) {
    response.status(400);
    response.send("Password id Too Short");
  } else {
    response.status(200);
    response.send("User Created Successfully");
  }
});

//POST /login API 2

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const hashedPassword = await bcrypt.hash(request.body.password, 10);
  const userQuery = `
    select * from user where username = '${username}' `;
  const passwordQuery = `
    select * from user where password = ${password} `;
  const dbUser = await db.get(userQuery);
  const dbPassword = await db.get(passwordQuery);

  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else if (dbPassword.password === undefined) {
    response.status(400);
    response.send("Invalid Password");
  } else {
    response.status(200);
    response.send("Login Success");
  }
});

// PUT /change-password API 3
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const checkUserQuery = `
    select * from user where username = '${username}' `;
  const dbUser = await db.get(checkUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("User Not Registered");
  } else {
    //check for password
    const isValidPassword = await bcrypt.compare(oldPassword, dbUser.password);
    if (isValidPassword === true) {
      const passwordLength = newPassword.length;
      if (passwordLength < 5) {
        response.status(400);
        response.send("Password is too Short");
      } else {
        // update newPassword
        const encryptedPassword = await bcrypt.hash(newPassword, 10);
        const updatePasswordQuery = `
                update user
                set password = '${encryptedPassword}'
                where username = '${username}' `;
        await db.run(updatePasswordQuery);
        response.send();
      }
    } else {
      response.status(400);
      response.send("Invalid Current Password");
    }
  }
});

module.exports = app;

// const oldHashedPassword = await bcrypt.hash(oldPassword, 10)
//    const newHashedPassword = await bcrypt.hash(newPassword, 10)
//    const getOldPasswordQuery = `
//    select * from user where oldPassword = ${oldPassword}`
//    const getNewPasswordQuery = `
//    select * from user where oldPassword = ${newPassword}`
//
//    const dbOldPassword = await db.get(getOldPasswordQuery)
//    const dbNewPassword = await db.get(getNewPasswordQuery)
//    if (dbOldPassword !== undefined){
//
//    }
