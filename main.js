const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb://127.0.0.1:27017/rakeshA8_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const User = mongoose.model('User', {
  fullName: String,
  email: String,
  password: String,
});

app.post('/user/create', async (req, res) => {
  const { fullName, email, password } = req.body;
  console.log(fullName, email, password, req.body);

  if (!isFullNameValid(fullName)) {
    return res.status(400).json({ message: 'Username should be greater than 5 characters and can only have alphabets' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'Email should be a @northeastern.edu address' });
  }
  
  if (!isStrongPassword(password)) {
    return res.status(400).json({ message: 'Password must have a minimum length of 8 characters, with at least one uppercase letter, one lowercase letter, one number, and one special character' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = new User({ fullName, email, password: hashedPassword });

  try {
    await user.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    if (err.code === 11000) {
      res.status(409).json({ message: 'Email already exists' });
    } else {
      console.error('Error creating user:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
});

app.put('/user/edit', async (req, res) => {
  const { email, fullName, password } = req.body;

  if (!isFullNameValid(fullName)) {
    return res.status(400).json({ message: 'Username should be greater than 5 characters and can only have alphabets' });
  }

  if (!isStrongPassword(password)) {
    return res.status(400).json({ message: 'Invalid password. Ensure it has a minimum length of 8 characters, with at least one uppercase letter, one lowercase letter, one number, and one special character.' });
  }
  

  const hashedPassword = await bcrypt.hash(password, 10);

  
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (password && await bcrypt.compare(password, user.password)) {
      user.password = await bcrypt.hash(password, 10);
    }

    user.fullName = fullName;
    await user.save();
    res.status(200).json({ message: 'User details updated successfully' });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.delete('/user/delete', async (req, res) => {
  const email = req.body.email;

  try {
    const result = await User.deleteOne({ email });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/user/getAll', async (req, res) => {
  try {
    const users = await User.find({}, 'fullName email password');
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

function isValidEmail(email) {
  const regex = /^[A-Z0-9._%+-]+@northeastern\.edu$/i;
  var output = regex.test(email);
  console.log(email,output);
  return output;
}

function isStrongPassword(password) {
    // Example: Minimum length of 8 characters, with at least one uppercase letter,
    // one lowercase letter, one number, and one special character.
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    var output = regex.test(password);
    console.log(password,output);
    return output;
}

function isFullNameValid(fullName) {
    if (fullName.length < 5) {
      console.log(fullName, false);
        return false;
        
      }
    
    const regex = /^[A-Za-z\s'-]+$/;    
    var output = regex.test(fullName);
    console.log(fullName, output);
    return output;
}
