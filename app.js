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

const validatePassword = (password) => {
  return password.length > 4;
};
//POST /register API 1
app.post("/register/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectUserQuery = `
    select * from user  where username = "${username}"`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    const createUser = `
        INSERT INTO 
        user (username, name, password, gender, location)
        values ( "${username}" , "${name}" , "${hashedPassword}" ,
        "${gender}" , "${location}" ) ;
        `;
    if (validatePassword(password)) {
      const dbUser = await db.run(createUser);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//POST /login API 2

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const loginQuery = `
    select *
    from user
    where username = "${username}" ;
    `;
  const loginUser = await db.get(loginQuery);

  if (loginUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      password,
      loginUser.password
    );
    if (isPasswordMatched === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
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
    response.send("User not registered");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      oldPassword,
      dbUser.password
    );
    if (isPasswordMatched === true) {
      if (validatePassword(newPassword)) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updateQuery = `
            update user set password = "${hashedPassword}"
             where username = "${username}" ;
            `;
        const user = await db.run(updateQuery);
        response.status(200);
        response.send("Password updated");
      } else {
        response.status(400);
        response.send("Password is too short");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
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
//const checkPassword = await bcrypt.compare(password, loginUser.password);
