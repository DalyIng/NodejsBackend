const mongoose = require("mongoose");
const passport = require("passport");
const _ = require("lodash");

const User = mongoose.model("User");

module.exports.getAllUsuers = (req, res) => {
  User.find({}, function(err, users) {
    if (err)
      return res.status(500).send("There was a problem finding the users.");
    res.status(200).send(users);
  });
};

module.exports.register = (req, res, next) => {
  var user = new User();
  user.fullName = req.body.fullName;
  user.email = req.body.email;
  user.password = req.body.password;
  user.age = req.body.age;
  user.famille = req.body.famille;
  user.race = req.body.race;
  user.nourriture = req.body.nourriture;
  user.save((err, doc) => {
    if (!err) res.send(doc);
    else {
      if (err.code == 11000)
        res.status(422).send(["Duplicate email adrress found."]);
      else return next(err);
    }
  });
};

module.exports.authenticate = (req, res, next) => {
  // call for passport authentication
  passport.authenticate("local", (err, user, info) => {
    // error from passport middleware
    if (err) return res.status(400).json(err);
    // registered user
    else if (user) return res.status(200).json({ token: user.generateJwt() });
    // unknown user or wrong password
    else return res.status(404).json(info);
  })(req, res);
};

module.exports.userProfile = (req, res, next) => {
  User.findOne({ _id: req._id }, (err, user) => {
    if (!user)
      return res
        .status(404)
        .json({ status: false, message: "User record not found." });
    else
      return res.status(200).json({
        status: true,
        user: _.pick(user, [
          "_id",
          "fullName",
          "email",
          "friends",
          "race",
          "age",
          "famille",
          "nourriture"
        ])
      });
  });
};

module.exports.modifyUser = (req, res, next) => {
  User.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true },
    (err, user) => {
      if (err)
        return res.status(500).send("There was a problem updating the user.");
      return res.status(200).json({
        status: true,
        user: _.pick(user, [
          "_id",
          "fullName",
          "email",
          "friends",
          "race",
          "age",
          "famille",
          "nourriture"
        ])
      });
    }
  );
};

// UPDATES Freinds List DELETE
// Added VerifyToken middleware to make sure only an authenticated user can put to this route

module.exports.addfriend = (req, res, next) => {
  var friend = { fullName: req.body.fullName };
  User.findOne({ fullName: req.body.fullName }, (err, user) => {
    if (err) return res.status(500).send("Error on the server.");
    if (!user) return res.status(404).send("No user found.");
    else {
      User.findByIdAndUpdate(
        req.params.id,
        { $push: { friends: friend } },
        { new: true },
        (err, user) => {
          if (err) {
            console.log(err);
            return res
              .status(500)
              .send("There was a problem updating the user.");
          }
          return res.status(200).json({
            status: true,
            user: _.pick(user, [
              "_id",
              "fullName",
              "email",
              "friends",
              "race",
              "age",
              "famille",
              "nourriture"
            ])
          });
        }
      );
    }
  });
};

module.exports.deletefriend = (req, res, next) => {
  var friend = { fullName: req.body.fullName };
  User.findOne({ fullName: req.body.fullName }, (err, user) => {
    if (err) return res.status(500).send("Error on the server.");
    if (!user) return res.status(404).send("No user found.");
    else {
      User.findByIdAndUpdate(
        req.params.id,
        { $pull: { friends: friend } },
        { new: true },
        (err, user) => {
          if (err) {
            console.log(err);
            return res
              .status(500)
              .send("There was a problem updating the user.");
          }
          return res.status(200).json({
            status: true,
            user: _.pick(user, [
              "_id",
              "fullName",
              "email",
              "friends",
              "race",
              "age",
              "famille",
              "nourriture"
            ])
          });
        }
      );
    }
  });
};

// UPDATES Freinds List ADD
// Added VerifyToken middleware to make sure only an authenticated user can put to this route

/**
 * Lors de l'ajout d'un ami qui n'existe pas dans notre base de données
 * On crée cette personne et on l'ajoute à la liste d'amis de celui qui a envoyé la requête
 * Ainsi on ajoute dans la liste d'amis de cette nouvelle personne celui qui a envoyé la requête
 */

/*router.put("/:id/addfreind", VerifyToken, function(req, res) {
  var friend = { name: req.body.name };
  let newId;
  //Lors de l'ajout d'un ami inexistant dans la base, on crée cet extraterrestre 
  User.findById(req.params.id, function(err, senderUser) {
    if (err) return res.status(500).send("Error on the server.");
    if (!senderUser) return res.status(404).send("You are not authorized.");
    var exist = senderUser.freinds.filter(function(element) {
      return element.name === friend.name;
    });
    if (exist.length) {
      //console.log(exist);
      return res.status(200).send("You are freinds already.");
    } else {
      User.findOne({ name: req.body.name }, function(err, searchUser) {
        if (err) return res.status(500).send("Error on the server.");
        if (!searchUser) {
          //return res.status(404).send("No user found.");
          console.log("Alien not found, we'll create a new one");
          var hashedPassword = bcrypt.hashSync(req.body.password, 8);
          User.create(
            {
              name: req.body.name,
              email: req.body.email,
              password: hashedPassword
            },
            function(err, newUser) {
              if (err) return res.status(500).send("Error on the server.");
              console.log(senderUser.name);
              console.log(newUser._id);
              newId = newUser._id;
              let newFriend = { name: senderUser.name };
              User.findByIdAndUpdate(
                newUser._id,
                { $push: { freinds: newFriend } },
                function(err, freindadded) {
                  console.log("New Freind Added");
                  console.log(freindadded);
                }
              );
            }
          );

          User.findByIdAndUpdate(
            req.params.id,
            { $push: { freinds: friend } },
            { safe: true, upsert: true },
            function(err, user) {
              if (err) {
                console.log(err);
                return res
                  .status(500)
                  .send("There was a problem updating the user.");
              }
              res.status(200).send(user);
            }
          );
          //res.status(200).send("new alien created");
        } else {
          User.findByIdAndUpdate(
            req.params.id,
            { $push: { freinds: friend } },
            { safe: true, upsert: true },
            function(err, user) {
              if (err) {
                console.log(err);
                return res
                  .status(500)
                  .send("There was a problem updating the user.");
              }
              return res.status(200).send(user);
            }
          );
        }
      });
    }
  });
});*/
