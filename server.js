const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());


mongoose.connect('mongodb+srv://kavaskar:2132@cluster0.aqy94.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

const User = require('./models/User');
const Expense = require('./models/Expense');
const Category = require('./models/Category');
const Tag = require('./models/Tag');
const auth = require('./middleware/auth');

const jwt = require('jsonwebtoken');

// Register a new user
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
  
    try {
      // Check if the user already exists
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ error: 'User already exists' });
      }
  
      // Create a new user
      user = new User({ username, email, password });
      await user.save();
  
      // Generate a JWT token
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '1h',
      });
  
      res.status(201).json({ token, message: 'User registered successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Error registering user' });
    }
  });

// User login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
  
    try {
      // Find the user by email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }
  
      // Check if the password matches
      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }
  
      // Generate a JWT token
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '1h',
      });
  
      res.json({ token });
    } catch (error) {
      res.status(500).json({ error: 'Error logging in user' });
    }
  });

app.post('/api/expenses', auth, async (req, res) => {
    const { summary, description, date, category, tags } = req.body;
    try {
      const expense = new Expense({
        user: req.userId,
        summary,
        description,
        date,
        category,
        tags,
      });
      await expense.save();
      res.status(201).send(expense);
    } catch (error) {
      res.status(400).send({ error: 'Error creating expense' });
    }
  });
  
  app.get('/api/expenses', auth, async (req, res) => {
    try {
      const expenses = await Expense.find({ user: req.userId });
      res.send(expenses);
    } catch (error) {
      res.status(500).send({ error: 'Error fetching expenses' });
    }
  });
  
  app.post('/api/expenses/duplicate/:id', auth, async (req, res) => {
    try {
      const expense = await Expense.findById(req.params.id);
      if (!expense || expense.user.toString() !== req.userId) {
        return res.status(404).send({ error: 'Expense not found' });
      }
      const newExpense = new Expense({
        user: req.userId,
        summary: expense.summary,
        description: expense.description,
        date: expense.date,
        category: expense.category,
        tags: expense.tags,
      });
      await newExpense.save();
      res.status(201).send(newExpense);
    } catch (error) {
      res.status(500).send({ error: 'Error duplicating expense' });
    }
  });

  app.get('/api/categories', auth, async (req, res) => {
    try {
      const categories = await Category.find({ user: req.userId });
      res.send(categories);
    } catch (error) {
      res.status(500).send({ error: 'Error fetching categories' });
    }
  });
  
  app.put('/api/categories/:id', auth, async (req, res) => {
    try {
      const category = await Category.findById(req.params.id);
      if (!category || category.user.toString() !== req.userId) {
        return res.status(404).send({ error: 'Category not found' });
      }
      category.name = req.body.name || category.name;
      await category.save();
      res.send(category);
    } catch (error) {
      res.status(500).send({ error: 'Error updating category' });
    }
  });
  
  app.delete('/api/categories/:id', auth, async (req, res) => {
    try {
      const category = await Category.findById(req.params.id);
      if (!category || category.user.toString() !== req.userId) {
        return res.status(404).send({ error: 'Category not found' });
      }
      await category.delete();
      res.send({ message: 'Category deleted' });
    } catch (error) {
      res.status(500).send({ error: 'Error deleting category' });
    }
  });
  


// Middleware to protect routes


// const Tag = require('./models/Tag');  // Make sure to include the Tag model

// Get all tags for the logged-in user
app.get('/api/tags', auth, async (req, res) => {
  try {
    const tags = await Tag.find({ user: req.userId });
    res.send(tags);
  } catch (error) {
    res.status(500).send({ error: 'Error fetching tags' });
  }
});

// Create a new tag
app.post('/api/tags', auth, async (req, res) => {
  const { name } = req.body;
  try {
    const existingTag = await Tag.findOne({ name, user: req.userId });
    if (existingTag) {
      return res.status(400).send({ error: 'Tag already exists' });
    }
    const tag = new Tag({ name, user: req.userId });
    await tag.save();
    res.status(201).send(tag);
  } catch (error) {
    res.status(400).send({ error: 'Error creating tag' });
  }
});

// Update an existing tag
app.put('/api/tags/:id', auth, async (req, res) => {
  try {
    const tag = await Tag.findById(req.params.id);
    if (!tag || tag.user.toString() !== req.userId) {
      return res.status(404).send({ error: 'Tag not found' });
    }
    tag.name = req.body.name || tag.name;
    await tag.save();
    res.send(tag);
  } catch (error) {
    res.status(500).send({ error: 'Error updating tag' });
  }
});

// Delete a tag
app.delete('/api/tags/:id', auth, async (req, res) => {
  try {
    const tag = await Tag.findById(req.params.id);
    if (!tag || tag.user.toString() !== req.userId) {
      return res.status(404).send({ error: 'Tag not found' });
    }
    await tag.delete();
    res.send({ message: 'Tag deleted' });
  } catch (error) {
    res.status(500).send({ error: 'Error deleting tag' });
  }
});


// Routes here

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
