//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const date = require(__dirname + "/date.js");

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB");

const itemsSchema = {
  name: String,
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!",
});
const item2 = new Item({
  name: "Hit the + button to add a new item.",
});
const item3 = new Item({
  name: "<-- Hit this to complete an item.",
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  const day = date.getDate();

  Item.find({}).then((data) => {
    if (data.length === 0) {
      Item.insertMany(defaultItems)
        .then(() => {
          // console.log("inserted")
        })
        .catch((err) => {
          console.log("oh no");
        });

      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", listItems: data });
    }
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listTitle = req.body.list;

  const newItem = new Item({
    name: itemName,
  });

  if (listTitle === "Today") {
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listTitle }).then((foundList) => {
      if (!foundList) {
        console.log("list not found");
      }

      foundList.items.push(newItem);
      foundList.save();
      res.redirect("/" + listTitle);
    });
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId)
      .then(() => {
        res.redirect("/");
      })
      .catch((err) => {
        console.log("oh no");
      });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } }
    ).then((foundList) => {
      if (!foundList) {
        console.log("list not found");
      }

      res.redirect("/" + listName);
    });
  }
});

app.get("/:listKind", async function (req, res) {
  const customListName = _.capitalize(req.params.listKind);

  const foundList = await List.findOne({ name: customListName });
  if (!foundList) {
    try {
      const list = new List({
        name: customListName,
        items: defaultItems,
      });
      await list.save();
      res.redirect("/" + customListName);
    } catch (error) {
      console.log("error creating list", error);
    }
  } else {
    res.render("list", {
      listTitle: foundList.name,
      listItems: foundList.items,
    });
  }
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(process.env.PORT || 3000, function () {
  console.log("Server started on port 3000");
});
