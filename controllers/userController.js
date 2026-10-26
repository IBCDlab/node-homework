function register(req, res) {
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  const user = {
    name,
    email,
    password,
  };
  global.users.push(user);
  global.user_id = user;
  res.status(201).json({
    name,
    email,
  });
}

function logon(req, res) {
  const email = req.body.email;
  const password = req.body.password;
  const user = global.users.find(
    (user) => user.email === email && user.password === password,
  );
  if (user) {
    global.user_id = user;
    res.status(200).json({
      name: user.name,
      email: user.email,
    });
  } else {
    res.sendStatus(401);
  }
}

function logoff(req, res) {
  global.user_id = null;
  res.sendStatus(200);
}

module.exports = {
  register,
  logon,
  logoff,
};
