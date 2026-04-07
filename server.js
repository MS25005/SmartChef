const app = require('./smartchef-backend/app'); // Importing the configured app
const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});